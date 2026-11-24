import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  BarChart3,
  History,
  FileText,
  Cpu,
  HeartPulse,
  Wifi,
  WifiOff,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { activeNav, setActiveNav, backendStatus, analysisResult } = useAnalysis();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System overview & quick actions'
    },
    {
      id: 'new-analysis',
      label: 'New Analysis',
      icon: PlusCircle,
      description: 'Upload & configure ECG CSV'
    },
    {
      id: 'viewer',
      label: 'ECG Viewer',
      icon: Activity,
      description: 'Waveform inspection & zoom'
    },
    {
      id: 'results',
      label: 'Analysis Results',
      icon: BarChart3,
      description: 'CNN probabilities & rhythm',
      badge: analysisResult ? 'Active' : null
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      description: 'Saved previous analyses'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Printable medical summaries'
    },
    {
      id: 'about',
      label: 'About Model',
      icon: Cpu,
      description: '1D-CNN specifications & AAMI'
    }
  ];

  const handleNavClick = (id) => {
    setActiveNav(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print print-hide-sidebar fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-white tracking-tight">CardioTrace</h1>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">ECG Analysis System</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                      }`}
                    />
                    <div className="text-left">
                      <span className="block leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-400 hidden xl:block font-normal">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Backend Service Status & Model Indicator */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              {backendStatus.online ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              Backend Status:
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                backendStatus.online
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {backendStatus.checking ? 'Connecting...' : backendStatus.online ? 'Online (8000)' : 'Offline'}
            </span>
          </div>

          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Model:</span>
              <span className="text-slate-200 font-mono">1D-CNN (Keras)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Input Shape:</span>
              <span className="text-cyan-400 font-mono">[B, 187, 1]</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Classification:</span>
              <span className="text-slate-200">5 AAMI Classes</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-500" />
            <span>CardioTrace Medical Systems</span>
          </div>
        </div>
      </aside>
    </>
  );
}
