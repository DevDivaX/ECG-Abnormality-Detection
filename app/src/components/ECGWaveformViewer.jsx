import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Grid,
  Maximize2,
  Activity,
  Layers
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export default function ECGWaveformViewer({
  points = [],
  title = 'ECG Waveform Monitor',
  sampleRate = 125,
  highlightBeatIndex = null,
  detectedBeats = 0
}) {
  const { paperGridMode, setPaperGridMode } = useAnalysis();

  // Zoom & View Window State
  const [zoomLevel, setZoomLevel] = useState(1.0); // 0.5x to 4.0x
  const [panOffset, setPanOffset] = useState(0); // in seconds
  const [gain, setGain] = useState(1.0); // 0.5x, 1.0x, 1.5x, 2.0x
  const [isPlaying, setIsPlaying] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Base window size: at 1x, show 3.0 seconds (or entire signal if shorter)
  const totalDuration = useMemo(() => {
    if (!points || points.length === 0) return 1.5;
    const last = points[points.length - 1];
    return Math.max(1.5, last.time || points.length / sampleRate);
  }, [points, sampleRate]);

  const visibleDuration = useMemo(() => {
    // higher zoom = smaller visible duration window
    return Math.min(totalDuration, Math.max(0.5, totalDuration / zoomLevel));
  }, [totalDuration, zoomLevel]);

  // Constrain pan offset
  const maxPan = Math.max(0, totalDuration - visibleDuration);
  const currentPan = Math.min(maxPan, Math.max(0, panOffset));

  // Filter visible points within window [currentPan, currentPan + visibleDuration]
  const visiblePoints = useMemo(() => {
    if (!points || points.length === 0) return [];
    return points.filter(
      (p) => p.time >= currentPan - 0.05 && p.time <= currentPan + visibleDuration + 0.05
    );
  }, [points, currentPan, visibleDuration]);

  // Voltage min/max for scale
  const { vMin, vMax } = useMemo(() => {
    if (!points || points.length === 0) return { vMin: -0.5, vMax: 1.5 };
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      if (p.voltage < min) min = p.voltage;
      if (p.voltage > max) max = p.voltage;
    }
    const pad = (max - min) * 0.15 || 0.2;
    return {
      vMin: Math.min(-0.2, min - pad),
      vMax: Math.max(1.1, max + pad)
    };
  }, [points]);

  // Coordinate dimensions
  const svgWidth = 1000;
  const svgHeight = 340;
  const pad = { top: 25, right: 30, bottom: 42, left: 60 };
  const graphWidth = svgWidth - pad.left - pad.right;
  const graphHeight = svgHeight - pad.top - pad.bottom;

  const getX = (t) => {
    const relTime = t - currentPan;
    return pad.left + (relTime / visibleDuration) * graphWidth;
  };

  const getY = (v) => {
    const scaledV = v * gain;
    const norm = (scaledV - vMin) / (vMax - vMin || 1);
    return pad.top + (1 - norm) * graphHeight;
  };

  // Build SVG Path Data
  const pathD = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    return visiblePoints.reduce((acc, pt, i) => {
      const x = getX(pt.time);
      const y = getY(pt.voltage);
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [visiblePoints, currentPan, visibleDuration, gain, vMin, vMax]);

  // R-peaks in visible slice
  const visiblePeaks = useMemo(() => {
    return visiblePoints.filter((p) => p.isRPeak);
  }, [visiblePoints]);

  // Playback Sweep Animation
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (time) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setSweepProgress((prev) => {
        const next = prev + dt / visibleDuration;
        return next >= 1 ? 0 : next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, visibleDuration]);

  // Controls Handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(5.0, z * 1.3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.5, z / 1.3));
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset(0);
    setGain(1.0);
  };

  const handlePanLeft = () => {
    setPanOffset((prev) => Math.max(0, prev - visibleDuration * 0.3));
  };
  const handlePanRight = () => {
    setPanOffset((prev) => Math.min(maxPan, prev + visibleDuration * 0.3));
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current || visiblePoints.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const normX = (mouseX / rect.width) * svgWidth;
    if (normX < pad.left || normX > svgWidth - pad.right) {
      setHoveredPoint(null);
      return;
    }

    const relFraction = (normX - pad.left) / graphWidth;
    const hoverTime = currentPan + relFraction * visibleDuration;

    // Find nearest point
    let closest = visiblePoints[0];
    let minDiff = Math.abs(closest.time - hoverTime);
    for (let i = 1; i < visiblePoints.length; i++) {
      const diff = Math.abs(visiblePoints[i].time - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = visiblePoints[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  // Time grid vertical ticks (5 ticks across window)
  const timeTicks = useMemo(() => {
    const ticks = [];
    const step = visibleDuration / 5;
    for (let i = 0; i <= 5; i++) {
      const t = currentPan + i * step;
      ticks.push(t);
    }
    return ticks;
  }, [currentPan, visibleDuration]);

  // Voltage grid horizontal ticks (4 ticks)
  const voltageTicks = useMemo(() => {
    const ticks = [];
    const step = (vMax - vMin) / 4;
    for (let i = 0; i <= 4; i++) {
      const v = vMin + i * step;
      ticks.push(v);
    }
    return ticks;
  }, [vMin, vMax]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3">
      {/* Viewer Header with Title & Signal Stats */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          {highlightBeatIndex !== null && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Beat #{highlightBeatIndex + 1}
            </span>
          )}
        </div>

        {/* Signal Specs Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {sampleRate} Hz
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {totalDuration.toFixed(2)}s Duration
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {points.length} Samples
          </span>
          {detectedBeats > 0 && (
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/30">
              {detectedBeats} QRS Peaks
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full select-none cursor-crosshair transition-colors duration-200 ${
          paperGridMode ? 'ecg-grid-paper' : 'ecg-grid-dark'
        }`}
        style={{ height: '340px' }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Y-Axis Label */}
          <text
            transform="rotate(-90)"
            x={-(pad.top + graphHeight / 2)}
            y="16"
            textAnchor="middle"
            fill={paperGridMode ? '#9f1239' : '#94a3b8'}
            fontSize="10"
            fontWeight="600"
            fontFamily="sans-serif"
            letterSpacing="0.05em"
          >
            Voltage (mV) / Amplitude
          </text>

          {/* X-Axis Label */}
          <text
            x={pad.left + graphWidth / 2}
            y={svgHeight - 4}
            textAnchor="middle"
            fill={paperGridMode ? '#9f1239' : '#94a3b8'}
            fontSize="10"
            fontWeight="600"
            fontFamily="sans-serif"
            letterSpacing="0.05em"
          >
            Time (seconds)
          </text>

          {/* Grid lines and Ticks */}
          {timeTicks.map((t, idx) => {
            const x = getX(t);
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={svgHeight - pad.bottom}
                  stroke={paperGridMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(51, 65, 85, 0.4)'}
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={svgHeight - 18}
                  textAnchor="middle"
                  fill={paperGridMode ? '#9f1239' : '#64748b'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {t.toFixed(2)}s
                </text>
              </g>
            );
          })}

          {voltageTicks.map((v, idx) => {
            const y = getY(v);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={svgWidth - pad.right}
                  y2={y}
                  stroke={paperGridMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(51, 65, 85, 0.4)'}
                  strokeDasharray="3 3"
                />
                <text
                  x={pad.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill={paperGridMode ? '#9f1239' : '#64748b'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* R-Peak Detection Markers */}
          {visiblePeaks.map((peak, idx) => {
            const px = getX(peak.time);
            const py = getY(peak.voltage);
            return (
              <g key={`peak-${idx}`}>
                <circle
                  cx={px}
                  cy={py}
                  r="4"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={px}
                  y={py - 8}
                  textAnchor="middle"
                  fill="#f43f5e"
                  fontSize="9"
                  fontWeight="bold"
                >
                  R
                </text>
              </g>
            );
          })}

          {/* Actual ECG Waveform Polyline / Path */}
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              stroke={paperGridMode ? '#0f172a' : '#06b6d4'}
              strokeWidth={paperGridMode ? '2' : '2.2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={paperGridMode ? '' : 'ecg-glow-cyan'}
            />
          ) : (
            <text
              x={svgWidth / 2}
              y={svgHeight / 2}
              textAnchor="middle"
              fill="#64748b"
              fontSize="13"
            >
              No ECG signal data loaded. Upload a CSV to view the waveform.
            </text>
          )}

          {/* Playback Sweep Line */}
          {isPlaying && (
            <line
              x1={pad.left + sweepProgress * graphWidth}
              y1={pad.top}
              x2={pad.left + sweepProgress * graphWidth}
              y2={svgHeight - pad.bottom}
              stroke="#10b981"
              strokeWidth="2"
              className="ecg-glow-green"
            />
          )}

          {/* Hover Crosshair Point */}
          {hoveredPoint && (
            <g>
              <circle
                cx={getX(hoveredPoint.time)}
                cy={getY(hoveredPoint.voltage)}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Coordinate Card */}
        {hoveredPoint && (
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono shadow-lg text-slate-200 pointer-events-none"
          >
            <div>Time: <span className="text-cyan-400">{hoveredPoint.time.toFixed(3)}s</span></div>
            <div>Voltage: <span className="text-cyan-400">{hoveredPoint.voltage.toFixed(4)} mV</span></div>
          </div>
        )}
      </div>

      {/* Viewer Navigation & Zoom Controls Bar */}
      <div className="px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Playback & Grid Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg border font-medium flex items-center gap-1.5 transition ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title={isPlaying ? 'Pause Sweep' : 'Play Live Sweep'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Sweep'}</span>
          </button>

          <button
            onClick={() => setPaperGridMode(!paperGridMode)}
            className={`p-2 rounded-lg border font-medium flex items-center gap-1.5 transition ${
              paperGridMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{paperGridMode ? 'Pink Paper' : 'Dark Grid'}</span>
          </button>

          {/* Gain Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <span className="text-slate-400">Gain:</span>
            {[0.5, 1.0, 1.5, 2.0].map((g) => (
              <button
                key={g}
                onClick={() => setGain(g)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                  gain === g
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Zoom & Panning Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 pr-1 hidden sm:inline">Zoom:</span>

          <button
            onClick={handlePanLeft}
            disabled={currentPan <= 0}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition"
            title="Pan Left (Backwards in time)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono text-cyan-400 text-center min-w-[50px]">
            {zoomLevel.toFixed(1)}x
          </span>

          <button
            onClick={handlePanRight}
            disabled={currentPan >= maxPan}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition"
            title="Pan Right (Forward in time)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
