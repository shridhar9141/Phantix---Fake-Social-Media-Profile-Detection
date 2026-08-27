from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class InvestigationCreate(BaseModel):
    url: str = Field(..., description="The URL to submit for analysis")

class SignalResponse(BaseModel):
    id: str
    signal_name: str
    signal_category: str
    detected: bool
    weight: int
    value: Optional[str] = None
    explanation: str
    availability: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConnectionResponse(BaseModel):
    id: str
    source_entity_id: str
    target_entity_id: str
    connection_type: str
    connection_reason: str
    similarity_score: float
    target_domain: Optional[str] = None
    target_platform: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvestigationListItem(BaseModel):
    id: str
    original_url: str
    normalized_url: str
    entity_type: str
    domain: str
    platform: str
    status: str
    risk_score: int
    risk_level: str
    summary: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvestigationDetail(InvestigationListItem):
    signals: List[SignalResponse] = []
    connections: List[ConnectionResponse] = []
    profile: Optional[dict] = None

InvestigationDetailResponse = InvestigationDetail


class PaginatedInvestigations(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: List[InvestigationListItem]
