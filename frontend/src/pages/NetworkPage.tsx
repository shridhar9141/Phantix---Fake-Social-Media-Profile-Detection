import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { NetworkGraphCanvas } from '../components/network/NetworkGraphCanvas';
import { Network, Info, Layers, Cpu } from 'lucide-react';

export const NetworkPage: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['network-graph'],
    queryFn: () => api.getNetworkGraph(),
    refetchOnWindowFocus: false,
  });

  return (
    <AppLayout title="Network Intelligence Topology">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Discovered Entity Topology</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive Cytoscape graph tracing cross-platform connections, profile clones, and domain networks.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Entities: <strong className="text-cyan-400">{data.total_entities}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Connections: <strong className="text-cyan-400">{data.total_connections}</strong>
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingState message="Constructing Cytoscape network graph topology..." />
        ) : isError ? (
          <div className="cyber-card p-6 border-red-500/40 text-red-400 text-xs">
            Failed to load network graph: {(error as Error).message}
          </div>
        ) : (
          <NetworkGraphCanvas data={data!} />
        )}

        <div className="cyber-card p-4 text-xs text-slate-400 flex items-start gap-3 bg-slate-950/60 border-slate-800">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans">
            <strong className="text-slate-300">Connection Graph Rules:</strong> Network edges are created automatically when the backend detects shared profile avatars, username impersonation patterns, identical bio text, or redirection links across your PostgreSQL investigation history.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
