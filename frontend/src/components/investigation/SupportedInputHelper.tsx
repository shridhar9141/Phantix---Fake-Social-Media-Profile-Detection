import React from 'react';
import { HelpCircle, CheckCircle2, ShieldCheck, Globe, Instagram } from 'lucide-react';

interface SupportedInputHelperProps {
  onSelectSample?: (url: string) => void;
}

export const SupportedInputHelper: React.FC<SupportedInputHelperProps> = ({ onSelectSample }) => {
  return (
    <div className="cyber-card p-4 bg-slate-950/80 border-slate-800 text-xs text-slate-300 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Supported Input Formats (Real Data Pipeline)</span>
        </div>
        <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          Strict Zero-Fake Policy
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
        IdentityTrace connects directly to legitimate public meta feeds & website servers. Enter any supported profile URL, handle, or website link:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start gap-2">
          <Instagram className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Instagram Profile URL / Handle</span>
            <code className="text-[10px] text-cyan-400 block mt-0.5">https://www.instagram.com/username/</code>
            <code className="text-[10px] text-purple-400 block font-bold">@username</code>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start gap-2">
          <Globe className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Website URL / Login Link</span>
            <code className="text-[10px] text-cyan-400 block mt-0.5">https://example.com/login</code>
            <span className="text-[10px] text-slate-500 block">Full SSRF-validated website inspection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
