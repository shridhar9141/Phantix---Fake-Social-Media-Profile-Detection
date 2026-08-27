from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class EvidenceResponse(BaseModel):
    id: int
    profile_id: int
    evidence_type: str
    description: str
    confidence: Optional[float] = 1.0
    severity: Optional[str] = "MEDIUM"
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileAnalysisResponse(BaseModel):
    id: int
    profile_id: int
    risk_score: float
    risk_level: str
    fake_probability: float
    analysis_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileConnectionResponse(BaseModel):
    id: int
    profile_id_1: int
    profile_id_2: int
    connection_type: str
    explanation: Optional[str] = None
    similarity_score: Optional[float] = 1.0
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileCreate(BaseModel):
    username: str
    display_name: Optional[str] = None
    platform: str
    profile_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    account_age_days: int = 0
    is_verified: bool = False
    is_private: bool = False
    website_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None

class ProfileResponse(BaseModel):
    id: int
    investigation_id: Optional[str] = None
    username: str
    display_name: Optional[str] = None
    platform: str
    profile_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    followers_count: Optional[int] = 0
    following_count: Optional[int] = 0
    posts_count: Optional[int] = 0
    account_age_days: Optional[int] = 0
    is_verified: Optional[bool] = False
    is_private: Optional[bool] = False
    website_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileDetailResponse(ProfileResponse):
    analysis: Optional[ProfileAnalysisResponse] = None
    evidence_items: List[EvidenceResponse] = []
