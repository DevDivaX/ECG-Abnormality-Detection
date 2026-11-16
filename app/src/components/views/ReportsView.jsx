import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  Calendar,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

const CLASS_COLORS = {
  Normal: '#10b981',
  'Supraventricular Ectopic': '#f59e0b',
  'Ventricular Ectopic': '#f43f5e',
  'Fusion Beat': '#a855f7',
  Unknown: '#38bdf8'
};

const AAMI_CODES = {
  Normal: 'N',
  'Supraventricular Ectopic': 'S',
  'Ventricular Ectopic': 'V',
  'Fusion Beat': 'F',
  Unknown: 'Q'
};

export default function ReportsView() {
  const {
    analysisResult,
    currentFile,
    previewSignal,
    selectedBeatIndex,
    setActiveNav
  } = useAnalysis();

  const reportRef = useRef(null);

  if (!analysisResult) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">No Completed Analysis for Reporting</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please run an ECG analysis first. Reports are generated strictly from actual completed 1D-CNN inference results.
          </p>
        </div>
        <button
          onClick={() => setActiveNav('new-analysis')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:brightness-110 transition"
        >
          <Activity className="w-4 h-4" />
          <span>Upload ECG for Analysis</span>
        </button>
      </div>
    );
  }

  const {
    dominant_rhythm,
    total_heartbeats = 1,
    abnormal_heartbeats = 0,
    abnormality_rate = 0,
    estimated_hr = 0,
    class_summary = {},
    probabilities = {},
    heartbeats = []
  } = analysisResult;

  const activeBeat = heartbeats.length > 0 && selectedBeatIndex < heartbeats.length
    ? heartbeats[selectedBeatIndex]
    : analysisResult;

  const dominantClass = dominant_rhythm || activeBeat.predicted_class_name || 'Normal';
  const dominantConfidence = activeBeat.confidence || 0;
  const probs = activeBeat.probabilities || probabilities || {};

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // JSON Download handler
  const handleDownloadJson = () => {
    const reportData = {
      system: 'CardioTrace AI-Powered ECG Analysis System',
      reportGenerated: new Date().toISOString(),
      sourceFile: currentFile?.name || 'ecg_signal.csv',
      totalHeartbeats: total_heartbeats,
      dominantClassification: dominantClass,
      aamiCode: AAMI_CODES[dominantClass] || 'N',
      modelConfidencePercent: dominantConfidence,
      classProbabilityDistribution: probs,
      classSummaryCounts: class_summary,
      disclaimer: 'Educational medical technology demonstration. Not certified for clinical diagnostic use.'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CardioTrace_Report_${(currentFile?.name || 'analysis').replace('.csv', '')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Waveform preview data
  const waveformSlice = previewSignal?.points?.slice(0, 300) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* View Header with Action Buttons (no-print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Diagnostic Analysis Summary Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Structured analysis summary generated from actual 1D-CNN model outputs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:brightness-110 transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div
        ref={reportRef}
        className="printable-report rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-6 text-slate-200 shadow-2xl"
      >
        {/* Report Top Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg tracking-tight">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>CardioTrace</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              AI-Powered ECG Heartbeat Classification System
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Architecture: 1D-CNN (Focal Loss) • Benchmark: AAMI EC57
            </p>
          </div>

          <div className="text-right text-xs space-y-1 font-mono">
            <div className="text-slate-400">Analysis Date & Time:</div>
            <div className="text-white font-semibold">
              {new Date().toLocaleString()}
            </div>
            <div className="text-[11px] text-cyan-400">
              Report ID: CTR-{Date.now().toString(36).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Recording File Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Uploaded File</span>
            <span className="font-semibold text-white truncate block">
              {currentFile?.name || 'recording.csv'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Beats Analysed</span>
            <span className="font-semibold text-white font-mono">
              {total_heartbeats} Heartbeats
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Estimated Heart Rate</span>
            <span className="font-semibold text-cyan-400 font-mono">
              {estimated_hr > 0 ? `${estimated_hr} BPM` : '125 Hz Nominal'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Abnormal Rate</span>
            <span className="font-semibold text-slate-200 font-mono">
              {abnormality_rate}%
            </span>
          </div>
        </div>

        {/* Primary Rhythm Classification Result */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 block">
            Primary Model Classification Output
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: CLASS_COLORS[dominantClass] || '#38bdf8' }}
            >
              {dominantClass}
            </span>
            <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
              AAMI Class {AAMI_CODES[dominantClass] || 'N'}
            </span>
            <span className="text-sm text-slate-400 ml-auto font-mono">
              Confidence: <strong className="text-white">{dominantConfidence.toFixed(1)}%</strong>
            </span>
          </div>
          <p className="text-xs text-slate-400 pt-1 leading-relaxed">
            Classification produced by trained 1D Convolutional Neural Network evaluated across 187 discrete numerical voltage amplitudes.
          </p>
        </div>

        {/* 5-Class Probability Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            AAMI EC57 Multi-Class Posterior Probability Distribution
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category Name</th>
                  <th className="py-2.5 px-3">AAMI Code</th>
                  <th className="py-2.5 px-3">Posterior Probability</th>
                  <th className="py-2.5 px-3">Relative Likelihood</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.keys(AAMI_CODES).map((name) => {
                  const probVal = typeof probs[name] === 'number' ? probs[name] : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        {name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        {AAMI_CODES[name]}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">
                        {probVal.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 w-48">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, probVal))}%`,
                              backgroundColor: CLASS_COLORS[name] || '#38bdf8'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waveform Trace Snapshot (Vector SVG) */}
        {waveformSlice.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              ECG Lead Trace Snapshot
            </h3>
            <div className="h-28 rounded-xl bg-slate-950 border border-slate-800 p-2 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 800 100" className="w-full h-full" preserveAspectRatio="none">
                {/* SVG path from points */}
                <path
                  d={waveformSlice.reduce((acc, pt, i) => {
                    const x = (i / (waveformSlice.length - 1)) * 800;
                    // norm voltage
                    const normY = 50 - (pt.voltage || 0) * 35;
                    return i === 0 ? `M ${x.toFixed(1)} ${normY.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${normY.toFixed(1)}`;
                  }, '')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Mandatory Clinical & Educational Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Educational Use & Machine Learning Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            This document is automatically generated by CardioTrace for academic research and educational evaluation. The classifications and confidence ratings presented are derived from an experimental 1D Convolutional Neural Network trained on the MIT-BIH dataset. They do not constitute a clinical diagnosis or medical certainty, are not certified by any medical regulatory agency, and must not be used to make diagnostic or treatment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
