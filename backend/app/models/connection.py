import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Connection(Base):
    __tablename__ = "connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    connection_type = Column(String(100), nullable=False) # REDIRECT_TARGET, BRAND_SIMILARITY, SHARED_DOMAIN, PROFILE_LINK, INDICATOR_OVERLAP
    connection_reason = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])
