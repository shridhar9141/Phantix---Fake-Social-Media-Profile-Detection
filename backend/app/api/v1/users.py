from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserSyncRequest, UserResponse, UserUpdate
from app.services.activity_service import log_activity

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/sync", response_model=UserResponse)
def sync_user(
    payload: UserSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    UPSERT mechanism: Creates or updates the PostgreSQL user after Firebase registration/login.
    Updates last_login_at and safe profile information.
    """
    # Use authenticated Firebase UID from verified token
    firebase_uid = current_user.firebase_uid

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        user = db.query(User).filter(User.email == payload.email).first()

    now = datetime.utcnow()
    is_new = False

    if not user:
        is_new = True
        user = User(
            firebase_uid=firebase_uid,
            email=payload.email,
            username=payload.username or payload.email.split("@")[0],
            display_name=payload.display_name or (payload.username or payload.email.split("@")[0]),
            created_at=now,
            last_login_at=now
        )
        db.add(user)
    else:
        user.last_login_at = now
        if payload.display_name:
            user.display_name = payload.display_name
        if payload.username and not user.username:
            user.username = payload.username

    db.commit()
    db.refresh(user)

    # Log activity
    act_type = "USER_REGISTERED" if is_new else "USER_LOGGED_IN"
    log_activity(
        db=db,
        user_id=user.id,
        activity_type=act_type,
        metadata_info={"email": user.email, "display_name": user.display_name}
    )

    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user.
    """
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.display_name:
        current_user.display_name = payload.display_name.strip()
        db.commit()
        db.refresh(current_user)
    return current_user
