import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ShieldCheck, Database, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <AppLayout title="System Settings & Infrastructure">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Platform Architecture & Security Settings</h2>
          <p className="text-xs text-slate-400 mt-1">
            Backend configuration audit, SSRF protection, and database connection status.
          </p>
        </div>

        {/* Security Engine Config */}
        <div className="cyber-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800/80 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Security & Defense Protections
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">SSRF (Server-Side Request Forgery) Protection</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Blocks outbound URL inspections targeting loopback (127.0.0.1), private RFC1918 subnets, and cloud metadata.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Firebase Token Verification</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  FastAPI backend validates Firebase JWT tokens on every protected request.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
                ENFORCED
              </span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="cyber-card p-6 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800/80 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Database & System Environment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Backend Service</span>
              <span className="font-semibold text-slate-200 font-mono">FastAPI / Python 3.13</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Database Storage</span>
              <span className="font-semibold text-cyan-400 font-mono">PostgreSQL (phantix_db / psycopg)</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
