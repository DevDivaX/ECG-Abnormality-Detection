import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Award,
  Layers,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Table,
  Info
} from 'lucide-react';
import {
  MODEL_ARCHITECTURE,
  OVERALL_METRICS,
  PER_CLASS_METRICS,
  CONFUSION_MATRIX,
  AAMI_CLASSES_INFO,
  MODEL_LIMITATIONS
} from '../../data/modelMetricsData';

export default function AboutModelView() {
  const [matrixMode, setMatrixMode] = useState('percent'); // 'percent' or 'count'

  // Normalize confusion matrix rows
  const matrixPercentages = CONFUSION_MATRIX.matrix.map((row) => {
    const rowSum = row.reduce((a, b) => a + b, 0);
    return row.map((val) => (rowSum > 0 ? (val / rowSum) * 100 : 0));
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          About the 1D-CNN Model
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Deep learning architecture, benchmark dataset specifications, and offline experimental evaluation.
        </p>
      </div>

      {/* Project Objective Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Project Objective & Methodology
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          CardioTrace is an educational medical-technology system designed to investigate automatic electrocardiogram heartbeat classification using a 1D Convolutional Neural Network (CNN). Rather than converting electrical signals into lossy 2D spectrogram images, the 1D-CNN operates directly on discrete voltage time-series sequences.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Benchmark Dataset</span>
            <div className="text-xs font-semibold text-white">MIT-BIH (Kaggle Split)</div>
            <p className="text-[10px] text-slate-400">Derived from 48 two-lead ambulatory records</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Input Specification</span>
            <div className="text-xs font-semibold text-cyan-400 font-mono">187 Numerical Values</div>
            <p className="text-[10px] text-slate-400">Resampled to 125 Hz, normalized [0, 1]</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Training Loss Function</span>
            <div className="text-xs font-semibold text-white">Focal Loss</div>
            <p className="text-[10px] text-slate-400">Mitigates severe class imbalance</p>
          </div>
        </div>
      </div>

      {/* 5 AAMI Classification Categories */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            AAMI EC57 Five Cardiac Rhythm Categories
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            The Association for the Advancement of Medical Instrumentation (AAMI) EC57 standard groups arrhythmias into five categories:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AAMI_CLASSES_INFO.map((cls) => (
            <div
              key={cls.code}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">
                  Class {cls.index}: {cls.name}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${cls.badgeColor}`}>
                  AAMI {cls.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {cls.fullName}
              </p>
              <p className="text-[10px] text-slate-400 leading-snug">
                {cls.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Offline Experimental Evaluation Results */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Offline Experimental Evaluation Results
              </h2>
            </div>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              [Offline Experimental Evaluation Benchmark — Not Live Clinical Validation]
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMatrixMode('percent')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                matrixMode === 'percent'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Percentage %
            </button>
            <button
              onClick={() => setMatrixMode('count')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                matrixMode === 'count'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sample Counts
            </button>
          </div>
        </div>

        {/* Per-class Metrics Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Category Name</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">Test Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {PER_CLASS_METRICS.map((row) => (
                <tr key={row.code} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                    {row.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {row.precision}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {row.recall}%
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                    {row.f1Score}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {row.testSamples.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5x5 Confusion Matrix */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-slate-300">
            5×5 Test Set Confusion Matrix (Normalized by Actual True Class)
          </span>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3">
            <table className="w-full text-xs text-center font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2 text-left font-sans">True \ Pred</th>
                  {CONFUSION_MATRIX.classes.map((cls, idx) => (
                    <th key={idx} className="py-2 px-2 text-cyan-400">
                      {['N', 'S', 'V', 'F', 'Q'][idx]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {CONFUSION_MATRIX.matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="py-2 px-2 text-left font-semibold text-slate-300 font-sans">
                      {['Normal (N)', 'Supra (S)', 'Vent (V)', 'Fusion (F)', 'Unknown (Q)'][rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const pct = matrixPercentages[rIdx][cIdx];
                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-2 ${
                            isDiagonal
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                              : val > 0
                              ? 'text-slate-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {matrixMode === 'percent' ? `${pct.toFixed(1)}%` : val.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Model Limitations & Disclaimer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Technical & Clinical Limitations
        </h2>
        <ul className="space-y-2 text-xs text-slate-300">
          {MODEL_LIMITATIONS.map((limitation, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <strong className="text-amber-300 block mb-1">Notice:</strong>
          This application is an educational ECG heartbeat classification project. Its predictions are generated by an experimental machine learning model and are not a medical diagnosis. It is not clinically validated and must not be used to make medical decisions.
        </div>
      </div>
    </div>
  );
}
