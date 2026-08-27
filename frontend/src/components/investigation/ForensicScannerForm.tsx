import React, { useState } from 'react';
import { Shield, Globe, Link2 } from 'lucide-react';

export interface ForensicScanParameters {
  platform: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  totalPosts: number;
  accountAgeDays: number;
  isVerified: boolean;
  hasSuspiciousLink: boolean;
  targetUrl: string;
}

interface ForensicScannerFormProps {
  onAnalyze: (params: ForensicScanParameters) => void;
  isLoading?: boolean;
}

export const ForensicScannerForm: React.FC<ForensicScannerFormProps> = ({
  onAnalyze,
  isLoading = false,
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const platforms = ['Instagram', 'X (Twitter)', 'Facebook', 'LinkedIn', 'Telegram', 'Website'];

  // Handle URL change & auto-extract platform / username
  const handleUrlChange = (val: string) => {
    setTargetUrl(val);
    const valLower = val.toLowerCase().trim();

    if (valLower.includes('instagram.com') || valLower.startsWith('@') || (!valLower.includes('.') && !valLower.startsWith('http') && valLower.length > 0)) {
      setPlatform('Instagram');
    } else if (valLower.includes('twitter.com') || valLower.includes('x.com')) {
      setPlatform('X (Twitter)');
    } else if (valLower.includes('t.me') || valLower.includes('telegram.org')) {
      setPlatform('Telegram');
    } else if (valLower.includes('facebook.com') || valLower.includes('fb.com')) {
      setPlatform('Facebook');
    } else if (valLower.includes('linkedin.com')) {
      setPlatform('LinkedIn');
    } else if (valLower.includes('.')) {
      setPlatform('Website');
    }

    try {
      const clean = val.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const parts = clean.split('/');
      if (parts.length > 1 && parts[1].trim()) {
        const handle = parts[1].replace('@', '').trim();
        if (!username) {
          setUsername(handle);
          setDisplayName(handle.replace(/_/g, ' ').replace(/\./g, ' '));
        }
      } else if (parts[0].trim() && !parts[0].includes('.') && !username) {
        const handle = parts[0].replace('@', '').trim();
        setUsername(handle);
      }
    } catch {
      // ignore parse err
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTarget = targetUrl.trim();
    const rawUser = username.trim();

    let finalUrl = '';
    let finalUser = '';

    if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
      finalUrl = rawTarget;
      finalUser = rawUser || (finalUrl.includes('/') ? finalUrl.split('/').filter(Boolean).pop() || 'target' : 'target');
    } else if (rawTarget.startsWith('@')) {
      finalUser = rawTarget.replace(/^@+/, '');
      finalUrl = platform === 'Instagram' ? `https://www.instagram.com/${finalUser}/` : `@${finalUser}`;
    } else if (rawTarget && !rawTarget.includes('.') && !rawTarget.includes('/')) {
      finalUser = rawTarget;
      finalUrl = platform === 'Instagram' ? `https://www.instagram.com/${finalUser}/` : `@${finalUser}`;
    } else if (rawTarget) {
      finalUrl = rawTarget;
      finalUser = rawUser || 'target';
    } else if (rawUser) {
      finalUser = rawUser.replace(/^@+/, '');
      finalUrl = platform === 'Instagram' ? `https://www.instagram.com/${finalUser}/` : `@${finalUser}`;
    } else {
      finalUrl = `https://www.instagram.com/target_profile/`;
      finalUser = 'target_profile';
    }

    onAnalyze({
      platform,
      username: finalUser,
      displayName: displayName.trim() || finalUser,
      bio: '',
      followers: 0,
      following: 0,
      totalPosts: 0,
      accountAgeDays: 0,
      isVerified: false,
      hasSuspiciousLink: false,
      targetUrl: finalUrl
    });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Main Target Website URL / Profile Link Console */}
      <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
        <div className="relative pt-2">
          <label className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Target Profile URL or Website Link
          </label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. https://www.instagram.com/username/ or @username or https://example.com/login"
              value={targetUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl pl-10 pr-4 py-3.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
          </div>

        </div>

        {/* Target Platform Selector Tabs */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            TARGET PLATFORM
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 border ${
                  platform === p
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-950'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Username / Display Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative pt-2">
            <label className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Target Username / Handle
            </label>
            <input
              type="text"
              placeholder="e.g. target_handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="relative pt-2">
            <label className="absolute -top-2.5 left-3 px-2 bg-slate-900 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Official Target Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="submit"
        disabled={isLoading || (!targetUrl.trim() && !username.trim())}
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider font-mono shadow-xl shadow-indigo-950/60 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
      >
        <Shield className="w-4 h-4" />
        <span>ANALYZE & SEAL IN BLOCKCHAIN LEDGER</span>
      </button>
    </form>
  );
};
