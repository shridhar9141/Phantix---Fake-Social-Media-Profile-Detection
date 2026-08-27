import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Activity, Cpu, Network, Database } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginEmail, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginEmail(email, password);
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginGoogle();
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex selection:bg-cyan-500 text-slate-100">
      {/* Left Brand & Intelligence Showcase Panel (Desktop) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden grid-overlay">
        {/* Ambient Glowing Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-950/60">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Identity<span className="text-cyan-400">Trace</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
              AI Cybersecurity Investigation Platform
            </p>
          </div>
        </div>

        {/* Central Graphic Feature Showcase */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Forensic Threat Signal Intelligence</span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-100 leading-tight">
            Automated Fake Profile & Cyber Threat Detection
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Investigate suspicious URLs, extract behavioral risk signals, analyze brand impersonation vectors, and build graph network intelligence across social platforms.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="cyber-card p-4 bg-slate-900/60 border-slate-800">
              <Cpu className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">AI Risk Scoring</h4>
              <p className="text-[11px] text-slate-400 mt-1">Rule-based scoring algorithm evaluating 10+ risk factors.</p>
            </div>
            <div className="cyber-card p-4 bg-slate-900/60 border-slate-800">
              <Network className="w-5 h-5 text-violet-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Graph Intelligence</h4>
              <p className="text-[11px] text-slate-400 mt-1">Cytoscape network map tracing cross-platform connections.</p>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL & Firebase Admin Protection</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Right Login Console Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Brand Title */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-3 shadow-xl shadow-cyan-950/40">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Identity<span className="text-cyan-400">Trace</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
              AI Cybersecurity Platform
            </p>
          </div>

          {/* Login Card Console */}
          <div className="cyber-card p-6 sm:p-8 border-slate-800">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">Analyst Workspace Access</h2>
              <p className="text-xs text-slate-400 mt-1">Authenticate credentials to enter the intelligence console.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Security Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input w-full pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    Authenticating Credentials...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Access Intelligence Workspace
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
                Or Authenticate With
              </span>
            </div>

            <GoogleSignInButton
              onClick={handleGoogleLogin}
              loading={loading}
            />
          </div>

          {/* Footer Registration Link */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Need an analyst account?{' '}
            <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
              Register New Analyst Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
