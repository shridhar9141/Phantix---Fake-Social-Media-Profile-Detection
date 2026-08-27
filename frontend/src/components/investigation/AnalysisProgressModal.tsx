import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface AnalysisProgressModalProps {
  isOpen: boolean;
  targetUrl: string;
}

const STEPS = [
  'Validating target URL & SSRF safety checks',
  'Detecting domain structure & entity classification',
  'Collecting permitted technical & content signals',
  'Evaluating rule-based risk indicator weights',
  'Scanning historical entities for network connections',
  'Generating explainable threat assessment report',
  'Persisting investigation record to database',
];

export const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({
  isOpen,
  targetUrl,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="cyber-card p-6 md:p-8 max-w-lg w-full text-left shadow-2xl border-cyan-500/30">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Running Automated Analysis</h3>
            <p className="text-xs font-mono text-cyan-400 truncate max-w-xs">{targetUrl}</p>
          </div>
        </div>

        <div className="space-y-3 my-6">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {isCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isCurrent && (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                )}
                {!isCompleted && !isCurrent && (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}

                <span
                  className={
                    isCompleted
                      ? 'text-slate-300 font-medium'
                      : isCurrent
                      ? 'text-cyan-300 font-semibold animate-pulse'
                      : 'text-slate-500'
                  }
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
