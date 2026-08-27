import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)

    activity_type = Column(String(100), nullable=False, index=True) # USER_REGISTERED, USER_LOGGED_IN, URL_SEARCHED, etc.
    search_url = Column(Text, nullable=True)
    normalized_url = Column(Text, nullable=True)
    platform = Column(String(100), nullable=True)

    metadata_info = Column("metadata", JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="activities")
    investigation = relationship("Investigation", foreign_keys=[investigation_id])
