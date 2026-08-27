from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.investigation import SignalResponse

class ComplaintCreate(BaseModel):
    investigation_id: str
    title: str
    category: str
    description: str
    included_signal_ids: Optional[List[str]] = []

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    included_signal_ids: Optional[List[str]] = None

class ComplaintConfirm(BaseModel):
    user_confirmed: bool

class ComplaintEvidenceItem(BaseModel):
    id: str
    signal_id: str
    included: bool
    signal: Optional[SignalResponse] = None

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: str
    complaint_identifier: str
    user_id: str
    investigation_id: str
    title: str
    category: str
    description: str
    status: str
    user_confirmed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetailResponse(BaseModel):
    id: str
    complaint_identifier: str
    user_id: str
    investigation_id: str
    title: str
    category: str
    description: str
    status: str
    user_confirmed: bool
    created_at: datetime
    
    # Target investigation context
    domain: str
    normalized_url: str
    platform: str
    risk_score: int
    risk_level: str
    
    # Evidence list
    evidence_items: List[ComplaintEvidenceItem] = []
    
    # Text declarations
    declaration: str

    class Config:
        from_attributes = True
