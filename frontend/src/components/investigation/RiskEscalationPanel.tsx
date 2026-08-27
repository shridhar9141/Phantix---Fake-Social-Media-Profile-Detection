import React, { useState } from 'react';
import { AlertOctagon, FileText, Flag, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { VisualProgressionStep } from '../ui/VisualProgressionStep';

interface RiskEscalationPanelProps {
  investigationId: string;
  riskScore: number;
  riskLevel: string;
  signalCount?: number;
}

export const RiskEscalationPanel: React.FC<RiskEscalationPanelProps> = ({
  investigationId,
  riskScore,
  riskLevel,
  signalCount = 4,
}) => {
  const navigate = useNavigate();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isPreparingComplaint, setIsPreparingComplaint] = useState(false);

  const isCritical = riskLevel === 'CRITICAL' || riskScore >= 80;
  const isHigh = riskScore >= 60;
  const isLowOrAuthentic = riskScore < 30;

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await api.generateReport(investigationId);
      navigate(`/reports/${report.id}`);
    } catch (err) {
      alert((err as Error).message || 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrepareComplaint = () => {
    setIsPreparingComplaint(true);
    navigate(`/complaints/new/${investigationId}`);
  };

  return (
    <div className="my-6 space-y-4">
      {/* Visual Progression Step Bar */}
      <VisualProgressionStep currentStep={2} />

      {/* Forensic Intelligence Action Card */}
      <div
        className={`cyber-card p-6 md:p-8 bg-slate-900/95 relative overflow-hidden transition-all border ${
          isCritical
            ? 'border-red-500/40 shadow-2xl shadow-red-950/30'
            : isHigh
            ? 'border-amber-500/40 shadow-2xl shadow-amber-950/30'
            : 'border-cyan-500/40 shadow-2xl shadow-cyan-950/30'
        }`}
      >
        {/* Layered Edge Glow Accent */}
        <div
          className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none ${
            isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-cyan-500'
          }`}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCritical ? 'bg-red-400' : isHigh ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {isHigh ? 'INCIDENT ESCALATION WORKSPACE' : 'FORENSIC INTELLIGENCE DOSSIER READY'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="text-xl md:text-2xl font-black text-slate-100 font-mono tracking-tight">
                {isCritical
                  ? 'CRITICAL RISK INTELLIGENCE ASSESSMENT'
                  : isHigh
                  ? 'HIGH RISK INTELLIGENCE ASSESSMENT'
                  : isLowOrAuthentic
                  ? 'AUTHENTIC PROFILE INTELLIGENCE REPORT'
                  : 'MODERATE RISK INTELLIGENCE ASSESSMENT'}
              </h3>
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  isCritical
                    ? 'bg-red-500/15 text-red-400 border-red-500/40'
                    : isHigh
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {riskScore}/100 {riskLevel} RISK
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed max-w-xl">
              {isHigh
                ? `Multiple automated risk indicators (${signalCount} key signals) were detected during target inspection. Generate an official evidence report or initialize a structured complaint draft.`
                : `Target demonstrated authentic characteristics with ${signalCount} evaluated forensic indicators. Generate and download an official forensic PDF intelligence report stamped in the ledger.`}
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 shrink-0">
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950/60 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>◈ Generate Official Report →</span>
                </>
              )}
            </button>

            {isHigh && (
              <button
                onClick={handlePrepareComplaint}
                disabled={isPreparingComplaint}
                className="px-5 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/40 hover:border-amber-400 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Flag className="w-4 h-4" />
                <span>⚑ Prepare Complaint</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

