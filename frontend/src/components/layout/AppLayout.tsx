import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Desktop */}
      <div className={`hidden md:block transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} 
          />
          <div className="relative w-64 bg-slate-950 border-r border-slate-800 z-10">
            <Sidebar collapsed={false} onToggleCollapse={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header 
          title={title} 
          onToggleSidebarMobile={() => setMobileOpen(!mobileOpen)} 
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Mobile Navigation */}
      <BottomNav />
    </div>
  );
};
