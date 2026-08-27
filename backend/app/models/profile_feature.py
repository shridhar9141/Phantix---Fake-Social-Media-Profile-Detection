import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProfileFeature(Base):
    __tablename__ = "profile_features"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)

    username_similarity_score = Column(Float, default=0.0, nullable=False)
    display_name_similarity_score = Column(Float, default=0.0, nullable=False)
    follower_following_ratio = Column(Float, default=0.0, nullable=False)
    account_age_score = Column(Float, default=0.0, nullable=False)
    activity_score = Column(Float, default=0.0, nullable=False)
    profile_completeness_score = Column(Float, default=0.0, nullable=False)
    duplicate_image_score = Column(Float, default=0.0, nullable=False)
    bio_similarity_score = Column(Float, default=0.0, nullable=False)
    suspicious_link_score = Column(Float, default=0.0, nullable=False)

    metadata_info = Column("metadata", JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="features")
