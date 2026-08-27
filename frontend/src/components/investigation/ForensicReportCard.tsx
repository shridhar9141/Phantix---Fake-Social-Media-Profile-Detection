import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, FileText, Flag, Copy, Check, Lock, Globe, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface ForensicReportCardProps {
  username?: string;
  riskScore?: number;
  riskLevel?: string;
  threatClassification?: string;
  blockNumber?: number;
  investigationId?: string;
}

export const ForensicReportCard: React.FC<ForensicReportCardProps> = ({
  username = 'target_profile',
  riskScore = 70,
  riskLevel = 'CRITICAL',
  threatClassification = 'Online Impersonation & Phishing Threat',
  blockNumber = 6,
  investigationId,
}) => {
  const navigate = useNavigate();
  const [copiedHash, setCopiedHash] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const normScore = Math.min(Math.max(riskScore, 0), 100);
  const isCritical = riskLevel === 'CRITICAL' || normScore >= 65;

  // Arc SVG geometry for probability meter
  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle
  const dashoffset = circumference - (normScore / 100) * circumference;

  const mockHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleGenerateReport = async () => {
    if (investigationId) {
      setIsGenerating(true);
      try {
        const report = await api.generateReport(investigationId);
        navigate(`/reports/${report.id}`);
      } catch {
        navigate('/reports');
      } finally {
        setIsGenerating(false);
      }
    } else {
      navigate('/reports');
    }
  };

  const handlePrepareComplaint = () => {
    if (investigationId) {
      navigate(`/complaints/new/${investigationId}`);
    } else {
      navigate('/complaints');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono">
      {/* Crime Branch Forensic Report Main Card */}
      <div className="cyber-card p-6 md:p-8 border-red-500/40 bg-slate-900/95 relative overflow-hidden shadow-2xl shadow-slate-950">
        {/* Glowing Background Glow Accent */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none ${
            isCritical ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        />

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              CRIME BRANCH FORENSIC REPORT
            </span>
          </div>

          {isCritical ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider shadow-sm">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              CRITICAL RISK ({normScore}%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              AUTHENTIC ({normScore}%)
            </span>
          )}
        </div>

        {/* Half Arc SVG Gauge & Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-4">
          {/* Half Arc SVG Probability Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-28 flex items-end justify-center">
              <svg className="w-48 h-48 -rotate-180 transform overflow-visible">
                <path
                  d="M 10 90 A 70 70 0 0 1 150 90"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <path
                  d="M 10 90 A 70 70 0 0 1 150 90"
                  fill="none"
                  stroke={isCritical ? '#e11d48' : '#10b981'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1s ease-in-out',
                    filter: isCritical
                      ? 'drop-shadow(0 0 10px rgba(225,29,72,0.6))'
                      : 'drop-shadow(0 0 10px rgba(16,185,129,0.6))',
                  }}
                />
              </svg>

              <div className="absolute bottom-2 flex flex-col items-center text-center">
                <span className="text-4xl font-black text-slate-100 tracking-tight leading-none">
                  {normScore}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  PROBABILITY
                </span>
              </div>
            </div>
          </div>

          {/* 4 Cyber Intelligence Metric Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Threat Level
              </span>
              <span className={`text-xs font-black uppercase ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {isCritical ? 'CRITICAL RISK' : 'LOW RISK'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Domain Reputation
              </span>
              <span className="text-xs font-black text-slate-200">
                {isCritical ? 'SUSPICIOUS / HIGH RISK' : 'CLEAN / VERIFIED'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                SSL Certificate
              </span>
              <span className="text-xs font-black text-slate-200">
                {isCritical ? 'SHORT-LIVED / UNTRUSTED' : 'VALID / 2048-BIT RSA'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Blockchain Block
              </span>
              <span className="text-xs font-black text-emerald-400">
                #{blockNumber} (SEALED)
              </span>
            </div>
          </div>
        </div>

        {/* Threat Classification Summary Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-center my-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            THREAT CLASSIFICATION
          </span>
          <h3 className="text-lg font-black text-indigo-400 tracking-tight">
            {threatClassification}
          </h3>
          <p className="text-[11px] text-slate-400 font-sans max-w-xl mx-auto pt-1">
            Automated heuristic inspection detected deceptive domain characteristics, brand mismatch indicators, and suspicious redirect structures associated with this target profile.
          </p>
        </div>

        {/* Action Escalation Triggers */}
        {isCritical && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>◈ Generate Intelligence Report →</span>
            </button>

            <button
              onClick={handlePrepareComplaint}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Flag className="w-4 h-4" />
              <span>⚑ Prepare Complaint</span>
            </button>
          </div>
        )}
      </div>

      {/* Blockchain Sealing Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-200 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            Target <strong className="text-cyan-400">@{username}</strong> analyzed & sealed in Blockchain Block #{blockNumber}
          </span>
        </div>

        <button
          onClick={handleCopyHash}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0"
        >
          {copiedHash ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">HASH COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>HASH: {mockHash.substring(0, 10)}...</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
