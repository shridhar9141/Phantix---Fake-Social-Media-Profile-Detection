import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingState } from '../components/ui/LoadingState';
import { VisualProgressionStep } from '../components/ui/VisualProgressionStep';
import { 
  ArrowLeft, 
  Check, 
  ShieldAlert, 
  Flag, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const NewComplaintPage: React.FC = () => {
  const { investigationId } = useParams<{ investigationId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState('Suspicious Website');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Suspicious Website',
    'Possible Phishing',
    'Impersonation',
    'Suspicious Social Media Account',
    'Potential Scam',
    'Deceptive Content',
    'Other',
  ];

  const { data: inv, isLoading, isError, error } = useQuery({
    queryKey: ['investigation-detail', investigationId],
    queryFn: async () => {
      const res = await api.getInvestigationDetail(investigationId!);
      // Initialize defaults from actual data
      setTitle(`Suspected Activity Review - ${res.domain}`);
      const sigs = res.signals || [];
      setSelectedSignalIds(sigs.map((s) => s.id));
      
      const sigNames = sigs.map((s) => s.signal_name).join(', ') || 'Automated risk indicators';
      setDescription(
        `Automated risk analysis of target ${res.normalized_url} (${res.platform}) identified a risk score of ${res.risk_score}/100 ` +
        `(${res.risk_level} Risk). Primary indicators detected: ${sigNames}. Requesting administrative review of suspected suspicious activity.`
      );
      return res;
    },
    enabled: !!investigationId,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <AppLayout title="Prepare Incident Complaint">
        <LoadingState message="Loading target investigation findings..." />
      </AppLayout>
    );
  }

  if (isError || !inv) {
    return (
      <AppLayout title="Prepare Incident Complaint">
        <div className="cyber-card p-6 border-red-500/40 text-red-400 text-sm space-y-4">
          <p>Failed to load investigation: {error ? (error as Error).message : 'Record not found.'}</p>
          <Link to="/investigations" className="cyber-btn-secondary text-xs inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Investigation Log
          </Link>
        </div>
      </AppLayout>
    );
  }

  const toggleSignal = (id: string) => {
    if (selectedSignalIds.includes(id)) {
      setSelectedSignalIds(selectedSignalIds.filter((s) => s !== id));
    } else {
      setSelectedSignalIds([...selectedSignalIds, id]);
    }
  };

  const handleFinalSubmit = async () => {
    if (!userConfirmed) {
      alert('You must confirm the review declaration before saving your complaint draft.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create draft
      const draft = await api.createComplaint({
        investigation_id: inv.id,
        title,
        category,
        description,
        included_signal_ids: selectedSignalIds,
      });

      // 2. Confirm draft status READY
      await api.confirmComplaint(draft.id, true);

      navigate(`/complaints/${draft.id}`);
    } catch (err) {
      alert((err as Error).message || 'Failed to save complaint draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Incident Escalation Workspace">
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        {/* Back Button */}
        <div>
          <Link to={`/investigations/${inv.id}`} className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Investigation Details
          </Link>
        </div>

        {/* Visual Progression Step Bar */}
        <VisualProgressionStep currentStep={4} />

        {/* Wizard Workspace Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              INCIDENT ESCALATION WORKSPACE
            </span>
            <h2 className="text-xl font-black text-slate-100 mt-0.5">
              Prepare Incident Complaint Draft
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 px-3 py-1 rounded bg-slate-900 border border-slate-800">
            STEP {step} OF 5
          </span>
        </div>

        {/* Step 1: SELECT TARGET */}
        {step === 1 && (
          <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              STEP 1: SELECT TARGET SUBJECT
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Investigated URL:</span>
                <span className="text-cyan-400 font-bold break-all">{inv.normalized_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Domain:</span>
                <span className="text-slate-100 font-bold">{inv.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-slate-200 font-bold">{inv.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="text-red-400 font-bold">{inv.risk_score}/100 {inv.risk_level} RISK</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Continue to Risk Review →
            </button>
          </div>
        )}

        {/* Step 2: REVIEW RISK ASSESSMENT */}
        {step === 2 && (
          <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              STEP 2: REVIEW RISK ASSESSMENT FINDINGS
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-100">{inv.risk_score}/100</span>
                <p className="text-xs text-slate-400 mt-0.5">{inv.summary}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase">
                {inv.risk_level} RISK
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase">Actual Detected Signals ({inv.signals.length})</span>
              {inv.signals.map((sig) => (
                <div key={sig.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-200">{sig.signal_name}</span>
                    <span className="text-amber-400 font-bold">+{sig.weight}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">{sig.explanation}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-xs font-bold hover:text-slate-200"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Continue to Complaint Details →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: COMPLAINT DETAILS */}
        {step === 3 && (
          <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              STEP 3: ENTER COMPLAINT DETAILS
            </h3>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Select Complaint Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Complaint Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Complaint Title / Subject Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Editable Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Detailed Description (Pre-filled from actual findings — editable)
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-100 leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-xs font-bold hover:text-slate-200"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Continue to Evidence Selection →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: EVIDENCE SELECTION */}
        {step === 4 && (
          <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              STEP 4: EVIDENCE SELECTION
            </h3>

            <p className="text-xs text-slate-400">
              Select which actual investigation findings should be attached to this complaint draft:
            </p>

            <div className="space-y-3">
              {inv.signals.map((sig) => {
                const isSelected = selectedSignalIds.includes(sig.id);
                return (
                  <div
                    key={sig.id}
                    onClick={() => toggleSignal(sig.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-slate-950 border-indigo-500/60 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSignal(sig.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block">{sig.signal_name}</span>
                      <p className="text-[11px] font-sans mt-0.5 opacity-80">{sig.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-xs font-bold hover:text-slate-200"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Continue to Final Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: FINAL REVIEW & USER CONFIRMATION */}
        {step === 5 && (
          <div className="cyber-card p-6 md:p-8 space-y-6 bg-slate-900/95 border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              STEP 5: FINAL REVIEW & MANDATORY DECLARATION CONFIRMATION
            </h3>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Complaint Category:</span>
                <span className="text-indigo-400 font-bold">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Headline Title:</span>
                <span className="text-slate-100 font-bold">{title}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Description Draft:</span>
                <p className="text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 font-sans text-xs leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Evidence Items:</span>
                <span className="text-cyan-400 font-bold">{selectedSignalIds.length} Signals Included</span>
              </div>
            </div>

            {/* Mandatory Disclaimer Confirmation Checkbox */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userConfirmed}
                  onChange={(e) => setUserConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-xs text-amber-200 font-sans leading-relaxed">
                  <strong>Explicit Review Confirmation:</strong> I confirm that I have reviewed this information and understand that IdentityTrace provides automated risk indicators rather than a definitive legal determination of wrongdoing. This report requests review of the identified target and does not independently establish that illegal activity occurred.
                </span>
              </label>
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-xs font-bold hover:text-slate-200"
              >
                ← Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!userConfirmed || isSubmitting}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Complaint Draft...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>SAVE COMPLAINT DRAFT (MARK READY)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
