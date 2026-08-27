from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProfileAnalysis(Base):
    __tablename__ = "profile_analysis"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)

    risk_score = Column(Numeric(5, 2), default=0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False, index=True)
    fake_probability = Column(Numeric(5, 2), default=0.0, nullable=False)

    analysis_data = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="analysis")
