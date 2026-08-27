from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="SET NULL"), nullable=True, index=True)

    username = Column(String(100), nullable=False, index=True)
    display_name = Column(String(150), nullable=True)
    platform = Column(String(50), nullable=False, index=True)
    profile_url = Column(Text, nullable=True)
    profile_image_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)

    followers = Column(Integer, default=0, nullable=True)
    following = Column(Integer, default=0, nullable=True)
    post_count = Column(Integer, default=0, nullable=True)

    followers_count = Column(Integer, default=0, nullable=True)
    following_count = Column(Integer, default=0, nullable=True)
    posts_count = Column(Integer, default=0, nullable=True)
    account_age_days = Column(Integer, default=0, nullable=True)

    is_verified = Column(Boolean, default=False, nullable=True)
    is_private = Column(Boolean, default=False, nullable=True)
    account_created_date = Column(DateTime, nullable=True)

    website_url = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    location = Column(Text, nullable=True)
    external_profile_id = Column(String(255), nullable=True)

    raw_data = Column(JSON, default=dict, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    investigation = relationship("Investigation", foreign_keys=[investigation_id])
    analysis = relationship("ProfileAnalysis", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="profile", cascade="all, delete-orphan")
    features = relationship("ProfileFeature", back_populates="profile", uselist=False, cascade="all, delete-orphan")
