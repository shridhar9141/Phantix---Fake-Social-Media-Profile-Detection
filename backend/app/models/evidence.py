from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)

    evidence_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Numeric(5, 2), default=1.0, nullable=True)
    severity = Column(String(20), default="MEDIUM", nullable=True)
    title = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)
    source_url = Column(Text, nullable=True)
    metadata_info = Column("metadata", JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="evidence_items")
