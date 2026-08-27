from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.investigation import Investigation
from app.models.event import InvestigationEvent

from app.schemas.dashboard import DashboardStatsResponse, RiskDistribution, ActivityItem
from app.schemas.investigation import InvestigationListItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes dynamic dashboard statistics derived strictly from actual user investigation records.
    Returns zero metrics for a newly registered user.
    """
    user_invs = db.query(Investigation).filter(Investigation.user_id == current_user.id)
    total_count = user_invs.count()

    if total_count == 0:
        return DashboardStatsResponse(
            total_investigations=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            risk_distribution=RiskDistribution(low=0, medium=0, high=0, critical=0),
            recent_investigations=[],
            recent_activity=[]
        )

    low_c = db.query(Investigation).filter(Investigation.user_id == current_user.id, Investigation.risk_level == "LOW").count()
    med_c = db.query(Investigation).filter(Investigation.user_id == current_user.id, Investigation.risk_level == "MEDIUM").count()
    high_c = db.query(Investigation).filter(Investigation.user_id == current_user.id, Investigation.risk_level == "HIGH").count()
    crit_c = db.query(Investigation).filter(Investigation.user_id == current_user.id, Investigation.risk_level == "CRITICAL").count()

    high_risk_total = high_c + crit_c

    recent_invs = user_invs.order_by(desc(Investigation.created_at)).limit(5).all()

    recent_evts = db.query(InvestigationEvent).filter(
        InvestigationEvent.user_id == current_user.id
    ).order_by(desc(InvestigationEvent.timestamp)).limit(10).all()

    return DashboardStatsResponse(
        total_investigations=total_count,
        high_risk_count=high_risk_total,
        medium_risk_count=med_c,
        low_risk_count=low_c,
        risk_distribution=RiskDistribution(
            low=low_c,
            medium=med_c,
            high=high_c,
            critical=crit_c
        ),
        recent_investigations=[InvestigationListItem.model_validate(i) for i in recent_invs],
        recent_activity=[
            ActivityItem(
                id=e.id,
                event_type=e.event_type,
                message=e.message,
                timestamp=e.timestamp
            ) for e in recent_evts
        ]
    )
