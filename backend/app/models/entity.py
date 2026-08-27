import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False, index=True) # SOCIAL_PROFILE, WEBSITE
    primary_identifier = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)
    platform = Column(String(100), nullable=False) # Instagram, X, GitHub, Web, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigations = relationship("Investigation", back_populates="entity")
