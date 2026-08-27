import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { VisualProgressionStep } from '../components/ui/VisualProgressionStep';
import { 
  Download, 
  Flag, 
  ArrowLeft, 
  ShieldAlert, 
  ExternalLink, 
  Info,
  CheckCircle2
} from 'lucide-react';

export const ReportDetailsPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, isError, error } = useQuery({
    queryKey: ['report-detail', reportId],
    queryFn: () => api.getReportDetail(reportId!),
    enabled: !!reportId,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Intelligence Report">
        <LoadingState message="Loading structured investigation report data..." />
      </AppLayout>
    );
  }

  if (isError || !report) {
    return (
      <AppLayout title="Intelligence Report">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm space-y-4">
          <p>Failed to load report: {error ? (error as Error).message : 'Report not found.'}</p>
          <Link to="/reports" className="cyber-btn-secondary text-xs inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Reports Log
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleDownload = async () => {
    try {
      const blob = await api.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phantix_Report_${report.report_identifier}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert((err as Error).message || 'Failed to download PDF report');
    }
  };

  return (
    <AppLayout title={`Intelligence Report #${report.report_identifier}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to="/reports" className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5 font-mono">
            <ArrowLeft className="w-4 h-4" />
            Back to Generated Reports
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 shadow hover:text-cyan-400 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download PDF Report</span>
            </button>


            <button
              onClick={() => navigate(`/complaints/new/${report.investigation_id}`)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow shadow-indigo-950 transition-all"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>⚑ Prepare Complaint</span>
            </button>
          </div>
        </div>

        {/* Visual Progression Step Bar */}
        <VisualProgressionStep currentStep={3} />

        {/* Intelligence Document Container */}
        <div className="cyber-card p-6 md:p-10 bg-slate-900/95 border-slate-800 space-y-8 font-mono">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase block">
                IDENTITYTRACE CYBERSECURITY INTELLIGENCE
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight mt-1">
                INVESTIGATION INTELLIGENCE REPORT
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Report ID: <strong className="text-cyan-400">{report.report_identifier}</strong> | Generated: {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">ANALYSIS STATUS</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VERIFIED & SEALED
              </span>
            </div>
          </div>

          {/* 1. Target Subject */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/80 pb-1">
              1. TARGET SUBJECT INFORMATION
            </span>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Type:</span>
                <span className="text-slate-200 font-bold">{report.target_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-cyan-400 font-bold">{report.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Domain / Identifier:</span>
                <span className="text-slate-100 font-bold">{report.domain}</span>
              </div>
              <div className="flex justify-between break-all">
                <span className="text-slate-400">Normalized URL:</span>
                <a href={report.normalized_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                  {report.normalized_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Risk Assessment */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/80 pb-1">
              2. HEURISTIC RISK ASSESSMENT
            </span>

            <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-3xl font-black text-slate-100">
                  {report.risk_score}<span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
                <p className="text-xs text-slate-400 mt-1">{report.summary}</p>
              </div>

              <span
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                  report.risk_score >= 60
                    ? 'bg-red-500/15 text-red-400 border-red-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {report.risk_level} RISK
              </span>
            </div>
          </div>

          {/* 3. Detected Indicators */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/80 pb-1">
              3. DETECTED RISK INDICATORS ({report.signals.length})
            </span>

            {report.signals.length === 0 ? (
              <p className="text-xs text-slate-500">No specific risk signals detected for this target.</p>
            ) : (
              <div className="space-y-3">
                {report.signals.map((sig) => (
                  <div key={sig.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{sig.signal_name}</span>
                      <span className="text-[10px] text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                        {sig.signal_category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">{sig.explanation}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Impact Weight: <strong className="text-amber-400">+{sig.weight}</strong> | Status: {sig.availability}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Related Entity Connections */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/80 pb-1">
              4. RELATED ENTITY CONNECTIONS ({report.connections.length})
            </span>

            {report.connections.length === 0 ? (
              <p className="text-xs text-slate-500">No related entities were identified during the available analysis.</p>
            ) : (
              <div className="space-y-2">
                {report.connections.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex justify-between">
                    <span>
                      <strong className="text-cyan-400">{c.connection_type}</strong>: {c.connection_reason}
                    </span>
                    <span className="text-slate-400">{c.target_domain || 'Entity'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Analysis Scope Limitations */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-800/80 pb-1">
              5. ANALYSIS SCOPE LIMITATIONS
            </span>

            <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-sans">
              {report.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-sans space-y-1">
            <span className="font-mono font-bold text-[10px] uppercase text-amber-400 tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              IMPORTANT LEGAL DISCLAIMER
            </span>
            <p className="leading-relaxed text-[11px]">{report.disclaimer}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
