import React from 'react';
import {
  PlusCircle,
  Activity,
  BarChart3,
  History,
  FileText,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { OVERALL_METRICS } from '../../data/modelMetricsData';

export default function DashboardView() {
  const {
    setActiveNav,
    historyList,
    loadFromHistory,
    loadSampleFile,
    backendStatus,
    analysisResult
  } = useAnalysis();

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-3.5 h-3.5" />
            <span>CardioTrace 1D-CNN System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome to CardioTrace
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            Upload an ECG recording to analyse heartbeat patterns. The system evaluates discrete voltage time-series against the AAMI EC57 standard using a trained 1D Convolutional Neural Network.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveNav('new-analysis')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30 hover:brightness-110 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Analysis</span>
            </button>

            {analysisResult && (
              <button
                onClick={() => setActiveNav('results')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:text-white hover:bg-slate-700 transition"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>View Current Results</span>
              </button>
            )}

            <button
              onClick={() => setActiveNav('about')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Model Specs</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -right-12 -top-12 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Offline Experimental Evaluation Highlights (Properly labeled, NOT live clinical stats) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Model Benchmark Specifications (Offline Experimental Evaluation)
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Evaluated on MIT-BIH Kaggle Test Set
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">{OVERALL_METRICS.accuracy.label}</span>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              {OVERALL_METRICS.accuracy.target}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {OVERALL_METRICS.accuracy.note}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">{OVERALL_METRICS.f1Score.label}</span>
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">
              {OVERALL_METRICS.f1Score.target}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {OVERALL_METRICS.f1Score.note}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">{OVERALL_METRICS.sensitivity.label}</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
              {OVERALL_METRICS.sensitivity.target}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {OVERALL_METRICS.sensitivity.note}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">{OVERALL_METRICS.inferenceTime.label}</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-200 font-mono">
              {OVERALL_METRICS.inferenceTime.target}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {OVERALL_METRICS.inferenceTime.note}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Test Sample Shortcuts */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Quick Test Datasets
          </h3>
          <p className="text-xs text-slate-400">
            Instantly load real test ECG files from the repository to verify the 1D-CNN pipeline:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => loadSampleFile('normal_187')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 text-left transition group"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 block">
                sample_normal_187.csv
              </span>
              <span className="text-[11px] text-slate-400 block">
                Single pre-segmented 187-value normal heartbeat (Class N)
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
          </button>

          <button
            onClick={() => loadSampleFile('continuous_lead2')}
            className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 text-left transition group"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 block">
                sample_continuous_lead2.csv
              </span>
              <span className="text-[11px] text-slate-400 block">
                Continuous lead II ECG recording with physiological R-peak segmentation
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
          </button>
        </div>
      </div>

      {/* Recent Analyses Section (Only displays if actual history records exist) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Recent Analyses</h3>
          </div>
          {historyList.length > 0 && (
            <button
              onClick={() => setActiveNav('history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View All ({historyList.length})
            </button>
          )}
        </div>

        {historyList.length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              No recent analyses recorded yet. Start an analysis to see historical records here.
            </p>
            <button
              onClick={() => setActiveNav('new-analysis')}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Upload ECG recording →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">File</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Beats</th>
                  <th className="py-2.5 px-3">Dominant Rhythm</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyList.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {entry.filename}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">
                      {entry.mode?.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {entry.totalHeartbeats}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-cyan-300">
                        {entry.dominantRhythm}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {entry.confidence ? `${entry.confidence.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => loadFromHistory(entry)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition font-medium"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
