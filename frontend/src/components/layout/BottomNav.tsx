import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  Target, 
  FolderSearch, 
  FileText, 
  Flag, 
  Network 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { label: 'Dashboard', path: '/', icon: LayoutGrid },
    { label: 'Scans', path: '/investigate', icon: Target },
    { label: 'Dossiers', path: '/investigations', icon: FolderSearch },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Complaints', path: '/complaints', icon: Flag },
    { label: 'Threats', path: '/network', icon: Network },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
