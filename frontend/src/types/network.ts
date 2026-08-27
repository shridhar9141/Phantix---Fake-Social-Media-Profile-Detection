export interface NodeData {
  id: string;
  label: string;
  entity_type: string;
  platform: string;
  domain: string;
  risk_level: string;
  risk_score: number;
  investigation_id?: string | null;
}

export interface CytoscapeNode {
  data: NodeData;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  connection_type: string;
  reason: string;
  similarity_score: number;
}

export interface CytoscapeEdge {
  data: EdgeData;
}

export interface NetworkGraphData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
  total_entities: number;
  total_connections: number;
}
