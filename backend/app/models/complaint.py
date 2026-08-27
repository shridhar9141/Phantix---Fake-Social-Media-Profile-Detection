import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_identifier = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="Suspicious Website")
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT", index=True) # DRAFT, READY, SUBMITTED
    user_confirmed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    investigation = relationship("Investigation", foreign_keys=[investigation_id])
    evidence_links = relationship("ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan")
