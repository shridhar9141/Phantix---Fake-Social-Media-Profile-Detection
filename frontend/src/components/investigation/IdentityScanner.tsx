import React, { useEffect, useState } from 'react';
import { ShieldAlert, Cpu, Globe, Search, Database, Network, CheckCircle, Radio } from 'lucide-react';

interface IdentityScannerProps {
  targetUrl: string;
  isCompleted?: boolean;
}

const STAGES = [
  { id: 'URL', label: 'URL Validation', icon: Search, desc: 'Input validation & domain parsing' },
  { id: 'DOMAIN', label: 'Platform Detection', icon: Globe, desc: 'Detecting platform structure & protocol' },
  { id: 'DATA', label: 'Data Collection', icon: Database, desc: 'Querying public provider metadata' },
  { id: 'IDENTITY', label: 'Feature Extraction', icon: Cpu, desc: 'Extracting handle, bio & image hashes' },
  { id: 'SIGNALS', label: 'Risk Analysis', icon: Radio, desc: 'Calculating deterministic heuristic signals' },
  { id: 'NETWORK', label: 'Connection Search', icon: Network, desc: 'Searching database for entity relationships' }
];

export const IdentityScanner: React.FC<IdentityScannerProps> = ({ targetUrl, isCompleted }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (isCompleted) {
      setCurrentStageIndex(STAGES.length - 1);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isCompleted]);

  return (
    <div className="cyber-card p-6 bg-slate-950 border-cyan-500/40 relative overflow-hidden font-mono space-y-6">
      {/* Animated Scan Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm tracking-wider uppercase">
            <Radio className="w-4 h-4 animate-ping text-cyan-400" />
            <span>Target Investigation Active</span>
          </div>
          <p className="text-xs text-slate-300 font-semibold break-all mt-1">{targetUrl}</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
          Stage {currentStageIndex + 1} / {STAGES.length}
        </span>
      </div>

      {/* Stage Flow Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stg, idx) => {
          const Icon = stg.icon;
          const isActive = idx === currentStageIndex;
          const isDone = idx < currentStageIndex || isCompleted;

          return (
            <div
              key={stg.id}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-105'
                  : isDone
                  ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 animate-bounce' : isDone ? 'text-emerald-400' : 'text-slate-400'}`} />
                {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400">{stg.id}</span>
                <span className="text-xs font-bold block mt-0.5 truncate">{stg.label}</span>
                <span className="text-[9px] text-slate-400 block mt-1 leading-tight">{stg.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Processing real payload through heuristic risk engine...
        </span>
        <span className="text-cyan-400 font-bold">{Math.min(100, Math.round(((currentStageIndex + 1) / STAGES.length) * 100))}%</span>
      </div>
    </div>
  );
};
