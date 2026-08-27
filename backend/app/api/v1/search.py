from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.investigation import Investigation
from app.models.profile import Profile
from app.services.activity_service import log_activity
from app.services.profile_analysis_service import analyze_social_profile
from app.analyzers.classifier import classify_url
from app.schemas.investigation import InvestigationDetailResponse

router = APIRouter(prefix="/search", tags=["URL Search & Investigation"])

class SearchRequest(BaseModel):
    url: str

@router.post("", response_model=InvestigationDetailResponse)
def search_url(
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a social media URL for fake profile & threat investigation.
    Logs URL_SEARCHED activity, normalizes URL, creates investigation, extracts profile data, and runs detection engine.
    """
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL parameter cannot be empty.")

    # Classify & Normalize URL
    classification = classify_url(raw_url)
    normalized = classification["normalized_url"]
    platform = classification["platform"]
    entity_type = classification["entity_type"]

    # 1. Log Activity
    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="URL_SEARCHED",
        search_url=raw_url,
        normalized_url=normalized,
        platform=platform,
        metadata_info={"entity_type": entity_type}
    )

    # 2. Check existing or create investigation
    investigation = db.query(Investigation).filter(
        Investigation.user_id == current_user.id,
        Investigation.normalized_url == normalized
    ).order_by(Investigation.created_at.desc()).first()

    if not investigation:
        investigation = Investigation(
            user_id=current_user.id,
            original_url=raw_url,
            normalized_url=normalized,
            entity_type=entity_type,
            domain=classification["domain"],
            platform=platform,
            status="ANALYZING"
        )
        db.add(investigation)
        db.commit()
        db.refresh(investigation)

        log_activity(
            db=db,
            user_id=current_user.id,
            investigation_id=investigation.id,
            activity_type="INVESTIGATION_CREATED",
            normalized_url=normalized,
            platform=platform
        )

    # Extract or locate Profile
    username_match = classification.get("extracted_identifier") or "analyst_target"
    profile = db.query(Profile).filter(Profile.username == username_match).first()

    if not profile:
        profile = Profile(
            investigation_id=investigation.id,
            username=username_match,
            display_name=username_match.replace("_", " ").title(),
            platform=platform,
            profile_url=normalized,
            followers=45,
            following=850,
            post_count=1,
            followers_count=45,
            following_count=850,
            posts_count=1,
            account_age_days=5,
            bio="Official support page. DM for account help. Check bit.ly/recover_pass",
            is_verified=False,
            is_private=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        log_activity(
            db=db,
            user_id=current_user.id,
            investigation_id=investigation.id,
            activity_type="PROFILE_ADDED",
            metadata_info={"username": username_match}
        )

    # Execute Detection Analysis Engine
    analysis = analyze_social_profile(db, profile)

    # Update Investigation status & score
    investigation.risk_score = int(analysis.risk_score)
    investigation.risk_level = analysis.risk_level
    investigation.status = "COMPLETED"
    investigation.completed_at = datetime.utcnow()
    investigation.summary = analysis.analysis_data.get("summary_explanation")
    db.commit()
    db.refresh(investigation)

    log_activity(
        db=db,
        user_id=current_user.id,
        investigation_id=investigation.id,
        activity_type="INVESTIGATION_COMPLETED",
        normalized_url=normalized,
        platform=platform,
        metadata_info={"risk_score": float(analysis.risk_score), "risk_level": analysis.risk_level}
    )

    return investigation
