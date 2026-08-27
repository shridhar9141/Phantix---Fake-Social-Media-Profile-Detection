from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.investigation import SignalResponse, ConnectionResponse

class ReportResponse(BaseModel):
    id: str
    report_identifier: str
    investigation_id: str
    generated_by_user_id: str
    report_type: str
    risk_score: int
    risk_level: str
    status: str
    generated_at: datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(BaseModel):
    id: str
    report_identifier: str
    investigation_id: str
    generated_by_user_id: str
    report_type: str
    risk_score: int
    risk_level: str
    status: str
    generated_at: datetime
    
    # Target subject details
    target_type: str
    original_url: str
    normalized_url: str
    domain: str
    platform: str
    profile: Optional[dict] = None
    
    # Authenticity Verdict
    verdict: Optional[str] = None
    verdict_badge: Optional[str] = None
    verdict_color: Optional[str] = None
    verdict_desc: Optional[str] = None
    
    # Actual detected signals
    signals: List[SignalResponse] = []
    
    # Related connections
    connections: List[ConnectionResponse] = []
    
    # Text Sections
    summary: Optional[str] = None
    limitations: List[str] = []
    disclaimer: str

    class Config:
        from_attributes = True
