import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  CheckCircle2,
  ChevronRight,
  Activity,
  Cpu,
  BarChart2,
  Clock,
  HeartPulse,
  ListFilter
} from 'lucide-react';

export default function PredictionPanel({
  prediction = {},
  patient = {},
  onSelectBeat = null
}) {
  const {
    primaryClass = 'Normal Beat (Class N)',
    aamiCode = 'N',
    confidence = 98.7,
    isDemo = true,
    isReady = false,
    riskLevel = 'Normal',
    probabilities = [],
    xaiExplanation = {},
    summary = null,
    heartbeats = []
  } = prediction;

  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);

  const riskBadgeStyles = {
    Normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  const riskIcon = {
    Normal: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    Low: <Info className="w-4 h-4 text-blue-400" />,
    Moderate: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    High: <AlertCircle className="w-4 h-4 text-rose-400" />
  };

  // If a multi-beat summary exists, allow viewing active beat details
  const activeBeat = (heartbeats && heartbeats.length > 0 && selectedBeatIndex < heartbeats.length)
    ? heartbeats[selectedBeatIndex]
    : null;

  const displayedClass = activeBeat ? activeBeat.predicted_class_name : primaryClass;
  const displayedCode = activeBeat ? activeBeat.aami_code : aamiCode;
  const displayedConfidence = activeBeat ? activeBeat.confidence : confidence;
  const displayedProbs = (activeBeat && activeBeat.probabilities)
    ? Object.entries(activeBeat.probabilities).map(([name, prob]) => ({
        class: name,
        prob: prob,
        code: name.startsWith('Normal') ? 'N' :
              name.startsWith('Supra') ? 'S' :
              name.startsWith('Vent') ? 'V' :
              name.startsWith('Fusion') ? 'F' : 'Q'
      }))
    : probabilities;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-5">

      {/* Header with Inference Source Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            CNN Heartbeat Classification Results
          </h3>
          <p className="text-xs text-slate-400">
            AAMI EC57 Multi-Class Heartbeat Category Mapping
          </p>
        </div>

        {/* Live Model vs Demo Status Badge */}
        {!isDemo && !isReady ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE 1D-CNN INFERENCE (Focal Loss Model)
          </span>
        ) : isReady ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/40">
            <Info className="w-3 h-3 text-cyan-400" />
            READY FOR INFERENCE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/40">
            <Info className="w-3 h-3 text-amber-400" />
            [DEMO CASE - PRESET WAVEFORM]
          </span>
        )}
      </div>

      {/* Overall Multi-Beat Summary Banner (if continuous ECG processed) */}
      {summary && summary.totalBeats > 1 && (
        <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-cyan-400" />
              Continuous Recording Multi-Beat Summary
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Total Analyzed: {summary.totalBeats} Beats
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Dominant Rhythm</span>
              <span className="text-xs font-bold text-white truncate block">{summary.dominantRhythm}</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Estimated Rate</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">{summary.estimatedHr} BPM</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Abnormal Beats</span>
              <span className={`text-xs font-bold font-mono ${summary.abnormalBeats > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {summary.abnormalBeats} ({summary.abnormalityRate}%)
              </span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Classification Standard</span>
              <span className="text-xs font-bold text-slate-300">AAMI EC57 (5 Classes)</span>
            </div>
          </div>

          {/* Individual Heartbeat Selection Scrubber */}
          {heartbeats && heartbeats.length > 1 && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Select Heartbeat Cycle:</span>
                <span className="text-cyan-400">Beat #{selectedBeatIndex + 1} of {heartbeats.length}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {heartbeats.map((beat, idx) => {
                  const isCur = idx === selectedBeatIndex;
                  const isAbn = beat.predicted_class !== 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedBeatIndex(idx)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all border ${
                        isCur
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : isAbn
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      #{idx + 1} ({beat.timestamp_seconds ? `${beat.timestamp_seconds}s` : beat.aami_code})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Result Banner */}
      <div className="bg-slate-950/70 rounded-xl p-4 sm:p-5 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border font-mono ${riskBadgeStyles[riskLevel] || riskBadgeStyles.Normal}`}>
              Class {displayedCode}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskBadgeStyles[riskLevel] || riskBadgeStyles.Normal}`}>
              {riskIcon[riskLevel] || riskIcon.Normal}
              {riskLevel} Priority
            </span>
            {activeBeat && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                Cycle #{selectedBeatIndex + 1} @ {activeBeat.timestamp_seconds}s
              </span>
            )}
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-white">
            {displayedClass}
          </div>

          <p className="text-xs text-slate-400 max-w-md">
            Model inference output based on 1D-CNN temporal convolution over the 187-sample cardiac cycle.
          </p>
        </div>

        {/* Confidence Meter Box */}
        <div className="sm:text-right bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 shrink-0">
          <div className="text-[11px] text-slate-400 uppercase font-medium">Model Confidence</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {displayedConfidence.toFixed(1)}%
          </div>
          <div className="w-24 sm:w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 sm:ml-auto">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(displayedConfidence, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Multi-Class Posterior Probability Distribution (All 5 Classes) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>AAMI EC57 Five-Class Softmax Probabilities</span>
          <span className="text-slate-400 text-[11px]">Softmax Posterior</span>
        </div>

        <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          {displayedProbs.map((item) => {
            const isHighest = item.prob === Math.max(...displayedProbs.map(p => p.prob));
            return (
              <div key={item.class || item.code} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-mono ${isHighest ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                    {item.class} ({item.code || '?'})
                  </span>
                  <span className={`font-mono ${isHighest ? 'text-white font-bold' : 'text-slate-400'}`}>
                    {(item.prob || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighest
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-slate-700/50'
                    }`}
                    style={{ width: `${Math.min(item.prob || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Morphological Interval Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-medium">Heart Rate</span>
          <span className="text-sm font-bold font-mono text-white">
            {patient.heartRate ? `${patient.heartRate} BPM` : '75 BPM'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Norm: 60-100</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-medium">QRS Duration</span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {patient.qrsDuration || '88 ms'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Norm: &lt;120 ms</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-medium">PR Interval</span>
          <span className="text-sm font-bold font-mono text-white">
            {patient.prInterval || '162 ms'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Norm: 120-200 ms</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-medium">Sampling & Length</span>
          <span className="text-sm font-bold font-mono text-white">
            187 Samples
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">125 Hz standard</span>
        </div>
      </div>

      {/* Explainable AI (XAI) Attribution Card */}
      {xaiExplanation && xaiExplanation.summary && (
        <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Explainable AI (XAI) Feature Attribution
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {xaiExplanation.summary}
          </p>

          {xaiExplanation.keyFeatures && (
            <div className="space-y-1 pt-1">
              {xaiExplanation.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-cyan-900/40">
            {xaiExplanation.attentionFocus}
          </div>
        </div>
      )}

      {/* Educational Prototype Footnote */}
      <div className="text-[10px] text-slate-400 text-center italic">
        Educational ECG classification prototype using a 1D CNN trained with Focal Loss on the MIT-BIH dataset. Not a clinically validated diagnostic tool.
      </div>

    </div>
  );
}
