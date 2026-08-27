from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.entity import Entity
from app.models.investigation import Investigation
from app.models.connection import Connection

from app.schemas.network import (
    NetworkGraphResponse,
    CytoscapeNode,
    NodeData,
    CytoscapeEdge,
    EdgeData
)

router = APIRouter(prefix="/network", tags=["Network Analysis Graph"])

@router.get("", response_model=NetworkGraphResponse)
def get_network_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Constructs the Cytoscape.js network graph nodes and edges for the user's investigated entities.
    Returns zero nodes/edges for users with no investigations.
    """
    user_invs = db.query(Investigation).filter(Investigation.user_id == current_user.id).all()
    if not user_invs:
        return NetworkGraphResponse(nodes=[], edges=[], total_entities=0, total_connections=0)

    entity_map = {}
    inv_map = {}
    for inv in user_invs:
        if inv.entity_id:
            inv_map[inv.entity_id] = inv

    entity_ids = list(inv_map.keys())

    if not entity_ids:
        return NetworkGraphResponse(nodes=[], edges=[], total_entities=0, total_connections=0)

    entities = db.query(Entity).filter(Entity.id.in_(entity_ids)).all()

    nodes: list[CytoscapeNode] = []
    for ent in entities:
        inv = inv_map.get(ent.id)
        risk_level = inv.risk_level if inv else "LOW"
        risk_score = inv.risk_score if inv else 0
        inv_id = inv.id if inv else None

        label = f"{ent.platform}: {ent.primary_identifier}" if ent.entity_type == "SOCIAL_PROFILE" else ent.domain

        nodes.append(
            CytoscapeNode(
                data=NodeData(
                    id=ent.id,
                    label=label,
                    entity_type=ent.entity_type,
                    platform=ent.platform,
                    domain=ent.domain,
                    risk_level=risk_level,
                    risk_score=risk_score,
                    investigation_id=inv_id
                )
            )
        )

    # Fetch connections involving these entities
    connections = db.query(Connection).filter(
        or_(
            Connection.source_entity_id.in_(entity_ids),
            Connection.target_entity_id.in_(entity_ids)
        )
    ).all()

    edges: list[CytoscapeEdge] = []
    for c in connections:
        edges.append(
            CytoscapeEdge(
                data=EdgeData(
                    id=c.id,
                    source=c.source_entity_id,
                    target=c.target_entity_id,
                    connection_type=c.connection_type,
                    reason=c.connection_reason,
                    similarity_score=c.similarity_score
                )
            )
        )

    return NetworkGraphResponse(
        nodes=nodes,
        edges=edges,
        total_entities=len(nodes),
        total_connections=len(edges)
    )
