import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { NetworkGraphData, NodeData, EdgeData } from '../../types/network';
import { ZoomIn, ZoomOut, RefreshCw, X, ArrowUpRight, ShieldAlert, Network, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';

if (typeof cytoscape !== 'undefined') {
  try {
    cytoscape.use(fcose);
  } catch {
    // Already registered or fallback
  }
}

interface NetworkGraphCanvasProps {
  data: NetworkGraphData;
}

export const NetworkGraphCanvas: React.FC<NetworkGraphCanvasProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null);

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    // Filter nodes based on user selections
    const filteredNodes = data.nodes.filter((n) => {
      if (filterType !== 'ALL' && n.data.entity_type !== filterType) return false;
      if (filterRisk !== 'ALL' && n.data.risk_level !== filterRisk) return false;
      return true;
    });

    const validNodeIds = new Set(filteredNodes.map((n) => n.data.id));

    // Filter edges whose endpoints are both visible
    const filteredEdges = data.edges.filter(
      (e) => validNodeIds.has(e.data.source) && validNodeIds.has(e.data.target)
    );

    const elements = [
      ...filteredNodes,
      ...filteredEdges
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'font-family': 'JetBrains Mono, monospace',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': (ele) => {
              const risk = ele.data('risk_level');
              if (risk === 'CRITICAL') return '#ef4444';
              if (risk === 'HIGH') return '#f97316';
              if (risk === 'MEDIUM') return '#f59e0b';
              return '#10b981';
            },
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': '#1e293b',
            'transition-property': 'background-color, border-color, border-width',
            'transition-duration': 0.2
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#06b6d4',
            'width': 34,
            'height': 34
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(connection_type)',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -8
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3,
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'color': '#06b6d4'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 90
      }
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data() as NodeData;
      setSelectedNode(nodeData);
      setSelectedEdge(null);
    });

    cy.on('tap', 'edge', (evt) => {
      const edgeData = evt.target.data() as EdgeData;
      setSelectedEdge(edgeData);
      setSelectedNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, filterType, filterRisk]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleResetFit = () => cyRef.current?.fit();

  if (data.nodes.length === 0) {
    return (
      <div className="cyber-card p-12 text-center flex flex-col items-center justify-center my-6">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-4 text-cyan-400">
          <Network className="w-8 h-8 opacity-90" />
        </div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">No Entity Relationships Discovered</h3>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          No entity relationships have been discovered yet. Submit new URLs for analysis to automatically detect brand, domain, and redirect networks.
        </p>
        <Link to="/investigate" className="cyber-btn-primary text-sm">
          Submit URL for Investigation
        </Link>
      </div>
    );
  }

  return (
    <div className="relative cyber-card overflow-hidden h-[600px] flex flex-col">
      {/* Network Filter Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Filter Entity Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Types ({data.nodes.length})</option>
              <option value="WEBSITE">Websites</option>
              <option value="SOCIAL_PROFILE">Social Profiles</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Filter Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetFit}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
            title="Fit to Viewport"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="flex-1 bg-slate-950/80 cursor-grab active:cursor-grabbing relative" />

      {/* Node Details Side Panel Drawer */}
      {selectedNode && (
        <div className="absolute right-4 top-16 bottom-4 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 z-20 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h4 className="font-bold text-slate-100 text-sm truncate max-w-[200px]">{selectedNode.label}</h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Entity Type</span>
                <Badge type="entity" entityType={selectedNode.entity_type as any} />
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Platform / Domain</span>
                <p className="font-mono text-cyan-400 font-semibold">{selectedNode.platform} ({selectedNode.domain})</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Risk Level & Score</span>
                <div className="mt-1">
                  <Badge type="risk" riskLevel={selectedNode.risk_level as any} />
                  <span className="ml-2 text-slate-300 font-mono font-bold">{selectedNode.risk_score}/100</span>
                </div>
              </div>
            </div>
          </div>

          {selectedNode.investigation_id && (
            <Link
              to={`/investigations/${selectedNode.investigation_id}`}
              className="cyber-btn-primary w-full text-xs py-2 mt-4"
            >
              <span>View Full Investigation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Edge Details Overlay */}
      {selectedEdge && (
        <div className="absolute bottom-4 left-4 max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-20 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-mono font-bold text-cyan-400">{selectedEdge.connection_type}</span>
            <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-slate-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-slate-300 mb-1">{selectedEdge.reason}</p>
          <span className="text-[10px] font-mono text-slate-400">
            Similarity Confidence: {(selectedEdge.similarity_score * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
