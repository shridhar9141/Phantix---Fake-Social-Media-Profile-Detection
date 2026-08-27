from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.detection_dataset import DetectionDataset
from app.schemas.dataset import DetectionDatasetCreate, DetectionDatasetItem
from app.services.seed_dataset import seed_synthetic_dataset

router = APIRouter(prefix="/dataset", tags=["Detection Evaluation Dataset"])

@router.get("", response_model=List[DetectionDatasetItem])
def get_dataset(
    platform: Optional[str] = None,
    label: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns synthetic and verified profile evaluation dataset items.
    """
    query = db.query(DetectionDataset)
    if platform:
        query = query.filter(DetectionDataset.platform.ilike(f"%{platform}%"))
    if label:
        query = query.filter(DetectionDataset.label == label.upper())
    return query.order_by(DetectionDataset.created_at.desc()).limit(limit).all()

@router.post("", response_model=DetectionDatasetItem)
def create_dataset_item(
    payload: DetectionDatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds a new profile sample to the evaluation dataset pool.
    """
    item = DetectionDataset(
        platform=payload.platform,
        username=payload.username,
        display_name=payload.display_name,
        bio=payload.bio,
        followers_count=payload.followers_count,
        following_count=payload.following_count,
        posts_count=payload.posts_count,
        account_age_days=payload.account_age_days,
        is_verified=payload.is_verified,
        is_private=payload.is_private,
        profile_image_reference=payload.profile_image_reference,
        profile_url=payload.profile_url,
        label=payload.label.upper(),
        label_source=payload.label_source or "Manual Analyst Label",
        dataset_source=payload.dataset_source or "Phantix Platform",
        features=payload.features or {},
        notes=payload.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/seed")
def trigger_seed_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Populates synthetic demonstration profiles for hackathon evaluation.
    """
    count = seed_synthetic_dataset(db)
    return {"message": f"Successfully seeded {count} synthetic benchmark profiles.", "count": count}
