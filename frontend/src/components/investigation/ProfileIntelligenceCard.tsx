import React from 'react';
import { 
  Instagram, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  FileText, 
  Clock,
  Lock,
  BadgeCheck
} from 'lucide-react';
import { SocialProfileData } from '../../types/investigation';

interface ProfileIntelligenceCardProps {
  profile: SocialProfileData;
  investigationId?: string;
  createdAt?: string;
}

export const ProfileIntelligenceCard: React.FC<ProfileIntelligenceCardProps> = ({
  profile,
  investigationId,
  createdAt
}) => {
  const availability = profile.availability || {};

  const getMetricDisplay = (val: number | null | undefined, availKey: string, label: string) => {
    const isAvail = availability[availKey] === 'AVAILABLE' && val !== null && val !== undefined;

    return (
      <div className="cyber-card p-4 bg-slate-950/90 border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
          <span>{label}</span>
          {isAvail ? (
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
              AVAILABLE
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
              UNAVAILABLE
            </span>
          )}
        </div>

        <div>
          {isAvail ? (
            <span className="text-2xl font-black font-mono text-slate-100 tracking-tight">
              {val.toLocaleString()}
            </span>
          ) : (
            <div className="space-y-1">
              <span className="text-sm font-semibold font-sans text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Not available
              </span>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Not available through the configured data source
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="cyber-card p-6 sm:p-8 bg-slate-950 border-cyan-500/30 space-y-6 font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold tracking-widest uppercase mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>SOCIAL IDENTITY INVESTIGATION</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>@{profile.username}</span>
            {profile.platform.toLowerCase() === 'instagram' && (
              <Instagram className="w-5 h-5 text-purple-400" />
            )}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {investigationId && (
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              ID: {investigationId.substring(0, 8)}
            </span>
          )}
          {createdAt && (
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Main Profile Info Row */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar Scanner Box */}
        <div className="relative group shrink-0 mx-auto md:mx-0">
          <div className="w-28 h-28 rounded-2xl bg-slate-900 border-2 border-cyan-500/40 p-1 relative overflow-hidden shadow-xl shadow-cyan-950/50">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.username}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-600 space-y-1">
                <Users className="w-8 h-8 text-slate-500" />
                <span className="text-[10px]">No Avatar</span>
              </div>
            )}
            {/* Scan Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          </div>

          <span className="text-[10px] text-slate-400 block text-center mt-2 font-mono">
            {availability.profile_image_url === 'AVAILABLE' ? 'Avatar Analyzed' : 'Avatar Unavailable'}
          </span>
        </div>

        {/* Profile Attributes */}
        <div className="flex-1 space-y-3 font-sans">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-100 font-mono">
                {profile.display_name || profile.username}
              </h3>
              {profile.availability?.is_verified === 'AVAILABLE' && (
                <BadgeCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
            </div>

            <a
              href={profile.profile_url || `https://instagram.com/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5 break-all"
            >
              {profile.profile_url || `https://instagram.com/${profile.username}`}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Bio Section */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">
              Public Bio Text
            </span>
            {availability.bio === 'AVAILABLE' && profile.bio ? (
              <p className="text-slate-200 leading-relaxed font-sans">{profile.bio}</p>
            ) : (
              <p className="text-amber-300/90 text-[11px] italic font-sans flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Bio text not available through the configured data source
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row (Followers, Following, Posts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {getMetricDisplay(profile.followers_count, 'followers_count', 'Followers')}
        {getMetricDisplay(profile.following_count, 'following_count', 'Following')}
        {getMetricDisplay(profile.posts_count, 'posts_count', 'Total Posts')}
      </div>
    </div>
  );
};
