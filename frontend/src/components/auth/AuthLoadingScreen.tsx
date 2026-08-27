import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Authenticating security credentials...'
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 text-slate-100">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <ShieldCheck className="w-7 h-7 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="font-bold text-slate-100 text-base mb-1 tracking-tight">IdentityTrace Security</h3>
        <p className="text-slate-400 text-xs font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
};
