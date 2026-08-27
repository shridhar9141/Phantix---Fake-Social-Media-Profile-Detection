import React, { useState, useEffect } from 'react';
import { Search, Globe, Share2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface URLInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [previewType, setPreviewType] = useState<'SOCIAL_PROFILE' | 'WEBSITE' | null>(null);
  const [previewPlatform, setPreviewPlatform] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!urlInput.trim()) {
      setPreviewType(null);
      setPreviewPlatform('');
      setValidationError(null);
      return;
    }

    const inputLower = urlInput.toLowerCase();
    
    // Quick client-side preview detection
    if (inputLower.includes('instagram.com')) {
      setPreviewType('SOCIAL_PROFILE');
      setPreviewPlatform('Instagram');
    } else if (inputLower.includes('facebook.com') || inputLower.includes('fb.com')) {
      setPreviewType('SOCIAL_PROFILE');
      setPreviewPlatform('Facebook');
    } else if (inputLower.includes('linkedin.com')) {
      setPreviewType('SOCIAL_PROFILE');
      setPreviewPlatform('LinkedIn');
    } else if (inputLower.includes('x.com') || inputLower.includes('twitter.com')) {
      setPreviewType('SOCIAL_PROFILE');
      setPreviewPlatform('X / Twitter');
    } else if (inputLower.includes('github.com')) {
      setPreviewType('SOCIAL_PROFILE');
      setPreviewPlatform('GitHub');
    } else {
      setPreviewType('WEBSITE');
      setPreviewPlatform('General Website');
    }

    // Basic URL format validation check
    if (urlInput.length > 5 && !urlInput.includes('.') && !urlInput.startsWith('localhost')) {
      setValidationError('Please enter a valid URL domain or web address (e.g. example.com)');
    } else {
      setValidationError(null);
    }
  }, [urlInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setValidationError('Please enter a target URL for investigation.');
      return;
    }
    if (validationError) return;

    onSubmit(cleanUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="cyber-card p-6 md:p-8">
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Target Investigation URL
        </label>
        
        <div className="relative flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://suspicious-paypal-verify.com or instagram.com/support_official"
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !urlInput.trim() || !!validationError}
            className="cyber-btn-primary py-3.5 px-6 shrink-0 font-bold"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                Analyzing Target...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Start Investigation
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>

        {/* Live Auto-Detection Guidance */}
        {previewType && !validationError && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Auto-Detected Target Category:</span>
              <span className="font-mono text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {previewPlatform} ({previewType === 'SOCIAL_PROFILE' ? 'Social Profile' : 'General Website'})
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
              Pipeline: {previewType === 'SOCIAL_PROFILE' ? 'Profile Analyzer' : 'Website & Content Analyzer'}
            </span>
          </div>
        )}

        {/* Validation or Server Errors */}
        {(validationError || error) && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>SSRF-Safe URL Fetching</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <Share2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Legitimate & Authorized Signals</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Explainable Weighted Scoring</span>
        </div>
      </div>
    </form>
  );
};
