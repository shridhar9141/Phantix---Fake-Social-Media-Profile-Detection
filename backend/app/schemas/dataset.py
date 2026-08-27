from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class DetectionDatasetCreate(BaseModel):
    platform: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    account_age_days: int = 0
    is_verified: bool = False
    is_private: bool = False
    profile_image_reference: Optional[str] = None
    profile_url: Optional[str] = None
    label: str = "UNKNOWN" # FAKE, LEGITIMATE, SUSPICIOUS, UNKNOWN
    label_source: Optional[str] = None
    dataset_source: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class DetectionDatasetItem(BaseModel):
    id: str
    platform: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int
    following_count: int
    posts_count: int
    account_age_days: int
    is_verified: bool
    is_private: bool
    profile_image_reference: Optional[str] = None
    profile_url: Optional[str] = None
    label: str
    label_source: Optional[str] = None
    dataset_source: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
