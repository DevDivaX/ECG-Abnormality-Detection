import React from 'react';
import { Activity, ShieldCheck, Cpu, Database, Award, ArrowRight, Zap, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

export default function Overview({ setActiveTab, onSelectPreset }) {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Signal Ingestion & Cleaning',
      desc: 'Raw ECG signals (e.g. MIT-BIH Arrhythmia Database) sampled at 250-360 Hz. Baseline drift is eliminated via high-pass filtering (0.5 Hz) and high-frequency muscular noise removed via Butterworth low-pass filtering (40 Hz).',
      badge: 'Signal Processing'
    },
    {
      step: '02',
      title: 'QRS Peak Detection & Segmentation',
      desc: 'Pan-Tompkins algorithm isolates R-peaks. Each individual cardiac cycle is segmented into a standardized 250-sample window centered on the R-peak (covering P-wave depolarization through T-wave repolarization).',
      badge: 'Segmentation'
    },
    {
      step: '03',
      title: '1D-CNN Deep Feature Learning',
      desc: '1D Convolutional Neural Network with residual skip connections extracts morphological and temporal features across varying receptive fields without requiring manual handcrafted wave parameters.',
      badge: 'Deep Learning'
    },
    {
      step: '04',
      title: 'AAMI EC57 Classification & XAI',
      desc: 'Softmax dense head outputs posterior probabilities across the 5 standard clinical classes (N, S, V, F, Q). Temporal saliency maps identify which morphological waves influenced the CNN prediction.',
      badge: 'Clinical Decision'
    }
  ];

  const taxonomy = [
    {
      code: 'N',
      name: 'Normal & Bundle Branch',
      color: 'emerald',
      bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Normal sinus rhythm, Left and Right bundle branch blocks, sinus bradycardia/tachycardia.'
    },
    {
      code: 'S',
      name: 'Supraventricular Ectopic',
      color: 'amber',
      bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Atrial premature contractions (PACs), aberrant atrial beats, nodal premature beats, supraventricular tachycardias.'
    },
    {
      code: 'V',
      name: 'Ventricular Ectopic',
      color: 'rose',
      bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      description: 'Premature ventricular contractions (PVCs), ventricular escape beats, ventricular bigeminy / trigeminy.'
    },
    {
      code: 'F',
      name: 'Fusion Beats',
      color: 'purple',
      bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      description: 'Hybrid beats produced when ventricular ectopic pacemakers and supraventricular impulses collide.'
    },
    {
      code: 'Q',
      name: 'Paced & Unclassifiable',
      color: 'cyan',
      bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      description: 'Artificial electronic pacemaker spikes, unclassifiable beats, distorted artifacts.'
    }
  ];

  return (
    <div className="space-y-10 py-2 sm:py-6">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-3.5 h-3.5" />
            College Project • 1D Convolutional Neural Network
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Automated <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">ECG Abnormality</span> Detection
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            An explainable deep learning interface designed to assist in rapid screening of cardiac arrhythmias. 
            By processing continuous raw electrocardiogram signals through a 1D-CNN, the system identifies ectopic 
            heartbeats, irregular intervals, and dangerous conduction defects in real time.
          </p>

          {/* Quick stats pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-cyan-400">97.8%</div>
              <div className="text-xs text-slate-400 font-medium">Target Accuracy</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400">5 Classes</div>
              <div className="text-xs text-slate-400 font-medium">AAMI EC57 Standard</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">&lt;5 ms</div>
              <div className="text-xs text-slate-400 font-medium">Inference Latency</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">MIT-BIH</div>
              <div className="text-xs text-slate-400 font-medium">Benchmark Data</div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('studio')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
            >
              <Activity className="w-4 h-4" />
              Launch Waveform Studio
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              View Model Metrics & Architecture
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Motivation & Problem Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">The Clinical Problem</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Cardiovascular diseases remain the leading cause of global mortality. While prolonged Holter monitoring 
            records upwards of 100,000 beats per patient over 24 hours, manual inspection by cardiologists is 
            exhausting, slow, and error-prone during subtle nocturnal arrhythmias such as intermittent Premature Ventricular Contractions (PVCs) or paroxysmal Atrial Fibrillation.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              High diagnostic delay in non-specialist emergency triage.
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Transient, paroxysmal arrhythmias frequently missed on brief 10-second strips.
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">The 1D-CNN Solution</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike 2D image models that require converting 1D electrical traces into spectrograms or image plots, 
            a <strong>1D Convolutional Neural Network</strong> operates directly on raw sequential voltage values. 
            This preserves exact millivolt amplitudes, timing relationships, and temporal phase while running in under 5 milliseconds.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Direct temporal convolution captures P-Q-R-S-T wave morphometry.
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Lightweight model footprint ideal for edge telemetry & wearable devices.
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="bg-slate-900/70 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">System Architecture & Processing Pipeline</h3>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end signal processing and classification workflow from raw lead input to clinical risk score.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((p) => (
            <div key={p.step} className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between space-y-3 relative group hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-700 group-hover:text-cyan-500/70 transition font-mono">
                  {p.step}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {p.badge}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1.5">{p.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AAMI EC57 Categorization Standard */}
      <div className="bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">AAMI EC57 Standard Heartbeat Categories</h3>
          <p className="text-sm text-slate-400 mt-1">
            The Association for the Advancement of Medical Instrumentation (AAMI) standard groups the 15+ MIT-BIH beat types into five clinically relevant classes:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {taxonomy.map((item) => (
            <div key={item.code} className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-base font-bold font-mono px-2.5 py-0.5 rounded border ${item.bgClass}`}>
                  Class {item.code}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200">{item.name}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launch Clinical Cases */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-800/40 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-white">Ready to test the interactive ECG monitor?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Open the Waveform Studio to inspect realistic clinical wave samples or upload your own CSV data.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('studio')}
          className="shrink-0 px-6 py-3 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md font-bold transition transform active:scale-95 flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Open Waveform Studio
        </button>
      </div>

    </div>
  );
}
