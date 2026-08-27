from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserActivityResponse(BaseModel):
    id: str
    user_id: str
    investigation_id: Optional[str] = None
    activity_type: str
    search_url: Optional[str] = None
    normalized_url: Optional[str] = None
    platform: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedActivities(BaseModel):
    items: List[UserActivityResponse]
    total: int
    page: int
    limit: int
