import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { Flag, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComplaintHistoryPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: complaints, isLoading, isError, error } = useQuery({
    queryKey: ['complaints-list', selectedStatus, selectedCategory],
    queryFn: () => api.getComplaints(selectedStatus || undefined, selectedCategory || undefined),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Complaint Drafts">
        <LoadingState message="Fetching incident complaint drafts..." />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Complaint Drafts">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm">
          Failed to load complaints: {(error as Error).message}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Incident Complaint Drafts">
      <div className="space-y-6 font-mono">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Incident Complaint Workspace
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Review and manage your prepared incident complaint drafts prior to formal escalation.
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {complaints?.length || 0} Complaint Drafts
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Filter:</span>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="READY">READY</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="Suspicious Website">Suspicious Website</option>
            <option value="Possible Phishing">Possible Phishing</option>
            <option value="Impersonation">Impersonation</option>
            <option value="Potential Scam">Potential Scam</option>
          </select>
        </div>

        {/* Complaints Table / List */}
        {!complaints || complaints.length === 0 ? (
          <div className="cyber-card p-10 text-center space-y-4 bg-slate-900/90 font-sans">
            <Flag className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200 font-mono">No complaint drafts created</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When an investigation requires additional review, you can prepare a structured complaint draft from the high-risk investigation findings.
              </p>
            </div>
            <Link
              to="/investigations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-950"
            >
              <Search className="w-4 h-4" />
              <span>View Investigations</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="cyber-card p-5 hover:border-indigo-500/40 transition-all bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {c.complaint_identifier}
                    </span>
                    <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                      {c.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        c.status === 'READY'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{c.title}</h4>
                  <span className="text-[10px] text-slate-500 block">
                    Created: {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>

                <Link
                  to={`/complaints/${c.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>View Draft</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
