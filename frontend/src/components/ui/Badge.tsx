import React from 'react';
import { RiskLevel, EntityType } from '../../types/investigation';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Globe, Share2 } from 'lucide-react';

interface BadgeProps {
  type?: 'risk' | 'entity' | 'status';
  riskLevel?: RiskLevel;
  entityType?: EntityType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  type = 'risk',
  riskLevel,
  entityType,
  label,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  if (type === 'risk' && riskLevel) {
    const config = {
      CRITICAL: {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
      },
      HIGH: {
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
      },
      MEDIUM: {
        bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        icon: <AlertCircle className="w-3.5 h-3.5 text-amber-300" />,
      },
      LOW: {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      },
    }[riskLevel];

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider ${config.bg} ${sizeClasses[size]}`}
      >
        {config.icon}
        {riskLevel} RISK
      </span>
    );
  }

  if (type === 'entity' && entityType) {
    const isSocial = entityType === 'SOCIAL_PROFILE';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border font-mono ${
          isSocial
            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
        } ${sizeClasses[size]}`}
      >
        {isSocial ? <Share2 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
        {isSocial ? 'SOCIAL PROFILE' : 'WEBSITE'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border bg-slate-800 text-slate-300 border-slate-700 font-mono ${sizeClasses[size]}`}
    >
      {label || 'STATUS'}
    </span>
  );
};
