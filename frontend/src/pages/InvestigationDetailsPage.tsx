import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskGauge } from '../components/ui/RiskGauge';
import { ProfileIntelligenceCard } from '../components/investigation/ProfileIntelligenceCard';
import { AuthenticityAssessment } from '../components/investigation/AuthenticityAssessment';
import { ImageComparisonCard } from '../components/investigation/ImageComparisonCard';
import { SignalListCard } from '../components/investigation/SignalListCard';
import { RiskEscalationPanel } from '../components/investigation/RiskEscalationPanel';
import { 
  ExternalLink, 
  Network, 
  ArrowLeft, 
  Info,
  Calendar,
  ShieldCheck,
  Database
} from 'lucide-react';

export const InvestigationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading, isError, error } = useQuery({
    queryKey: ['investigation-detail', id],
    queryFn: () => api.getInvestigationDetail(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Investigation Report">
        <LoadingState message="Connecting to IdentityTrace real threat intelligence database..." />
      </AppLayout>
    );
  }

  if (isError || !report) {
    return (
      <AppLayout title="Investigation Report">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm space-y-4">
          <p>Failed to load investigation report: {error ? (error as Error).message : 'Record not found.'}</p>
          <Link to="/investigations" className="cyber-btn-secondary text-xs inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Investigation Log
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Check if image comparison signal exists
  const imageSignal = report.signals.find(s => s.signal_name === 'PROFILE_IMAGE_REUSE' && s.detected);
  const imageSimilarityConnection = report.connections.find(c => c.connection_type === 'PROFILE_IMAGE_SIMILARITY' || c.connection_type === 'SAME_PROFILE_IMAGE');

  return (
    <AppLayout title={`Threat Report #${report.id.substring(0, 8)}`}>
      <div className="space-y-8">
        {/* Back Navigation */}
        <div>
          <Link to="/investigations" className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5 font-medium font-mono transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Investigations Log
          </Link>
        </div>

        {/* Social Profile Intelligence Card (if Social Profile Entity) */}
        {report.profile ? (
          <ProfileIntelligenceCard
            profile={report.profile}
            investigationId={report.id}
            createdAt={report.created_at}
          />
        ) : (
          /* Executive Summary Card for Website Investigations */
          <div className="cyber-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {report.entity_type}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-semibold px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {report.platform}
                  </span>
                  <RiskBadge level={report.risk_level} size="sm" />
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-100 font-mono tracking-tight break-all">
                  {report.domain}
                </h2>

                <a
                  href={report.normalized_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono break-all"
                >
                  {report.normalized_url}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              {/* SVG Circular Risk Gauge */}
              <div className="shrink-0 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col items-center">
                <RiskGauge score={report.risk_score} size={130} />
              </div>
            </div>

            {report.summary && (
              <div className="pt-6">
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2 font-bold tracking-wider">
                  Executive Assessment Summary
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 font-sans">
                  {report.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Profile Authenticity Assessment (Explainable Score & Signal Breakdown) */}
        <AuthenticityAssessment
          riskScore={report.risk_score}
          riskLevel={report.risk_level}
          signals={report.signals}
        />

        {/* Side-by-Side Image Comparison Card (if perceptual image match exists) */}
        {imageSignal && imageSimilarityConnection && report.profile && (
          <ImageComparisonCard
            currentUsername={report.profile.username}
            currentImageUrl={report.profile.profile_image_url}
            relatedUsername={imageSimilarityConnection.target_domain || 'related_profile'}
            similarityScore={imageSimilarityConnection.similarity_score || 0.87}
          />
        )}

        {/* High-Risk Incident Escalation Panel (Report & Complaint Actions) */}
        <RiskEscalationPanel
          investigationId={report.id}
          riskScore={report.risk_score}
          riskLevel={report.risk_level}
          signalCount={report.signals.length}
        />

        {/* Technical Signals List */}
        <SignalListCard signals={report.signals} />

        {/* Discovered Entity Relationships Graph Link */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-slate-100 text-base">Discovered Entity Relationships</h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {report.connections.length} Connections Found
            </span>
          </div>

          {report.connections.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center font-mono">
              No technical or identity connections detected with previously investigated entities in the database.
            </p>
          ) : (
            <div className="space-y-3 font-mono">
              {report.connections.map((conn) => (
                <div key={conn.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-cyan-400 font-bold uppercase">{conn.connection_type}</span>
                    <p className="text-slate-300 font-sans text-xs mt-1">{conn.connection_reason}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Linked Target: {conn.target_domain || 'Entity'} ({conn.target_platform || 'Web'})
                    </span>
                  </div>
                  <Link to="/network" className="cyber-btn-secondary text-[11px] py-1.5 shrink-0 font-sans">
                    View Network Map
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="cyber-card p-4 border-slate-800 text-[11px] text-slate-500 flex items-start gap-3 bg-slate-950/60">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans">
            <strong className="text-slate-400">Heuristic Risk Indicator Notice:</strong> This risk score and signal assessment represents automated heuristic indicators and should not be considered definitive proof of malicious activity or legal wrongdoing by any individual or entity.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
