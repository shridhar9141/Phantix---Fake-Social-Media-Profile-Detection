import React from 'react';
import { AnalysisSignal } from '../../types/investigation';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldOff, Info } from 'lucide-react';

interface SignalListCardProps {
  signals: AnalysisSignal[];
}

export const SignalListCard: React.FC<SignalListCardProps> = ({ signals }) => {
  const detectedSignals = signals.filter((s) => s.detected && s.availability === 'AVAILABLE');
  const cleanSignals = signals.filter((s) => !s.detected && s.availability === 'AVAILABLE');
  const unavailableSignals = signals.filter((s) => s.availability === 'UNAVAILABLE');

  return (
    <div className="space-y-6">
      {/* Active Threat Indicators */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-base">Detected Risk Indicators</h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {detectedSignals.length} Active
          </span>
        </div>

        {detectedSignals.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Zero malicious threat indicators detected in evaluated categories.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedSignals.map((signal) => (
              <div
                key={signal.id}
                className="p-4 rounded-lg bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-sm text-slate-100">{signal.signal_name}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {signal.signal_category}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                    +{signal.weight} Impact
                  </span>
                </div>

                {signal.value && (
                  <p className="text-xs font-mono text-cyan-400/90 mb-1 pl-6">
                    {signal.value}
                  </p>
                )}

                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  {signal.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluated Clean Signals */}
      {cleanSignals.length > 0 && (
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-base">Evaluated Clean Signals</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400">
              {cleanSignals.length} Passed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cleanSignals.map((signal) => (
              <div key={signal.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-medium mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{signal.signal_name}</span>
                </div>
                <p className="text-slate-400 text-[11px] pl-5 leading-snug">{signal.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Signals / Analysis Limitations */}
      {unavailableSignals.length > 0 && (
        <div className="cyber-card p-6 border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldOff className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-300 text-sm">Unavailable Signals & Limitations</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {unavailableSignals.length} Signals
            </span>
          </div>

          <div className="space-y-2">
            {unavailableSignals.map((signal) => (
              <div key={signal.id} className="p-3 rounded bg-slate-950/50 border border-slate-800 text-xs flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium text-slate-300">{signal.signal_name}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{signal.explanation}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase shrink-0">
                  {signal.value || 'UNAVAILABLE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
