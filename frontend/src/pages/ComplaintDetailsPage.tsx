import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { VisualProgressionStep } from '../components/ui/VisualProgressionStep';
import { 
  ArrowLeft, 
  Flag, 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Info,
  ShieldAlert
} from 'lucide-react';

export const ComplaintDetailsPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();

  const { data: complaint, isLoading, isError, error } = useQuery({
    queryKey: ['complaint-detail', complaintId],
    queryFn: () => api.getComplaintDetail(complaintId!),
    enabled: !!complaintId,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Complaint Details">
        <LoadingState message="Loading complaint draft details..." />
      </AppLayout>
    );
  }

  if (isError || !complaint) {
    return (
      <AppLayout title="Complaint Details">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm space-y-4">
          <p>Failed to load complaint: {error ? (error as Error).message : 'Complaint record not found.'}</p>
          <Link to="/complaints" className="cyber-btn-secondary text-xs inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints Log
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Complaint Draft #${complaint.complaint_identifier}`}>
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        {/* Navigation Bar */}
        <div>
          <Link to="/complaints" className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Complaint Drafts Log
          </Link>
        </div>

        {/* Visual Progression Step Bar */}
        <VisualProgressionStep currentStep={4} />

        {/* Cyber Complaint Document Container */}
        <div className="cyber-card p-6 md:p-10 bg-slate-900/95 border-slate-800 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                IDENTITYTRACE INCIDENT COMPLAINT DRAFT
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight mt-1">
                {complaint.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Reference: <strong className="text-cyan-400">{complaint.complaint_identifier}</strong> | Created: {new Date(complaint.created_at).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">DRAFT STATUS</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mt-1 border ${
                  complaint.status === 'READY'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {complaint.status} FOR REVIEW
              </span>
            </div>
          </div>

          {/* Target Information */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              TARGET SUBJECT
            </span>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between break-all">
                <span className="text-slate-400">Target URL:</span>
                <a href={complaint.normalized_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                  {complaint.normalized_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Domain / Identifier:</span>
                <span className="text-slate-100 font-bold">{complaint.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-slate-200 font-bold">{complaint.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="text-red-400 font-bold">{complaint.risk_score}/100 {complaint.risk_level} RISK</span>
              </div>
            </div>
          </div>

          {/* Reason for Review / User Description */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              REASON FOR REVIEW & USER DESCRIPTION
            </span>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-sans leading-relaxed text-slate-300">
              {complaint.description}
            </div>
          </div>

          {/* Attached Evidence Signals */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              ATTACHED INVESTIGATION EVIDENCE FINDINGS ({complaint.evidence_items.filter(e => e.included).length})
            </span>

            <div className="space-y-2">
              {complaint.evidence_items
                .filter((e) => e.included)
                .map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-200">{ev.signal?.signal_name || 'Risk Signal'}</span>
                      <span className="text-amber-400 font-bold">+{ev.signal?.weight || 15}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">{ev.signal?.explanation}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* User Confirmation Declaration */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans space-y-2">
            <span className="font-mono font-bold text-[10px] uppercase text-indigo-400 tracking-wider block">
              USER REVIEW DECLARATION (CONFIRMED)
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">{complaint.declaration}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
