from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.profile_analysis import ProfileAnalysis
from app.models.profile_connection import ProfileConnection
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileDetailResponse,
    ProfileAnalysisResponse,
    ProfileConnectionResponse
)
from app.services.profile_analysis_service import analyze_social_profile
from app.services.activity_service import log_activity

router = APIRouter(prefix="/profiles", tags=["Social Media Profiles"])

@router.post("", response_model=ProfileResponse)
def create_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new social media profile entry.
    """
    existing = db.query(Profile).filter(
        Profile.platform == payload.platform,
        Profile.username == payload.username
    ).first()
    if existing:
        return existing

    profile = Profile(
        username=payload.username,
        display_name=payload.display_name,
        platform=payload.platform,
        profile_url=payload.profile_url,
        profile_image_url=payload.profile_image_url,
        bio=payload.bio,
        followers=payload.followers_count,
        following=payload.following_count,
        post_count=payload.posts_count,
        followers_count=payload.followers_count,
        following_count=payload.following_count,
        posts_count=payload.posts_count,
        account_age_days=payload.account_age_days,
        is_verified=payload.is_verified,
        is_private=payload.is_private,
        website_url=payload.website_url,
        email=payload.email,
        phone=payload.phone,
        location=payload.location,
        raw_data=payload.raw_data or {}
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="PROFILE_ADDED",
        platform=payload.platform,
        metadata_info={"username": payload.username}
    )

    return profile

@router.get("", response_model=List[ProfileResponse])
def list_profiles(
    platform: Optional[str] = None,
    username: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Profile)
    if platform:
        query = query.filter(Profile.platform.ilike(f"%{platform}%"))
    if username:
        query = query.filter(Profile.username.ilike(f"%{username}%"))
    return query.order_by(Profile.created_at.desc()).limit(limit).all()

@router.get("/{id}", response_model=ProfileDetailResponse)
def get_profile_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile

@router.post("/{id}/analyze", response_model=ProfileAnalysisResponse)
def analyze_profile_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    analysis = analyze_social_profile(db, profile)

    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="PROFILE_ANALYZED",
        platform=profile.platform,
        metadata_info={"username": profile.username, "risk_score": float(analysis.risk_score)}
    )

    return analysis

@router.get("/{id}/analysis", response_model=ProfileAnalysisResponse)
def get_profile_analysis_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(ProfileAnalysis).filter(ProfileAnalysis.profile_id == id).first()
    if not analysis:
        profile = db.query(Profile).filter(Profile.id == id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found.")
        analysis = analyze_social_profile(db, profile)
    return analysis

@router.get("/{id}/connections", response_model=List[ProfileConnectionResponse])
def get_profile_connections_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ProfileConnection).filter(
        (ProfileConnection.profile_id_1 == id) | (ProfileConnection.profile_id_2 == id)
    ).all()
