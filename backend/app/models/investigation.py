import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_id = Column(String(36), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True, index=True)
    
    original_url = Column(Text, nullable=False)
    normalized_url = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=False, index=True) # SOCIAL_PROFILE, WEBSITE
    domain = Column(String(255), nullable=False, index=True)
    platform = Column(String(100), nullable=False, default="Website")
    
    status = Column(String(50), nullable=False, default="PROCESSING", index=True) # PROCESSING, COMPLETED, FAILED
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False, default="LOW", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="investigations")
    entity = relationship("Entity", back_populates="investigations")
    signals = relationship("AnalysisSignal", back_populates="investigation", cascade="all, delete-orphan")
    events = relationship("InvestigationEvent", back_populates="investigation", cascade="all, delete-orphan")
