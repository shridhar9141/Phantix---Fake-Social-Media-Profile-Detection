from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProfileConnection(Base):
    __tablename__ = "profile_connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id_1 = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id_2 = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)

    connection_type = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=True)
    similarity_score = Column(Numeric(5, 2), default=1.0, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile_1 = relationship("Profile", foreign_keys=[profile_id_1])
    profile_2 = relationship("Profile", foreign_keys=[profile_id_2])
