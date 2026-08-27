import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskBadgeProps {
  level: string; // CRITICAL, HIGH, MEDIUM, LOW
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md'
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let bgStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (normLevel === 'CRITICAL') {
    bgStyle = 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-950';
    Icon = AlertOctagon;
  } else if (normLevel === 'HIGH') {
    bgStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950';
    Icon = ShieldAlert;
  } else if (normLevel === 'MEDIUM') {
    bgStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/40';
    Icon = AlertTriangle;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-wide uppercase transition-all ${bgStyle} ${sizeClasses}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{normLevel}</span>
      {score !== undefined && (
        <span className="opacity-80 border-l border-current/20 pl-1.5 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
};
