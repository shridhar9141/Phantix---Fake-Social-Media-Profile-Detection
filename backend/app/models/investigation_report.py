import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_identifier = Column(String(50), unique=True, nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    report_type = Column(String(50), nullable=False, default="HIGH_RISK_INCIDENT")
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False, default="HIGH")
    status = Column(String(50), nullable=False, default="GENERATED") # GENERATED, ARCHIVED
    
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    investigation = relationship("Investigation", foreign_keys=[investigation_id])
    generated_by_user = relationship("User", foreign_keys=[generated_by_user_id])
