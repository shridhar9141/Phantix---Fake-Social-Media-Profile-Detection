import React from 'react';
import { RiskLevel } from '../../types/investigation';

interface RiskScoreBadgeProps {
  score: number;
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  score,
  riskLevel,
  size = 'md',
}) => {
  const getColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500/10', stroke: '#ef4444' };
      case 'HIGH':
        return { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500/10', stroke: '#f97316' };
      case 'MEDIUM':
        return { text: 'text-amber-300', border: 'border-amber-500', bg: 'bg-amber-500/10', stroke: '#f59e0b' };
      case 'LOW':
      default:
        return { text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500/10', stroke: '#10b981' };
    }
  };

  const theme = getColor(riskLevel);

  if (size === 'sm') {
    return (
      <div className={`px-2.5 py-1 rounded-md border ${theme.border} ${theme.bg} flex items-center gap-1.5 font-mono text-xs font-semibold`}>
        <span className={theme.text}>{score}/100</span>
        <span className="text-slate-400">•</span>
        <span className={theme.text}>{riskLevel}</span>
      </div>
    );
  }

  const strokeDashoffset = 251.2 - (251.2 * score) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 cyber-card relative overflow-hidden text-center">
      {/* Background radial glow */}
      <div className={`absolute inset-0 opacity-15 blur-2xl ${theme.bg}`} />

      <div className="relative w-36 h-36 flex items-center justify-center mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="text-slate-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            strokeWidth="8"
            stroke={theme.stroke}
            strokeDasharray="251.2"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${theme.text}`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
            / 100 Score
          </span>
        </div>
      </div>

      <div className={`px-4 py-1.5 rounded-full border ${theme.border} ${theme.bg} font-semibold uppercase text-xs tracking-wider ${theme.text}`}>
        {riskLevel} RISK
      </div>
    </div>
  );
};
