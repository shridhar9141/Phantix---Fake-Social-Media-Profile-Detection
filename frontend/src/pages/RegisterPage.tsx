import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight, Activity, Cpu, Network, Database } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { registerEmail, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await registerEmail(fullName, email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginGoogle();
      navigate('/');
    } catch (err: any) {
      console.error('Google registration error:', err);
      setError(err.message || 'Google registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex selection:bg-cyan-500 text-slate-100">
      {/* Left Brand Showcase Panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden grid-overlay">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-950/60">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Identity<span className="text-cyan-400">Trace</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
              AI Cybersecurity Platform
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>New Analyst Onboarding</span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-100 leading-tight">
            Provision Your Personal Investigation Workspace
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Gain immediate access to risk analysis engines, automated signal extraction, PostgreSQL activity logs, and interactive Cytoscape network mapping.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="cyber-card p-4 bg-slate-900/60 border-slate-800">
              <Cpu className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Firebase Auth</h4>
              <p className="text-[11px] text-slate-400 mt-1">Encrypted authentication tokens & Google OAuth 2.0.</p>
            </div>
            <div className="cyber-card p-4 bg-slate-900/60 border-slate-800">
              <Network className="w-5 h-5 text-violet-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Isolated Data</h4>
              <p className="text-[11px] text-slate-400 mt-1">User-isolated PostgreSQL data and audit logs.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL & Firebase Admin Active</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Right Register Console Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-3 shadow-xl shadow-cyan-950/40">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Identity<span className="text-cyan-400">Trace</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
              Create Analyst Account
            </p>
          </div>

          <div className="cyber-card p-6 sm:p-8 border-slate-800">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Create Analyst Account</h2>
              <p className="text-xs text-slate-400 mt-1">Register your security analyst profile.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Lead Security Analyst"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="cyber-input w-full pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="analyst@identitytrace.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cyber-input w-full pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input w-full pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cyber-input w-full pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cyber-btn-primary w-full py-3 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Analyst Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Or Register With
              </span>
            </div>

            <GoogleSignInButton
              onClick={handleGoogleRegister}
              loading={loading}
              label="Register with Google"
            />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
              Sign In to Existing Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
