import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface LoadingStateProps {
  fullPage?: boolean;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  fullPage = false,
  message = 'Processing intelligence stream...',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <ShieldCheck className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-slate-400 text-xs font-medium animate-pulse font-mono">
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};
