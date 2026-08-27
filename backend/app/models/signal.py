import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnalysisSignal(Base):
    __tablename__ = "analysis_signals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True, index=True)

    signal_name = Column(String(255), nullable=False)
    signal_category = Column(String(100), nullable=False)
    detected = Column(Boolean, nullable=False, default=False)
    weight = Column(Integer, nullable=False, default=0)
    value = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    availability = Column(String(50), nullable=False, default="AVAILABLE")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="signals")
    profile = relationship("Profile", foreign_keys=[profile_id])
