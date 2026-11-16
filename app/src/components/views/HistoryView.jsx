import React from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Calendar,
  FileSpreadsheet,
  Layers,
  BarChart3,
  AlertCircle,
  Activity,
  PlusCircle
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

export default function HistoryView() {
  const {
    historyList,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory,
    setActiveNav
  } = useAnalysis();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Past completed 1D-CNN analyses preserved locally in your browser storage.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Storage Information Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Local Storage Notice:</strong> Analysis records are stored client-side in your browser's persistent local storage. No identifiable personal health information or external cloud tracking is maintained.
        </p>
      </div>

      {/* History Records Table / Cards */}
      {historyList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No Analysis History Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Completed ECG inferences will be recorded here automatically for fast retrieval and report re-generation.
            </p>
          </div>
          <button
            onClick={() => setActiveNav('new-analysis')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:brightness-110 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start an Analysis</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Uploaded File</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Beats</th>
                  <th className="py-3 px-4">Dominant Rhythm</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {historyList.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{entry.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">
                      {entry.mode?.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {entry.totalHeartbeats}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-cyan-300">
                        {entry.dominantRhythm}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {entry.confidence ? `${entry.confidence.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => loadFromHistory(entry)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 transition text-xs"
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(entry.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
