from typing import List, Optional
from pydantic import BaseModel

class NodeData(BaseModel):
    id: str
    label: str
    entity_type: str
    platform: str
    domain: str
    risk_level: str
    risk_score: int
    investigation_id: Optional[str] = None

class CytoscapeNode(BaseModel):
    data: NodeData

class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    connection_type: str
    reason: str
    similarity_score: float

class CytoscapeEdge(BaseModel):
    data: EdgeData

class NetworkGraphResponse(BaseModel):
    nodes: List[CytoscapeNode] = []
    edges: List[CytoscapeEdge] = []
    total_entities: int = 0
    total_connections: int = 0
