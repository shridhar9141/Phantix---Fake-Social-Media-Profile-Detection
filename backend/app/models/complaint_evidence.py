import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class ComplaintEvidence(Base):
    __tablename__ = "complaint_evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_id = Column(String(36), ForeignKey("analysis_signals.id", ondelete="CASCADE"), nullable=False, index=True)
    included = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="evidence_links")
    signal = relationship("AnalysisSignal", foreign_keys=[signal_id])
