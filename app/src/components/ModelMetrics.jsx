import React, { useState } from 'react';
import { 
  BarChart2, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Info, 
  Target, 
  Database,
  Grid,
  FileCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  MODEL_ARCHITECTURE, 
  OVERALL_METRICS, 
  PER_CLASS_METRICS, 
  CONFUSION_MATRIX, 
  EPOCH_HISTORY 
} from '../data/modelMetricsData';

export default function ModelMetrics() {
  const [metricTab, setMetricTab] = useState('accuracy'); // 'accuracy' or 'loss'
  const [matrixMode, setMatrixMode] = useState('percent'); // 'percent' or 'count'

  // Calculate normalized row percentages for confusion matrix
  const matrixPercentages = CONFUSION_MATRIX.matrix.map((row) => {
    const rowSum = row.reduce((a, b) => a + b, 0);
    return row.map(val => (rowSum > 0 ? (val / rowSum) * 100 : 0));
  });

  return (
    <div className="space-y-8 py-4">
      
      {/* Header & Disclosure */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-cyan-400" />
              1D-CNN Model Evaluation & Benchmark Metrics
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Target experimental evaluation on the MIT-BIH Arrhythmia Database under the AAMI EC57 standard.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Benchmark target figures; model training pipeline configured in <code>src/</code></span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Test Accuracy</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono my-1">
            {OVERALL_METRICS.accuracy.target}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {OVERALL_METRICS.accuracy.change}
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Macro F1-Score</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono my-1">
            {OVERALL_METRICS.f1Score.target}
          </div>
          <div className="text-[11px] text-teal-400/80">
            {OVERALL_METRICS.f1Score.change}
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Sensitivity (Recall)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono my-1">
            {OVERALL_METRICS.sensitivity.target}
          </div>
          <div className="text-[11px] text-emerald-400/80">
            {OVERALL_METRICS.sensitivity.change}
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Specificity</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono my-1">
            {OVERALL_METRICS.specificity.target}
          </div>
          <div className="text-[11px] text-blue-400/80">
            {OVERALL_METRICS.specificity.change}
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 font-medium">Macro AUROC</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono my-1">
            {OVERALL_METRICS.auroc.target}
          </div>
          <div className="text-[11px] text-purple-400/80">
            {OVERALL_METRICS.auroc.change}
          </div>
        </div>

      </div>

      {/* Training & Validation Epoch Curves (Recharts) */}
      <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Training & Validation Convergence (25 Epochs)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated with Adam optimizer, batch size 64, and categorical cross-entropy loss with cosine annealing.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMetricTab('accuracy')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                metricTab === 'accuracy'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Accuracy (%)
            </button>
            <button
              onClick={() => setMetricTab('loss')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                metricTab === 'loss'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Loss (Cross-Entropy)
            </button>
          </div>
        </div>

        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={EPOCH_HISTORY} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="epoch" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                unit=" ep"
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                domain={metricTab === 'accuracy' ? [70, 100] : [0, 1.0]}
                unit={metricTab === 'accuracy' ? '%' : ''}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#090d16', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px'
                }} 
              />
              <Legend verticalAlign="top" height={36} />
              
              {metricTab === 'accuracy' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="trainAcc" 
                    name="Training Accuracy (%)" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#06b6d4' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valAcc" 
                    name="Validation Accuracy (%)" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#10b981' }} 
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="trainLoss" 
                    name="Training Loss" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#f43f5e' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valLoss" 
                    name="Validation Loss" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#f59e0b' }} 
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix & Per-Class Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interactive Confusion Matrix */}
        <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-cyan-400" />
                AAMI EC57 Confusion Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Ground Truth (Rows) vs Model Predictions (Columns)
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setMatrixMode('percent')}
                className={`px-2 py-0.5 rounded transition ${
                  matrixMode === 'percent' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                % Recall
              </button>
              <button
                onClick={() => setMatrixMode('count')}
                className={`px-2 py-0.5 rounded transition ${
                  matrixMode === 'count' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Counts
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-[11px] font-mono text-slate-400 text-left">Actual \ Pred</th>
                  {CONFUSION_MATRIX.classes.map(c => (
                    <th key={c} className="p-2 text-xs font-mono font-bold text-cyan-400">
                      Class {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONFUSION_MATRIX.classes.map((actualClass, rowIdx) => (
                  <tr key={actualClass} className="border-t border-slate-800/60">
                    <td className="p-2 text-xs font-mono font-bold text-slate-300 text-left">
                      Class {actualClass}
                    </td>
                    {CONFUSION_MATRIX.classes.map((predClass, colIdx) => {
                      const count = CONFUSION_MATRIX.matrix[rowIdx][colIdx];
                      const pct = matrixPercentages[rowIdx][colIdx];
                      const isDiagonal = rowIdx === colIdx;

                      // Color intensity based on value
                      let cellBg = 'bg-slate-950/40 text-slate-400';
                      if (isDiagonal) {
                        cellBg = pct > 95 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-cyan-500/20 text-cyan-300 font-bold';
                      } else if (pct > 2.0) {
                        cellBg = 'bg-rose-500/20 text-rose-300 font-medium';
                      } else if (pct > 0.5) {
                        cellBg = 'bg-amber-500/10 text-amber-300';
                      }

                      return (
                        <td key={predClass} className="p-1 sm:p-2">
                          <div className={`rounded-lg py-2 px-1 text-xs font-mono ${cellBg} border border-slate-800/40`}>
                            {matrixMode === 'percent' ? `${pct.toFixed(1)}%` : count.toLocaleString()}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50"></span>
              Diagonal: Correct Classifications
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50"></span>
              Off-Diagonal: Misclassifications
            </span>
          </div>
        </div>

        {/* Per-Class Detailed Performance Table */}
        <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Per-Class Diagnostic Statistics
            </h3>
            <p className="text-xs text-slate-400">
              Evaluation metrics across individual AAMI EC57 heartbeat categories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2">Precision</th>
                  <th className="py-2 px-2">Recall</th>
                  <th className="py-2 px-2">F1-Score</th>
                  <th className="py-2 px-2 text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {PER_CLASS_METRICS.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                          {row.code}
                        </span>
                        <span className="truncate max-w-[120px] sm:max-w-none text-slate-300 font-sans">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-cyan-300 font-semibold">{row.precision.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-emerald-300 font-semibold">{row.recall.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-teal-300 font-semibold">{row.f1Score.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-right text-slate-400">{row.support.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Imbalance Handling:</strong> Class V (Ventricular) and Class S (Supraventricular) 
            are heavily weighted using focal loss and minority oversampling to prevent false negatives on life-threatening arrhythmic events.
          </div>
        </div>

      </div>

      {/* 1D-CNN Architecture Blueprint */}
      <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              1D Convolutional Neural Network Architecture
            </h3>
            <p className="text-xs text-slate-400">
              {MODEL_ARCHITECTURE.modelName} • {MODEL_ARCHITECTURE.totalParameters} • Latency: {MODEL_ARCHITECTURE.inferenceLatency}
            </p>
          </div>
        </div>

        {/* Layer-by-layer sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODEL_ARCHITECTURE.layers.map((layer, idx) => (
            <div key={idx} className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-cyan-400 font-bold">L{idx + 1}</span>
                <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                  {layer.shape}
                </span>
              </div>
              <div className="text-xs font-bold text-white">{layer.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{layer.type}</div>
              <p className="text-[11px] text-slate-400 pt-1 leading-snug">{layer.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
