from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user_activity import UserActivity

def log_activity(
    db: Session,
    user_id: str,
    activity_type: str,
    investigation_id: Optional[str] = None,
    search_url: Optional[str] = None,
    normalized_url: Optional[str] = None,
    platform: Optional[str] = None,
    metadata_info: Optional[Dict[str, Any]] = None
) -> UserActivity:
    """
    Logs meaningful user activity to PostgreSQL user_activity table.
    Supported types:
      - USER_REGISTERED
      - USER_LOGGED_IN
      - URL_SEARCHED
      - INVESTIGATION_CREATED
      - PROFILE_ADDED
      - PROFILE_ANALYZED
      - EVIDENCE_VIEWED
      - REPORT_GENERATED
      - INVESTIGATION_COMPLETED
    """
    activity = UserActivity(
        user_id=user_id,
        investigation_id=investigation_id,
        activity_type=activity_type,
        search_url=search_url,
        normalized_url=normalized_url,
        platform=platform,
        metadata_info=metadata_info or {}
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
