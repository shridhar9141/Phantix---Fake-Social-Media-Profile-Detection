from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_activity import UserActivity
from app.schemas.activity import UserActivityResponse, PaginatedActivities

router = APIRouter(prefix="/activity", tags=["Activity Log"])

@router.get("", response_model=PaginatedActivities)
def get_user_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves paginated search and investigation activity history for the authenticated user.
    """
    query = db.query(UserActivity).filter(UserActivity.user_id == current_user.id)
    total = query.count()
    items = query.order_by(UserActivity.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/recent", response_model=List[UserActivityResponse])
def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves recent user activities for dashboard feeds.
    """
    return db.query(UserActivity).filter(
        UserActivity.user_id == current_user.id
    ).order_by(UserActivity.created_at.desc()).limit(limit).all()
