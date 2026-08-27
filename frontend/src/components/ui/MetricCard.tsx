import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan'
}) => {
  const colorStyles = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      glow: 'after:bg-cyan-500/5',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
      glow: 'after:bg-violet-500/5',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      glow: 'after:bg-amber-500/5',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      glow: 'after:bg-emerald-500/5',
    },
    red: {
      border: 'hover:border-red-500/40',
      iconBg: 'bg-red-500/10 border-red-500/30 text-red-400',
      glow: 'after:bg-red-500/5',
    },
  }[color];

  return (
    <div
      className={`cyber-card p-5 transition-all duration-200 hover:-translate-y-0.5 group ${colorStyles.border}`}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300 pointer-events-none" />

      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBg} shadow-inner`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-slate-500 text-[11px] mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
