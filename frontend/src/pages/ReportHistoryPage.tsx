import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { FileText, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportHistoryPage: React.FC = () => {
  const { data: reports, isLoading, isError, error } = useQuery({
    queryKey: ['reports-list'],
    queryFn: () => api.getReports(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Generated Reports">
        <LoadingState message="Fetching investigation reports log..." />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Generated Reports">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm">
          Failed to load reports: {(error as Error).message}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Generated Intelligence Reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-mono">
              Investigation Reports Log
            </h2>
            <p className="text-xs text-slate-400">
              Structured intelligence reports generated from verified investigation analysis data.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {reports?.length || 0} Reports Generated
          </span>
        </div>

        {/* Reports Table / Card Grid */}
        {!reports || reports.length === 0 ? (
          <div className="cyber-card p-10 text-center space-y-4 bg-slate-900/90">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200 font-mono">No reports generated yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you analyze a target resulting in a High or Critical risk assessment, you can generate a structured intelligence report here.
              </p>
            </div>
            <Link
              to="/investigate"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-950"
            >
              <Search className="w-4 h-4" />
              <span>Launch Forensic Scanner</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="cyber-card p-5 hover:border-indigo-500/40 transition-all bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400">
                      {rep.report_identifier}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        rep.risk_score >= 60
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {rep.risk_score}/100 {rep.risk_level} RISK
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Type: {rep.report_type} | Status: {rep.status}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Generated: {new Date(rep.generated_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/reports/${rep.id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>View Report</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/complaints/new/${rep.investigation_id}`}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/40 text-xs font-bold transition-all"
                  >
                    ⚑ Prepare Complaint
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
