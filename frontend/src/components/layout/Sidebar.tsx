import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Target, 
  FolderSearch, 
  Lock, 
  Scale, 
  Network,
  FileText,
  Flag,
  ChevronLeft, 
  ChevronRight,
  User,
  Settings
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();

  const navSections = [
    {
      title: 'Forensic Intelligence',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutGrid },
        { label: 'Scans', path: '/investigate', icon: Target },
        { label: 'Dossiers', path: '/investigations', icon: FolderSearch },
        { label: 'Threat Graph', path: '/network', icon: Network },
      ]
    },
    {
      title: 'Incident Escalation',
      items: [
        { label: 'Reports', path: '/reports', icon: FileText },
        { label: 'Complaint Drafts', path: '/complaints', icon: Flag },
      ]
    },
    {
      title: 'Analyst Account',
      items: [
        { label: 'Analyst Profile', path: '/profile', icon: User },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* FORENSICSCAN Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-purple-900/30 font-mono tracking-tighter">
            FS
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-wide font-mono leading-none">
                FORENSICSCAN
              </span>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                INTELLIGENCE UNIT
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors hidden md:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-600 dark:bg-indigo-400" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Status */}
      {!collapsed && (
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px] font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Blockchain Ledger
            </span>
            <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              TAMPER-PROOF
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
