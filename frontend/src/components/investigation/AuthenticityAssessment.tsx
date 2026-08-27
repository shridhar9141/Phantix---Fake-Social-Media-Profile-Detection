import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { AnalysisSignal, RiskLevel } from '../../types/investigation';
import { RiskGauge } from '../ui/RiskGauge';

interface AuthenticityAssessmentProps {
  riskScore: number;
  riskLevel: RiskLevel | string;
  signals: AnalysisSignal[];
}

export const AuthenticityAssessment: React.FC<AuthenticityAssessmentProps> = ({
  riskScore,
  riskLevel,
  signals
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = Math.min(100, Math.max(0, riskScore));
    const step = Math.max(1, Math.ceil(target / 25));

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [riskScore]);

  const getRiskLevelBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-purple-950 text-purple-400 border-purple-500/50 shadow-purple-900/50';
      case 'HIGH':
        return 'bg-rose-950 text-rose-400 border-rose-500/50 shadow-rose-900/50';
      case 'MEDIUM':
      case 'MODERATE':
        return 'bg-amber-950 text-amber-400 border-amber-500/50 shadow-amber-900/50';
      case 'LOW':
        return 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-emerald-900/50';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const detectedSignals = signals.filter(s => s.detected);

  return (
    <div className="cyber-card p-6 sm:p-8 bg-slate-950 border-cyan-500/30 space-y-8 font-mono">
      {/* Section Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xs uppercase font-bold text-cyan-400 tracking-widest mb-1">
            EXPLAINABLE ASSESSMENT
          </h3>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            PROFILE AUTHENTICITY ASSESSMENT
          </h2>
        </div>
        <span className={`px-3 py-1.5 rounded-lg border font-bold text-xs shadow-lg uppercase ${getRiskLevelBadge(riskLevel)}`}>
          {riskLevel} RISK
        </span>
      </div>

      {/* Clear Authenticity Verdict Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        riskScore < 30
          ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
          : riskScore < 60
          ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
          : 'bg-red-950/50 border-red-500/50 text-red-300'
      }`}>
        <div className="flex items-center gap-3">
          {riskScore < 30 ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : riskScore < 60 ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-black font-mono tracking-wide uppercase">
              {riskScore < 30
                ? 'AUTHENTIC / REAL PROFILE DETECTED'
                : riskScore < 60
                ? 'ELEVATED RISK / SUSPICIOUS PROFILE'
                : 'POTENTIAL FAKE / IMPERSONATOR PROFILE DETECTED'}
            </h3>
            <p className="text-xs font-sans text-slate-300 mt-0.5">
              {riskScore < 30
                ? 'Deterministic signals indicate a legitimate, original social media profile with standard audience metrics and clean identity patterns.'
                : riskScore < 60
                ? 'Profile exhibits moderate anomalies. Follower relationships or incomplete profile fields warrant caution.'
                : 'High-risk automated indicators detected. Potential impersonator account, bot profile, or high-risk link injection.'}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase shrink-0 border ${
          riskScore < 30
            ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
            : riskScore < 60
            ? 'bg-amber-900/60 border-amber-500 text-amber-200'
            : 'bg-red-900/60 border-red-500 text-red-200'
        }`}>
          {riskScore < 30 ? 'REAL / ORIGINAL' : riskScore < 60 ? 'SUSPICIOUS' : 'FAKE / HIGH RISK'}
        </span>
      </div>

      {/* Top Summary Block: Risk Gauge + Summary Text */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Animated Risk Gauge */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shadow-xl">
          <RiskGauge score={animatedScore} size={140} />
          <span className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
            Deterministic Heuristic Score
          </span>
        </div>

        {/* Assessment Statement */}
        <div className="md:col-span-2 space-y-3 font-sans">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed">
            <h4 className="font-bold text-slate-100 font-mono uppercase mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Authenticity Classification: {riskLevel} ({riskScore}/100)</span>
            </h4>
            <p>
              {riskLevel.toUpperCase() === 'HIGH' || riskLevel.toUpperCase() === 'CRITICAL'
                ? 'Multiple suspicious signals were detected across profile attributes, handle structure, bio links, or database similarity algorithms.'
                : riskLevel.toUpperCase() === 'MEDIUM' || riskLevel.toUpperCase() === 'MODERATE'
                ? 'Elevated risk parameters identified. Further inspection recommended.'
                : 'No major suspicious impersonation or automated bot patterns identified. Account demonstrates standard authentic social profile characteristics.'}
            </p>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <strong className="text-slate-300">Important Credibility Notice:</strong> This assessment is calculated from deterministic backend features and represents automated risk probability. It is not definitive legal proof that the account is fraudulent.
          </p>
        </div>
      </div>

      {/* WHY THIS PROFILE RECEIVED THIS SCORE */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center justify-between">
          <span>WHY THIS PROFILE RECEIVED THIS SCORE</span>
          <span className="text-[10px] text-slate-500">{detectedSignals.length} Detected Signals</span>
        </h4>

        <div className="space-y-3">
          {signals.map((sig, idx) => {
            const isAvail = sig.availability === 'AVAILABLE';
            const isDetected = sig.detected;
            const weightVal = sig.weight;

            return (
              <div
                key={sig.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isDetected
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-85'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isDetected ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Detected
                      </span>
                    ) : isAvail ? (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-slate-500" />
                        Not Detected
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        Unavailable
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-200 font-sans">
                      {sig.signal_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                      +{weightVal}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                  {sig.explanation}
                </p>

                {sig.value && (
                  <span className="text-[10px] font-mono text-slate-400 block mt-2 px-2 py-1 rounded bg-slate-950 border border-slate-800/80">
                    Signal Data: {sig.value}
                  </span>
                )}

                {/* Score Contribution Animated Bar */}
                {isDetected && weightVal > 0 && (
                  <div className="mt-3 w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (weightVal / 35) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
