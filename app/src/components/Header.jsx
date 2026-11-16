import React, { useState } from 'react';
import { Activity, Heart, BarChart3, FileText, Menu, X, ShieldAlert, Cpu } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, paperGridMode, setPaperGridMode, backendStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Project Overview', icon: FileText, desc: 'Purpose & Methodology' },
    { id: 'studio', label: 'Waveform Studio', icon: Activity, desc: 'Signal & Diagnostics' },
    { id: 'metrics', label: 'Model Evaluation', icon: BarChart3, desc: 'CNN Benchmarks & Matrix' }
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
              <Activity className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  ECG Abnormality Detection
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  1D-CNN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                Deep Learning Cardiac Arrhythmia Screening Prototype
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Header Action Badges & Grid Theme Toggle */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setPaperGridMode(!paperGridMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                paperGridMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="Toggle between Dark Telemetry & Classic Pink ECG Paper Grid"
            >
              <span className={`w-2 h-2 rounded-full ${paperGridMode ? 'bg-rose-400' : 'bg-cyan-400'}`}></span>
              {paperGridMode ? 'Pink Paper Grid' : 'Dark Grid'}
            </button>

            {backendStatus?.online ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                title={`Connected to ${backendStatus.url || 'http://localhost:8000'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                FastAPI Online
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30"
                title="Backend offline (Run: uvicorn backend.main:app --port 8000)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Backend Offline
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setPaperGridMode(!paperGridMode)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700"
              title="Toggle Grid"
            >
              {paperGridMode ? 'Paper' : 'Dark'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div>{item.label}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
