import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { api } from '../services/api';
import { User, Mail, Save, CheckCircle2, LogOut, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.updateProfile(displayName);
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Analyst Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="cyber-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-cyan-950/50">
              {(user?.display_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{user?.display_name || 'Security Analyst'}</h2>
              <p className="text-xs font-mono text-cyan-400">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Firebase UID: {user?.firebase_uid || user?.id?.substring(0, 12)}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="cyber-btn-secondary text-xs text-red-400 hover:bg-red-500/10 border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Profile Settings Form */}
        <div className="cyber-card p-6 md:p-8">
          <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-slate-800/80 pb-3">
            Analyst Identity Details
          </h3>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile display name updated successfully.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Lead Security Analyst"
                  className="cyber-input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="cyber-input w-full pl-9 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Managed securely via Firebase Authentication.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="cyber-btn-primary text-xs font-bold py-2.5 px-5"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};
