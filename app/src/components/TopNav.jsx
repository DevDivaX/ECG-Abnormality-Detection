import React from 'react';
import {
  Menu,
  Activity,
  PlusCircle,
  Grid,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export default function TopNav({ setMobileOpen }) {
  const {
    activeNav,
    setActiveNav,
    backendStatus,
    paperGridMode,
    setPaperGridMode,
    analysisResult
  } = useAnalysis();

  const titles = {
    dashboard: 'Dashboard',
    'new-analysis': 'New ECG Analysis',
    viewer: 'ECG Waveform Viewer',
    results: 'Analysis Results',
    history: 'Analysis History',
    reports: 'Diagnostic Reports',
    about: 'About Model & Dataset'
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between no-print">
      {/* Left: Mobile Menu Button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">CardioTrace</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            {titles[activeNav] || 'Analysis'}
          </h2>
        </div>
      </div>

      {/* Right: Quick Controls & Backend Chip */}
      <div className="flex items-center gap-3">
        {/* ECG Paper Grid Toggle */}
        <button
          onClick={() => setPaperGridMode(!paperGridMode)}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            paperGridMode
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
              : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
          }`}
          title={paperGridMode ? 'Switch to Dark Telemetry Grid' : 'Switch to Medical Pink Paper Grid'}
        >
          <Grid className="w-3.5 h-3.5 text-rose-400" />
          <span>{paperGridMode ? 'Paper Grid (Pink)' : 'Dark Telemetry Grid'}</span>
        </button>

        {/* Backend Status indicator badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            backendStatus.online
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          <span className="hidden md:inline">
            {backendStatus.online ? 'FastAPI Connected' : 'Backend Offline'}
          </span>
        </div>

        {/* Start New Analysis button (if not already on new-analysis) */}
        {activeNav !== 'new-analysis' && (
          <button
            onClick={() => setActiveNav('new-analysis')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-900/20 hover:brightness-110 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        )}
      </div>
    </header>
  );
}
