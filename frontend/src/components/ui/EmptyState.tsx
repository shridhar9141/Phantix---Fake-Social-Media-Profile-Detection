import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionUrl?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Intelligence Workspace Ready',
  description = 'Your investigation workspace is currently empty. Start analyzing social media profile URLs to extract risk signals, detect impersonations, and generate threat reports.',
  actionText = 'Start New Investigation',
  actionUrl = '/investigate',
}) => {
  return (
    <div className="cyber-card p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 border-dashed border-slate-800/80">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-950/40">
          <Search className="w-8 h-8 text-cyan-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-75" />
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-400 text-xs max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionUrl && (
        <Link to={actionUrl} className="cyber-btn-primary text-xs">
          <Plus className="w-4 h-4" />
          {actionText}
        </Link>
      )}
    </div>
  );
};
