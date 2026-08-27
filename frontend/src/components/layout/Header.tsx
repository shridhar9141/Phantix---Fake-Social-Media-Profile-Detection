import React from 'react';
import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  onToggleSidebarMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebarMobile }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        {onToggleSidebarMobile && (
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* FORENSICSCAN Intelligence Unit Logo Header */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-purple-900/30 font-mono tracking-tighter">
            FS
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-wide font-mono leading-none">
              FORENSICSCAN
            </span>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
              INTELLIGENCE UNIT
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* ACTIVE Status Indicator Light */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ACTIVE</span>
        </div>

        <UserMenu />
      </div>
    </header>
  );
};
