import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON
from app.core.database import Base

class DetectionDataset(Base):
    __tablename__ = "detection_dataset"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    platform = Column(String(100), nullable=False, index=True)
    username = Column(String(255), nullable=True, index=True)
    display_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)

    followers_count = Column(Integer, default=0, nullable=False)
    following_count = Column(Integer, default=0, nullable=False)
    posts_count = Column(Integer, default=0, nullable=False)
    account_age_days = Column(Integer, default=0, nullable=False)

    is_verified = Column(Boolean, default=False, nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)

    profile_image_reference = Column(Text, nullable=True)
    profile_url = Column(Text, nullable=True)

    label = Column(String(50), default="UNKNOWN", nullable=False, index=True) # FAKE, LEGITIMATE, SUSPICIOUS, UNKNOWN
    label_source = Column(String(100), nullable=True)
    dataset_source = Column(String(255), nullable=True)

    features = Column(JSON, default=dict, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
