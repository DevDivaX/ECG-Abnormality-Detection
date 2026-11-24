import React, { useState } from 'react';
import {
  Activity,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Layers,
  Heart,
  BarChart2,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import ECGWaveformViewer from '../ECGWaveformViewer';

export default function ECGViewerView() {
  const {
    currentFile,
    previewSignal,
    analysisResult,
    selectedBeatIndex,
    setSelectedBeatIndex,
    setActiveNav
  } = useAnalysis();

  const [viewMode, setViewMode] = useState('segmented'); // 'segmented' or 'continuous'

  const heartbeats = analysisResult?.heartbeats || [];
  const activeBeat = heartbeats.length > 0 && selectedBeatIndex < heartbeats.length
    ? heartbeats[selectedBeatIndex]
    : null;

  // Decide points to plot
  let pointsToPlot = [];
  let title = 'ECG Waveform';
  let sampleRate = 125;

  if (viewMode === 'segmented' && activeBeat && activeBeat.signal_points) {
    pointsToPlot = activeBeat.signal_points;
    title = `Segmented Beat #${selectedBeatIndex + 1} (${activeBeat.predicted_class_name})`;
    sampleRate = 125;
  } else if (previewSignal && previewSignal.points && previewSignal.points.length > 0) {
    pointsToPlot = previewSignal.points;
    title = currentFile ? `Full Recording: ${currentFile.name}` : 'Continuous Signal';
    sampleRate = previewSignal.sampleRate || 125;
  } else if (activeBeat && activeBeat.signal_points) {
    pointsToPlot = activeBeat.signal_points;
    title = `Beat #${selectedBeatIndex + 1}`;
  }

  if (pointsToPlot.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Activity className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">No ECG Signal Loaded</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload an ECG CSV file or load a repository benchmark sample to inspect waveforms and morphological patterns in the interactive viewer.
          </p>
        </div>
        <button
          onClick={() => setActiveNav('new-analysis')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:brightness-110 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload ECG Recording</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            ECG Waveform Viewer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Interactive high-fidelity signal inspection with pan, zoom, and physiological R-peak tracking.
          </p>
        </div>

        {/* View Mode Toggle (if multiple heartbeats exist) */}
        {heartbeats.length > 0 && previewSignal?.points && (
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('segmented')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'segmented'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Segmented Beat
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'continuous'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Continuous Recording
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Waveform Plot */}
      <ECGWaveformViewer
        points={pointsToPlot}
        title={title}
        sampleRate={sampleRate}
        highlightBeatIndex={viewMode === 'segmented' ? selectedBeatIndex : null}
        detectedBeats={previewSignal?.detectedBeats || heartbeats.length}
      />

      {/* Heartbeat Scrubber / Navigator (if multi-beat analysis exists) */}
      {heartbeats.length > 1 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Detected Heartbeats Scrubber ({heartbeats.length} total beats)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedBeatIndex((idx) => Math.max(0, idx - 1))}
                disabled={selectedBeatIndex <= 0}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-cyan-300">
                Beat {selectedBeatIndex + 1} of {heartbeats.length}
              </span>
              <button
                onClick={() => setSelectedBeatIndex((idx) => Math.min(heartbeats.length - 1, idx + 1))}
                disabled={selectedBeatIndex >= heartbeats.length - 1}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Beat Cards Ribbon */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
            {heartbeats.map((beat, idx) => {
              const isSelected = idx === selectedBeatIndex;
              const isNormal = beat.predicted_class_name === 'Normal';
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedBeatIndex(idx);
                    setViewMode('segmented');
                  }}
                  className={`shrink-0 w-32 p-2.5 rounded-xl text-left border transition ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-slate-400">#{beat.beat_index || idx + 1}</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        isNormal
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {beat.aami_code}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {beat.predicted_class_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {beat.confidence ? `${beat.confidence.toFixed(1)}%` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Signal Information & Processing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Temporal Segmentation</span>
          <div className="text-sm font-semibold text-white">
            187 Samples Window (125 Hz)
          </div>
          <p className="text-[11px] text-slate-400">
            Window centered on R-peak with standard MIT-BIH padding.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Signal Filtering</span>
          <div className="text-sm font-semibold text-white">
            Butterworth Bandpass (0.5 – 40 Hz)
          </div>
          <p className="text-[11px] text-slate-400">
            Removes baseline respiratory drift and high-frequency EMG noise.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Model Compatibility</span>
          <div className="text-sm font-semibold text-emerald-400">
            Validated for 1D-CNN Ingestion
          </div>
          <p className="text-[11px] text-slate-400">
            Input vector normalized to [0, 1] range matching training distribution.
          </p>
        </div>
      </div>
    </div>
  );
}
