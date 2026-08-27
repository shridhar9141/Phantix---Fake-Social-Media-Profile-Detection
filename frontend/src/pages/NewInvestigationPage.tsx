import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ForensicScannerForm, ForensicScanParameters } from '../components/investigation/ForensicScannerForm';
import { SupportedInputHelper } from '../components/investigation/SupportedInputHelper';
import { IdentityScanner } from '../components/investigation/IdentityScanner';
import { ProfileIntelligenceCard } from '../components/investigation/ProfileIntelligenceCard';
import { AuthenticityAssessment } from '../components/investigation/AuthenticityAssessment';
import { BlockchainLedgerBanner } from '../components/ui/BlockchainLedgerBanner';
import { api } from '../services/api';
import { InvestigationDetail } from '../types/investigation';
import { AlertCircle, ArrowRight, ShieldCheck, FileDown, Loader2 } from 'lucide-react';

export const NewInvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeUrl, setActiveUrl] = useState('');
  const [investigationResult, setInvestigationResult] = useState<InvestigationDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (params: ForensicScanParameters) => {
    let targetUrl = params.targetUrl.trim();
    if (!targetUrl && params.username) {
      targetUrl = `@${params.username.replace(/^@+/, '')}`;
    }

    if (!targetUrl) {
      setErrorMsg('Please enter a target URL or username.');
      return;
    }

    setErrorMsg(null);
    setActiveUrl(targetUrl);
    setIsLoading(true);
    setInvestigationResult(null);

    try {
      // Execute real backend inspection
      const result = await api.submitUrl(targetUrl);
      setIsLoading(false);
      setInvestigationResult(result);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg((err as Error).message || 'Failed to complete investigation request.');
    }
  };

  const handleDownloadPdf = async (invId: string) => {
    try {
      setIsGeneratingPdf(true);
      const report = await api.generateReport(invId);
      const blob = await api.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phantix_Report_${report.report_identifier}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert((err as Error).message || 'Failed to generate PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <AppLayout title="Forensic Scanner Console">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Blockchain Evidence Integrity Banner */}
        <BlockchainLedgerBanner blockCount={6} />

        {/* Supported Input Formats Helper */}
        <SupportedInputHelper />

        {/* Forensic Scanner Form */}
        <ForensicScannerForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* Error Alert */}
        {errorMsg && (
          <div className="cyber-card p-4 border-red-500/40 bg-red-950/40 text-red-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-Time Processing Identity Scanner */}
        {isLoading && (
          <IdentityScanner targetUrl={activeUrl} isCompleted={false} />
        )}

        {/* Real Investigation Results Output */}
        {investigationResult && (
          <div className="space-y-6 animate-fadeIn">
            {/* View Full Threat Report & Download PDF Action Banner */}
            <div className="cyber-card p-4 bg-cyan-950/40 border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>INVESTIGATION COMPLETED (#{investigationResult.id.substring(0, 8)})</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleDownloadPdf(investigationResult.id)}
                  disabled={isGeneratingPdf}
                  className="cyber-btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
                </button>
                <button
                  onClick={() => navigate(`/investigations/${investigationResult.id}`)}
                  className="cyber-btn text-xs py-1.5 px-4 inline-flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                >
                  <span>Full Threat Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Profile Intelligence Card (if Social Profile) */}
            {investigationResult.profile && (
              <ProfileIntelligenceCard
                profile={investigationResult.profile}
                investigationId={investigationResult.id}
                createdAt={investigationResult.created_at}
              />
            )}

            {/* Authenticity Assessment */}
            <AuthenticityAssessment
              riskScore={investigationResult.risk_score}
              riskLevel={investigationResult.risk_level}
              signals={investigationResult.signals}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};
