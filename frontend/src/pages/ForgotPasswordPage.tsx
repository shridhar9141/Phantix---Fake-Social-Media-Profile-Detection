import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Shield, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authService.sendResetPasswordEmail(email);
      setSubmitted(true);
    } catch (err: any) {
      // Avoid exposing detailed user existence info; show general message or formatted error
      console.error('Password reset error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-xl shadow-cyan-950/40">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Identity<span className="text-cyan-400">Trace</span>
          </h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-1">
            Password Recovery
          </p>
        </div>

        {/* Card */}
        <div className="cyber-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Reset Analyst Password</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your registered email address to receive password reset instructions.
          </p>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Reset Request Dispatched</p>
                  <p className="mt-1 leading-relaxed text-slate-300">
                    If an analyst account exists for <strong>{email}</strong>, password reset instructions have been sent to your inbox.
                  </p>
                </div>
              </div>

              <Link to="/login" className="cyber-btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="analyst@identitytrace.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="cyber-btn-primary w-full text-xs font-bold py-3 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    Sending Reset Email...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </span>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
