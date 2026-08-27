from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel
from app.schemas.investigation import InvestigationListItem

class ActivityItem(BaseModel):
    id: str
    event_type: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class RiskDistribution(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0

class DashboardStatsResponse(BaseModel):
    total_investigations: int = 0
    high_risk_count: int = 0
    medium_risk_count: int = 0
    low_risk_count: int = 0
    risk_distribution: RiskDistribution
    recent_investigations: List[InvestigationListItem] = []
    recent_activity: List[ActivityItem] = []
