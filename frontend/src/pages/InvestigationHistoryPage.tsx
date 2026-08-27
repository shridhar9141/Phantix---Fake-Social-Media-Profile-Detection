import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { RiskBadge } from '../components/ui/RiskBadge';
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const InvestigationHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const riskLevel = searchParams.get('risk_level') || '';
  const entityType = searchParams.get('entity_type') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['investigations-history', search, riskLevel, entityType, page],
    queryFn: () =>
      api.getInvestigations({
        search: search || undefined,
        risk_level: riskLevel || undefined,
        entity_type: entityType || undefined,
        page,
        limit: 10,
      }),
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInvestigation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput, page: '1' });
  };

  const updateParams = (newParams: Record<string, string>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        nextParams.set(k, v);
      } else {
        nextParams.delete(k);
      }
    });
    setSearchParams(nextParams);
  };

  return (
    <AppLayout title="Investigation Logs Database">
      <div className="space-y-6">
        {/* Header CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Threat Intelligence Database</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Query and filter your authenticated cybersecurity investigation records.
            </p>
          </div>
          <Link to="/investigate" className="cyber-btn-primary text-xs py-2.5 px-4 shrink-0">
            <Plus className="w-4 h-4" />
            New Investigation
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="cyber-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by domain, URL or entity identifier..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="cyber-input w-full pl-9"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Risk Level Filter Tabs */}
            <select
              value={riskLevel}
              onChange={(e) => updateParams({ risk_level: e.target.value, page: '1' })}
              className="cyber-input py-2 text-xs font-mono"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            {/* Entity Type Filter */}
            <select
              value={entityType}
              onChange={(e) => updateParams({ entity_type: e.target.value, page: '1' })}
              className="cyber-input py-2 text-xs font-mono"
            >
              <option value="">All Entity Types</option>
              <option value="WEBSITE">Websites</option>
              <option value="SOCIAL_PROFILE">Social Profiles</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <LoadingState message="Querying PostgreSQL investigation records..." />
        ) : isError ? (
          <div className="cyber-card p-6 border-red-500/40 text-red-400 text-xs">
            Failed to query database records: {(error as Error).message}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Zero Matching Investigations"
            description={
              search || riskLevel || entityType
                ? "No investigation logs match your current filter parameters."
                : "Your investigation log is empty. Submit a target URL to start building your database."
            }
            actionText={search || riskLevel || entityType ? "Reset Filters" : "Submit Target URL"}
            actionUrl={search || riskLevel || entityType ? undefined : "/investigate"}
          />
        ) : (
          <div className="space-y-4">
            <div className="cyber-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-3 px-4">Domain / Target URL</th>
                      <th className="py-3 px-4">Platform & Entity</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100 truncate max-w-xs">{item.domain}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs font-sans">{item.normalized_url}</div>
                        </td>

                        <td className="py-3.5 px-4 font-sans">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                            {item.platform || item.entity_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}{' '}
                          <span className="text-slate-500">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/investigations/${item.id}`}
                              className="cyber-btn-secondary py-1 px-3 text-xs text-cyan-400 hover:text-cyan-300 font-sans"
                            >
                              Report
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => {
                                if (window.confirm('Delete this investigation record permanently?')) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
                <span>
                  Page {data.page} of {data.pages} ({data.total} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => updateParams({ page: (data.page - 1).toString() })}
                    className="cyber-btn-secondary text-xs py-1 px-3 disabled:opacity-40 font-sans"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    disabled={data.page >= data.pages}
                    onClick={() => updateParams({ page: (data.page + 1).toString() })}
                    className="cyber-btn-secondary text-xs py-1 px-3 disabled:opacity-40 font-sans"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
