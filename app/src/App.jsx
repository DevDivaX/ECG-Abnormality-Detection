import React, { useState } from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DisclaimerBanner from './components/DisclaimerBanner';
import DashboardView from './components/views/DashboardView';
import NewAnalysisView from './components/views/NewAnalysisView';
import ECGViewerView from './components/views/ECGViewerView';
import ResultsView from './components/views/ResultsView';
import HistoryView from './components/views/HistoryView';
import ReportsView from './components/views/ReportsView';
import AboutModelView from './components/views/AboutModelView';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

function MainAppShell() {
  const { activeNav, notification } = useAnalysis();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'new-analysis':
        return <NewAnalysisView />;
      case 'viewer':
        return <ECGViewerView />;
      case 'results':
        return <ResultsView />;
      case 'history':
        return <HistoryView />;
      case 'reports':
        return <ReportsView />;
      case 'about':
        return <AboutModelView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Medical Education Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Top Header Bar */}
        <TopNav setMobileOpen={setMobileOpen} />

        {/* Floating Toast Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-fade-in ${
              notification.type === 'error'
                ? 'bg-rose-500 text-white border-rose-400'
                : notification.type === 'success'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
            }`}
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Professional Medical Tech Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 sm:px-6 text-xs text-slate-400 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">CardioTrace</span>
              <span>— AI-Powered ECG Analysis System</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span>1D Convolutional Neural Network</span>
              <span>•</span>
              <span>AAMI EC57 Benchmark</span>
              <span>•</span>
              <span>Educational Medical Technology</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <MainAppShell />
    </AnalysisProvider>
  );
}
