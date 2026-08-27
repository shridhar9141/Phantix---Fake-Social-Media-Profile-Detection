from typing import List
from sqlalchemy.orm import Session
from app.models.entity import Entity
from app.models.connection import Connection

class ConnectionDetector:
    @staticmethod
    def detect_connections(db: Session, target_entity: Entity, metadata: dict) -> List[Connection]:
        """
        Scans existing database entities to discover real technical & identity relationships.
        Creates bidirectional or directed connection records.
        """
        connections: List[Connection] = []
        if not target_entity:
            return connections

        # Fetch all other existing entities
        existing_entities = db.query(Entity).filter(Entity.id != target_entity.id).all()

        for existing in existing_entities:
            conn_type = None
            reason = None
            similarity = 1.0

            # 1. Exact Domain Match (e.g. website & social profile share same root domain or redirect target)
            if existing.domain == target_entity.domain:
                conn_type = "SHARED_DOMAIN"
                reason = f"Both entities share identical root domain infrastructure ({target_entity.domain})"
                similarity = 1.0

            # 2. Redirect Target Link
            elif metadata.get("final_url") and existing.domain in metadata["final_url"]:
                conn_type = "REDIRECT_TARGET"
                reason = f"Investigation URL redirects directly to entity domain ({existing.domain})"
                similarity = 0.95

            # 3. Brand Similarity
            elif len(target_entity.domain) > 4 and len(existing.domain) > 4:
                # Check string similarity/overlap
                clean_target = target_entity.domain.split(".")[0].replace("-", "")
                clean_existing = existing.domain.split(".")[0].replace("-", "")
                if clean_target in clean_existing or clean_existing in clean_target:
                    conn_type = "BRAND_SIMILARITY"
                    reason = f"Entities share high brand name similarity ({clean_target} ~ {clean_existing})"
                    similarity = 0.85

            if conn_type:
                # Check if connection already exists to avoid duplicates
                exists = db.query(Connection).filter(
                    ((Connection.source_entity_id == target_entity.id) & (Connection.target_entity_id == existing.id)) |
                    ((Connection.source_entity_id == existing.id) & (Connection.target_entity_id == target_entity.id))
                ).first()

                if not exists:
                    connection = Connection(
                        source_entity_id=target_entity.id,
                        target_entity_id=existing.id,
                        connection_type=conn_type,
                        connection_reason=reason,
                        similarity_score=similarity
                    )
                    db.add(connection)
                    connections.append(connection)

        if connections:
            db.commit()

        return connections
