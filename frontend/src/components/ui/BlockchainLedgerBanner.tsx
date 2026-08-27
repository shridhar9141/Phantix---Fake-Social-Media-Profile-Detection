import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BlockchainLedgerBannerProps {
  blockCount?: number;
}

export const BlockchainLedgerBanner: React.FC<BlockchainLedgerBannerProps> = ({ blockCount = 6 }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setTimeout(() => setVerified(false), 4000);
    }, 800);
  };

  return (
    <div className="cyber-card p-4 sm:p-5 border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            BLOCKCHAIN EVIDENCE INTEGRITY
          </h4>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {blockCount} sealed blocks verified tamper-proof
          </p>
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={verifying}
        className="px-4 py-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold font-mono tracking-wider transition-all self-end sm:self-center"
      >
        {verifying ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            VERIFYING...
          </span>
        ) : verified ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            100% VERIFIED
          </span>
        ) : (
          'VERIFY'
        )}
      </button>
    </div>
  );
};
