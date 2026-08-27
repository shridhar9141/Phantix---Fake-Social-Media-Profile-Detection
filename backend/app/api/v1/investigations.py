from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.entity import Entity
from app.models.investigation import Investigation
from app.models.signal import AnalysisSignal
from app.models.connection import Connection
from app.models.event import InvestigationEvent
from app.models.profile import Profile

from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationDetail,
    InvestigationListItem,
    PaginatedInvestigations,
    SignalResponse,
    ConnectionResponse
)

from app.analyzers.classifier import URLClassifier
from app.analyzers.website_analyzer import WebsiteAnalyzer
from app.analyzers.social_analyzer import SocialProfileAnalyzer
from app.analyzers.reputation import ExternalReputationAnalyzer
from app.analyzers.image_similarity import fetch_and_hash_image
from app.scoring.risk_engine import RiskEngine
from app.connections.detector import ConnectionDetector
from app.services.profile_analysis_service import analyze_social_profile

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.post("", response_model=InvestigationDetail, status_code=status.HTTP_201_CREATED)
async def create_investigation(
    payload: InvestigationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a URL or @username for automated classification, multi-signal feature extraction,
    risk scoring, similarity matching, and connection detection.
    """
    raw_input = payload.url.strip()
    if not raw_input:
        raise HTTPException(status_code=400, detail="Input URL or username cannot be empty")

    # Normalize `@username` input to standard URL format
    if raw_input.startswith("@"):
        username = raw_input.lstrip("@").strip()
        raw_url = f"https://www.instagram.com/{username}/"
    else:
        raw_url = raw_input

    # 1. URL Classification & Normalization
    class_info = URLClassifier.classify(raw_url)
    normalized_url = class_info["normalized_url"]
    domain = class_info["domain"]
    entity_type = class_info["entity_type"]
    platform = class_info["platform"]

    if not domain:
        raise HTTPException(status_code=400, detail="Unable to extract a valid domain/platform from input")

    # 2. Get or Create Entity
    entity = db.query(Entity).filter(
        Entity.domain == domain,
        Entity.entity_type == entity_type
    ).first()

    if not entity:
        primary_id = class_info["path"].strip("/") if entity_type == "SOCIAL_PROFILE" else domain
        entity = Entity(
            entity_type=entity_type,
            primary_identifier=primary_id or domain,
            domain=domain,
            platform=platform
        )
        db.add(entity)
        db.commit()
        db.refresh(entity)

    # 3. Create Investigation Record
    investigation = Investigation(
        user_id=current_user.id,
        entity_id=entity.id,
        original_url=raw_input,
        normalized_url=normalized_url,
        entity_type=entity_type,
        domain=domain,
        platform=platform,
        status="PROCESSING",
        risk_score=0,
        risk_level="LOW"
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    # Log Progress Event
    evt1 = InvestigationEvent(
        investigation_id=investigation.id,
        user_id=current_user.id,
        event_type="URL_NORMALIZED",
        message=f"Normalized Target: {normalized_url} | Type: {entity_type} ({platform})"
    )
    db.add(evt1)

    # 4. Feature Signal Extraction Pipeline
    signals_data = []
    metadata = {}
    profile_data_dict = None

    if entity_type == "SOCIAL_PROFILE":
        username_match = class_info.get("extracted_identifier") or "target_user"
        existing_prof = db.query(Profile).filter(
            Profile.username == username_match,
            Profile.platform == platform
        ).first()

        analyzer = SocialProfileAnalyzer()
        res = await analyzer.analyze(normalized_url, platform, db=db, profile_obj=existing_prof)
        signals_data.extend(res["signals"])
        metadata = res["metadata"]

        # Fetch image perceptual hash if image URL is available
        img_url = metadata.get("profile_image_url")
        img_hash, _ = await fetch_and_hash_image(img_url) if img_url else (None, None)

        # Create or update Profile DB record
        username_val = metadata.get("username") or username_match
        profile_obj = existing_prof

        if not profile_obj:
            profile_obj = Profile(
                investigation_id=investigation.id,
                username=username_val,
                display_name=metadata.get("display_name"),
                platform=platform,
                profile_url=normalized_url,
                profile_image_url=img_url,
                bio=metadata.get("bio"),
                followers_count=metadata.get("followers_count"),
                following_count=metadata.get("following_count"),
                posts_count=metadata.get("posts_count"),
                raw_data={
                    "availability": metadata.get("availability", {}),
                    "image_hash": img_hash,
                    "status_message": metadata.get("status_message")
                }
            )
            db.add(profile_obj)
        else:
            profile_obj.investigation_id = investigation.id
            if metadata.get("display_name"):
                profile_obj.display_name = metadata.get("display_name")
            if img_url:
                profile_obj.profile_image_url = img_url
            if metadata.get("bio") and metadata.get("bio") != "No public bio provided.":
                profile_obj.bio = metadata.get("bio")
            if metadata.get("followers_count") is not None:
                profile_obj.followers_count = metadata.get("followers_count")
            if metadata.get("following_count") is not None:
                profile_obj.following_count = metadata.get("following_count")
            if metadata.get("posts_count") is not None:
                profile_obj.posts_count = metadata.get("posts_count")
            
            raw_dict = profile_obj.raw_data if isinstance(profile_obj.raw_data, dict) else {}
            raw_dict["availability"] = metadata.get("availability", {})
            if img_hash:
                raw_dict["image_hash"] = img_hash
            raw_dict["status_message"] = metadata.get("status_message")
            profile_obj.raw_data = raw_dict

        db.commit()
        db.refresh(profile_obj)

        # Run full Profile Analysis (Evidence, ProfileFeature, ProfileConnection, ProfileAnalysis)
        p_analysis = analyze_social_profile(db, profile_obj)

        # Build Profile response dictionary
        profile_data_dict = {
            "id": profile_obj.id,
            "username": profile_obj.username,
            "display_name": profile_obj.display_name,
            "platform": profile_obj.platform,
            "profile_url": profile_obj.profile_url,
            "profile_image_url": profile_obj.profile_image_url,
            "bio": profile_obj.bio,
            "followers_count": profile_obj.followers_count,
            "following_count": profile_obj.following_count,
            "posts_count": profile_obj.posts_count,
            "availability": profile_obj.raw_data.get("availability", {}) if isinstance(profile_obj.raw_data, dict) else {},
            "status_message": profile_obj.raw_data.get("status_message") if isinstance(profile_obj.raw_data, dict) else "Available"
        }
    else:
        analyzer = WebsiteAnalyzer()
        res = await analyzer.analyze(normalized_url, domain)
        signals_data.extend(res["signals"])
        metadata = res["metadata"]

    # External Threat Intelligence Feeds
    rep_analyzer = ExternalReputationAnalyzer()
    rep_signals = await rep_analyzer.analyze(domain, normalized_url)
    signals_data.extend(rep_signals)

    # 5. Risk Engine Calculation
    score, risk_level, summary = RiskEngine.calculate_risk(signals_data)

    # If social profile analysis produced an elevated risk score, ensure investigation matches
    if entity_type == "SOCIAL_PROFILE" and 'p_analysis' in locals() and p_analysis is not None:
        if p_analysis.risk_score > score:
            score = int(p_analysis.risk_score)
            risk_level = p_analysis.risk_level
            summary = p_analysis.analysis_data.get("summary_explanation", summary)

    # Update Investigation record
    investigation.risk_score = score
    investigation.risk_level = risk_level
    investigation.summary = summary
    investigation.status = "COMPLETED"
    investigation.completed_at = datetime.utcnow()

    # Clear any previous signals for this investigation to avoid duplicate records
    db.query(AnalysisSignal).filter(AnalysisSignal.investigation_id == investigation.id).delete()
    db.flush()

    # Save Signals
    signal_models = []
    seen_signals = set()
    for sig in signals_data:
        sig_name = sig.get("signal_name") or sig.get("name")
        if not sig_name or sig_name in seen_signals:
            continue
        seen_signals.add(sig_name)

        signal_obj = AnalysisSignal(
            investigation_id=investigation.id,
            profile_id=profile_obj.id if entity_type == "SOCIAL_PROFILE" and 'profile_obj' in locals() else None,
            signal_name=sig_name,
            signal_category=sig.get("signal_category") or sig.get("category", "General"),
            detected=sig.get("detected", False),
            weight=sig.get("weight", 0),
            value=sig.get("value"),
            explanation=sig.get("explanation", ""),
            availability=sig.get("availability", "AVAILABLE")
        )
        db.add(signal_obj)
        signal_models.append(signal_obj)

    db.commit()

    # 6. Connection Detection with previously investigated entities
    ConnectionDetector.detect_connections(db, entity, metadata)

    evt2 = InvestigationEvent(
        investigation_id=investigation.id,
        user_id=current_user.id,
        event_type="ANALYSIS_COMPLETED",
        message=f"Risk Score: {score}/100 ({risk_level}). {len(signal_models)} signals evaluated."
    )
    db.add(evt2)
    db.commit()
    db.refresh(investigation)

    # Fetch connections for detailed response
    connections = db.query(Connection).filter(
        or_(Connection.source_entity_id == entity.id, Connection.target_entity_id == entity.id)
    ).all()

    conn_responses = []
    for c in connections:
        other_entity_id = c.target_entity_id if c.source_entity_id == entity.id else c.source_entity_id
        other_ent = db.query(Entity).filter(Entity.id == other_entity_id).first()
        conn_responses.append(ConnectionResponse(
            id=c.id,
            source_entity_id=c.source_entity_id,
            target_entity_id=c.target_entity_id,
            connection_type=c.connection_type,
            connection_reason=c.connection_reason,
            similarity_score=c.similarity_score,
            target_domain=other_ent.domain if other_ent else None,
            target_platform=other_ent.platform if other_ent else None,
            created_at=c.created_at
        ))

    return InvestigationDetail(
        id=investigation.id,
        original_url=investigation.original_url,
        normalized_url=investigation.normalized_url,
        entity_type=investigation.entity_type,
        domain=investigation.domain,
        platform=investigation.platform,
        status=investigation.status,
        risk_score=investigation.risk_score,
        risk_level=investigation.risk_level,
        summary=investigation.summary,
        created_at=investigation.created_at,
        completed_at=investigation.completed_at,
        signals=[SignalResponse.model_validate(s) for s in signal_models],
        connections=conn_responses,
        profile=profile_data_dict
    )


@router.get("", response_model=PaginatedInvestigations)
def list_investigations(
    search: Optional[str] = Query(None, description="Search by URL or domain"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (SOCIAL_PROFILE, WEBSITE)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Investigation).filter(Investigation.user_id == current_user.id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Investigation.original_url.ilike(search_pattern),
                Investigation.normalized_url.ilike(search_pattern),
                Investigation.domain.ilike(search_pattern)
            )
        )

    if risk_level:
        query = query.filter(Investigation.risk_level == risk_level.upper())

    if entity_type:
        query = query.filter(Investigation.entity_type == entity_type.upper())

    total = query.count()
    pages = (total + limit - 1) // limit if total > 0 else 1
    offset = (page - 1) * limit

    items = query.order_by(desc(Investigation.created_at)).offset(offset).limit(limit).all()

    return PaginatedInvestigations(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        items=[InvestigationListItem.model_validate(i) for i in items]
    )


@router.get("/{id}", response_model=InvestigationDetail)
def get_investigation_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == id,
        Investigation.user_id == current_user.id
    ).first()

    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation record not found or access denied")

    signals = db.query(AnalysisSignal).filter(AnalysisSignal.investigation_id == investigation.id).all()

    conn_responses = []
    if investigation.entity_id:
        connections = db.query(Connection).filter(
            or_(
                Connection.source_entity_id == investigation.entity_id,
                Connection.target_entity_id == investigation.entity_id
            )
        ).all()

        for c in connections:
            other_entity_id = c.target_entity_id if c.source_entity_id == investigation.entity_id else c.source_entity_id
            other_ent = db.query(Entity).filter(Entity.id == other_entity_id).first()
            conn_responses.append(ConnectionResponse(
                id=c.id,
                source_entity_id=c.source_entity_id,
                target_entity_id=c.target_entity_id,
                connection_type=c.connection_type,
                connection_reason=c.connection_reason,
                similarity_score=c.similarity_score,
                target_domain=other_ent.domain if other_ent else None,
                target_platform=other_ent.platform if other_ent else None,
                created_at=c.created_at
            ))

    profile_data_dict = None
    if investigation.entity_type == "SOCIAL_PROFILE":
        profile_obj = db.query(Profile).filter(
            Profile.investigation_id == investigation.id
        ).first()

        if not profile_obj:
            from urllib.parse import urlparse
            parsed_u = urlparse(investigation.normalized_url)
            u_parts = [p for p in parsed_u.path.split("/") if p]
            if u_parts:
                u_handle = u_parts[0].lstrip("@")
                profile_obj = db.query(Profile).filter(
                    Profile.username == u_handle,
                    Profile.platform == investigation.platform
                ).first()

        if profile_obj:
            profile_data_dict = {
                "id": profile_obj.id,
                "username": profile_obj.username,
                "display_name": profile_obj.display_name,
                "platform": profile_obj.platform,
                "profile_url": profile_obj.profile_url,
                "profile_image_url": profile_obj.profile_image_url,
                "bio": profile_obj.bio,
                "followers_count": profile_obj.followers_count,
                "following_count": profile_obj.following_count,
                "posts_count": profile_obj.posts_count,
                "availability": profile_obj.raw_data.get("availability", {}) if isinstance(profile_obj.raw_data, dict) else {},
                "status_message": profile_obj.raw_data.get("status_message") if isinstance(profile_obj.raw_data, dict) else "Available"
            }

    return InvestigationDetail(
        id=investigation.id,
        original_url=investigation.original_url,
        normalized_url=investigation.normalized_url,
        entity_type=investigation.entity_type,
        domain=investigation.domain,
        platform=investigation.platform,
        status=investigation.status,
        risk_score=investigation.risk_score,
        risk_level=investigation.risk_level,
        summary=investigation.summary,
        created_at=investigation.created_at,
        completed_at=investigation.completed_at,
        signals=[SignalResponse.model_validate(s) for s in signals],
        connections=conn_responses,
        profile=profile_data_dict
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investigation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == id,
        Investigation.user_id == current_user.id
    ).first()

    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation record not found or access denied")

    db.delete(investigation)
    db.commit()
    return None
