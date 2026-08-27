import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { BlockchainLedgerBanner } from '../components/ui/BlockchainLedgerBanner';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Search, ArrowUpRight, Plus, FolderSearch, ShieldCheck, AlertOctagon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <LoadingState message="Fetching FORENSICSCAN intelligence dossiers..." />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Dashboard">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm">
          Failed to load dossiers: {(error as Error).message}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Forensic Dashboard">
      <div className="space-y-6">
        {/* LAUNCH FORENSIC SCANNER Primary Button */}
        <Link
          to="/investigate"
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider font-mono shadow-xl shadow-indigo-950/60 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
        >
          <Search className="w-4 h-4" />
          <span>LAUNCH FORENSIC SCANNER</span>
        </Link>

        {/* BLOCKCHAIN EVIDENCE INTEGRITY BANNER */}
        <BlockchainLedgerBanner blockCount={6} />

        {/* RECENT INVESTIGATIVE DOSSIERS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              RECENT INVESTIGATIVE DOSSIERS
            </span>
            <Link to="/investigations" className="text-xs text-indigo-400 font-bold font-mono hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recent_investigations && stats.recent_investigations.length > 0 ? (
              stats.recent_investigations.map((inv, idx) => (
                <div
                  key={inv.id}
                  className="cyber-card p-5 hover:border-indigo-500/40 transition-all bg-slate-900/90 flex flex-col space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black font-mono text-slate-100">
                          @{inv.domain.split('.')[0]}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          • {inv.platform || 'X (Twitter)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Domain: {inv.domain}
                      </p>
                    </div>

                    <RiskBadge level={inv.risk_level} score={inv.risk_score} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                    <span className="text-slate-500 text-[11px]">
                      Case: CB-2026-{(3775 + idx * 100).toString()}
                    </span>
                    <span
                      className={`font-bold ${
                        inv.risk_score >= 65 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      Malicious: {inv.risk_score}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="cyber-card p-5 text-center bg-slate-900/90 text-xs text-slate-400">
                No recent dossiers found. Launch Forensic Scanner to generate your first dossier.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
