import React, { useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Activity,
  Layers,
  ChevronRight,
  ChevronLeft,
  FileText,
  Info,
  CheckCircle2,
  Cpu,
  Clock,
  HeartPulse,
  TrendingUp,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useAnalysis } from '../../context/AnalysisContext';

const CLASS_COLORS = {
  Normal: '#10b981', // Emerald
  'Supraventricular Ectopic': '#f59e0b', // Amber
  'Ventricular Ectopic': '#f43f5e', // Rose
  'Fusion Beat': '#a855f7', // Purple
  Unknown: '#38bdf8' // Blue
};

const AAMI_CODES = {
  Normal: 'N',
  'Supraventricular Ectopic': 'S',
  'Ventricular Ectopic': 'V',
  'Fusion Beat': 'F',
  Unknown: 'Q'
};

export default function ResultsView() {
  const {
    analysisResult,
    currentFile,
    selectedBeatIndex,
    setSelectedBeatIndex,
    setActiveNav
  } = useAnalysis();

  if (!analysisResult) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">No Analysis Results Available</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please upload an ECG CSV recording and run model inference to view actual 1D-CNN class probabilities and rhythm summaries.
          </p>
        </div>
        <button
          onClick={() => setActiveNav('new-analysis')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:brightness-110 transition"
        >
          <Activity className="w-4 h-4" />
          <span>Start New Analysis</span>
        </button>
      </div>
    );
  }

  const {
    mode,
    dominant_rhythm,
    total_heartbeats = 1,
    abnormal_heartbeats = 0,
    abnormality_rate = 0,
    estimated_hr = 0,
    class_summary = {},
    heartbeats = []
  } = analysisResult;

  // Active beat handling (for single or multi-beat continuous)
  const activeBeat = heartbeats.length > 0 && selectedBeatIndex < heartbeats.length
    ? heartbeats[selectedBeatIndex]
    : analysisResult;

  const activeClassName = activeBeat.predicted_class_name || dominant_rhythm || 'Normal';
  const activeAamiCode = activeBeat.aami_code || AAMI_CODES[activeClassName] || 'N';
  const activeConfidence = activeBeat.confidence || 0;
  const activeProbs = activeBeat.probabilities || {};

  // Build chart data from actual backend probability values
  const chartData = [
    'Normal',
    'Supraventricular Ectopic',
    'Ventricular Ectopic',
    'Fusion Beat',
    'Unknown'
  ].map((name) => ({
    name,
    code: AAMI_CODES[name],
    prob: typeof activeProbs[name] === 'number' ? activeProbs[name] : 0,
    color: CLASS_COLORS[name] || '#06b6d4'
  }));

  const isDominantNormal = (dominant_rhythm || activeClassName) === 'Normal';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Primary Classification Result */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              1D-CNN Cardiac Rhythm Classification
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              {currentFile?.name || 'ecg_recording.csv'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              AAMI EC57 Standard
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Dominant Class Badge */}
          <div className="md:col-span-7 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              {heartbeats.length > 1 ? 'Dominant Rhythm Classification' : 'Predicted Rhythm Category'}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: CLASS_COLORS[activeClassName] || '#38bdf8' }}
              >
                {activeClassName}
              </span>
              <span
                className="px-2.5 py-1 rounded-lg text-sm font-mono font-bold border"
                style={{
                  color: CLASS_COLORS[activeClassName] || '#38bdf8',
                  borderColor: `${CLASS_COLORS[activeClassName]}40`,
                  backgroundColor: `${CLASS_COLORS[activeClassName]}15`
                }}
              >
                Class {activeAamiCode}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              {activeClassName === 'Normal' &&
                'Uniform sinus cycle without premature depolarization or wide ventricular morphology detected.'}
              {activeClassName === 'Supraventricular Ectopic' &&
                'Early narrow QRS complex likely originating above ventricles (atrial or nodal focus).'}
              {activeClassName === 'Ventricular Ectopic' &&
                'Premature bizarre wide QRS complex (>120 ms) with discordant T-wave morphology.'}
              {activeClassName === 'Fusion Beat' &&
                'Hybrid cardiac cycle resulting from collision between ventricular and supraventricular pacemakers.'}
              {activeClassName === 'Unknown' &&
                'Paced rhythm spike or distorted waveform pattern not matching standard intrinsic classes.'}
            </p>
          </div>

          {/* Right: Confidence Score Dial */}
          <div className="md:col-span-5 flex flex-col justify-center sm:items-end p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400">Model Posterior Confidence</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1">
              {activeConfidence.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 max-w-xs sm:text-right">
              Statistical output probability from final Softmax layer. <span className="text-amber-400/90 font-medium">Not a clinical diagnostic certainty.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-beat Recording Summary Cards (if continuous recording) */}
      {heartbeats.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Valid Beats</span>
            <div className="text-2xl font-bold text-white font-mono">
              {total_heartbeats}
            </div>
            <p className="text-[11px] text-slate-400">Physiological R-peaks segmented</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Estimated Heart Rate</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              {estimated_hr > 0 ? `${estimated_hr} BPM` : 'N/A'}
            </div>
            <p className="text-[11px] text-slate-400">Based on mean RR interval</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Abnormal Beats Count</span>
            <div className={`text-2xl font-bold font-mono ${abnormal_heartbeats > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {abnormal_heartbeats}
            </div>
            <p className="text-[11px] text-slate-400">Non-normal rhythm cycles</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Abnormality Fraction</span>
            <div className="text-2xl font-bold text-slate-200 font-mono">
              {abnormality_rate}%
            </div>
            <p className="text-[11px] text-slate-400">Of total processed cycles</p>
          </div>
        </div>
      )}

      {/* Probability Distribution Chart for all 5 Classes */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              AAMI EC57 Class Probability Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Posterior Softmax probabilities computed by the 1D-CNN model graph
            </p>
          </div>

          {heartbeats.length > 1 && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
              Inspecting Beat #{selectedBeatIndex + 1} of {heartbeats.length}
            </span>
          )}
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="code"
                stroke="#94a3b8"
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                tickFormatter={(val) => `Class ${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs shadow-xl space-y-0.5">
                        <div className="font-semibold text-white">
                          {item.name} (Class {item.code})
                        </div>
                        <div className="font-mono text-cyan-400 font-bold">
                          Probability: {item.prob.toFixed(2)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="prob" radius={[0, 6, 6, 0]} barSize={22}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5-Class Detailed Value Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          {chartData.map((item) => (
            <div
              key={item.code}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-left"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold" style={{ color: item.color }}>
                  Class {item.code}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {item.prob.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs font-medium text-slate-300 truncate">
                {item.name}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.prob))}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-beat Scrubber / Beat Breakdown List */}
      {heartbeats.length > 1 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Individual Heartbeat Predictions ({heartbeats.length} beats)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Click any beat to load its specific probability distribution
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 divide-y divide-slate-800/80">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 font-medium sticky top-0">
                <tr>
                  <th className="py-2.5 px-3"># Beat</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Predicted Class</th>
                  <th className="py-2.5 px-3">AAMI Code</th>
                  <th className="py-2.5 px-3">Model Confidence</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {heartbeats.map((beat, idx) => {
                  const isSelected = idx === selectedBeatIndex;
                  const isNormal = beat.predicted_class_name === 'Normal';
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedBeatIndex(idx)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-500/15 text-white font-medium'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        #{beat.beat_index || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {beat.timestamp_seconds !== undefined
                          ? `${beat.timestamp_seconds}s`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        <span style={{ color: CLASS_COLORS[beat.predicted_class_name] || '#38bdf8' }}>
                          {beat.predicted_class_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isNormal
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {beat.aami_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {beat.confidence ? `${beat.confidence.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBeatIndex(idx);
                            setActiveNav('viewer');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 transition text-[11px]"
                        >
                          View Waveform
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveNav('viewer')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Open in ECG Viewer</span>
        </button>

        <button
          onClick={() => setActiveNav('reports')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 transition shadow-md shadow-cyan-900/20"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Analysis Report</span>
        </button>
      </div>
    </div>
  );
}
