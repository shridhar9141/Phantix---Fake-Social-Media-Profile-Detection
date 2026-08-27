import React from 'react';
import { Check, ShieldAlert, FileText, Flag } from 'lucide-react';

interface VisualProgressionStepProps {
  currentStep: number; // 1: Investigation, 2: Assessment, 3: Report, 4: Complaint
}

export const VisualProgressionStep: React.FC<VisualProgressionStepProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'INVESTIGATION', icon: Check },
    { id: 2, label: 'RISK ASSESSMENT', icon: ShieldAlert },
    { id: 3, label: 'REPORT GENERATED', icon: FileText },
    { id: 4, label: 'COMPLAINT PREPARED', icon: Flag },
  ];

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-6 my-4 shadow-xl">
      <div className="flex items-center justify-between relative">
        {/* Connecting progress line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : isActive
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider text-center hidden sm:block ${
                  isActive ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
