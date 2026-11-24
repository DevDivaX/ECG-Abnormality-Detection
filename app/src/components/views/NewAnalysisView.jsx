import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowRight,
  Loader2,
  Activity,
  Layers,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { inspectCsvFile, getApiBaseUrl } from '../../utils/api';
import ECGWaveformViewer from '../ECGWaveformViewer';

export default function NewAnalysisView() {
  const {
    currentFile,
    previewSignal,
    selectedColumn,
    changeSelectedColumn,
    samplingRate,
    setSamplingRate,
    isAnalyzing,
    analysisError,
    setAnalysisError,
    handleFileSelect,
    runAnalysis,
    loadSampleFile,
    backendStatus,
    verifyBackend
  } = useAnalysis();

  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isRetryingBackend, setIsRetryingBackend] = useState(false);
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Process chosen file from file picker or drag-and-drop
  const processSelectedFile = (file) => {
    if (!file) return;
    setLocalError(null);
    setAnalysisError(null);

    const filename = file.name.toLowerCase();

    // Check file extension: strictly CSV only
    if (!filename.endsWith('.csv')) {
      const extMatch = filename.match(/\.([a-z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toUpperCase() : 'UNKNOWN';

      if (['PNG', 'JPG', 'JPEG', 'BMP', 'WEBP', 'GIF', 'TIFF'].includes(ext)) {
        setLocalError(
          'Unsupported file format: ECG image files (PNG/JPG) cannot be ingested by the 1D-CNN. ' +
          'The model requires discrete calibrated voltage amplitudes over time. Image plots lack exact calibrated ' +
          'millivolt amplitudes and discrete sampling intervals. Please provide numerical CSV time-series data.'
        );
      } else if (ext === 'PDF') {
        setLocalError(
          'Unsupported file format: PDF clinical reports are not supported as raw 1D-CNN model input. ' +
          'Please export or extract the raw discrete numerical time-series signal into CSV format.'
        );
      } else {
        setLocalError(
          `Unsupported file format (.${ext}). Only CSV files (.csv) are currently supported. ` +
          'Please convert or export your electrocardiogram data to standard CSV format.'
        );
      }
      return;
    }

    // Pass valid CSV file to context
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    handleFileSelect(null);
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRetryBackend = async () => {
    setIsRetryingBackend(true);
    try {
      await verifyBackend();
    } finally {
      setIsRetryingBackend(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Determine recording type and model compatibility
  const isTypeA = previewSignal?.recordingType === 'pre_segmented_187';
  const isTypeB = previewSignal?.recordingType === 'continuous_ecg';
  const isCompatible = previewSignal?.isCompatible === true;
  const hasValidationErrors = previewSignal?.validationErrors && previewSignal.validationErrors.length > 0;
  const isFileValid = previewSignal?.success === true && !hasValidationErrors;

  const currentApiUrl = backendStatus.url || getApiBaseUrl();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          New ECG Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload an electrocardiogram CSV file to extract cardiac cycles and execute 1D-CNN rhythm classification.
        </p>
      </div>

      {/* Backend Status Notification */}
      {!backendStatus.online ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">
                FastAPI Inference Backend is Unavailable
              </p>
              <p className="text-rose-300/90 text-xs">
                Backend unreachable at <code className="bg-rose-950/80 px-1.5 py-0.5 rounded font-mono text-rose-200">{currentApiUrl}</code>. Predictions cannot be executed until the FastAPI server is running.
              </p>
            </div>
          </div>
          <button
            onClick={handleRetryBackend}
            disabled={isRetryingBackend}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-medium transition disabled:opacity-50"
            title="Retry connecting to FastAPI backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetryingBackend ? 'animate-spin' : ''}`} />
            <span>{isRetryingBackend ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-emerald-200">FastAPI Backend Connected:</span>
            <code className="bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono text-emerald-300">{currentApiUrl}</code>
          </div>
          <span className="text-[11px] text-emerald-400/80 hidden sm:inline font-mono">
            1D-CNN Model Online • (batch, 187, 1)
          </span>
        </div>
      )}

      {/* Upload Zone / Drop Area */}
      {!currentFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
              : 'border-slate-700 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm sm:text-base font-semibold text-white">
                Drag and drop your ECG CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                or click to browse your local computer (.csv)
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-cyan-400 hover:text-white hover:bg-slate-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Browse Local Computer</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                Single 187-value heartbeat CSV
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                Pre-segmented MIT-BIH dataset
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                Continuous lead recordings (preview)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{currentFile.name}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {formatFileSize(currentFile.size)} • {previewSignal?.totalRows || 0} rows × {previewSignal?.totalCols || 0} columns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              >
                Change File
              </button>
              <button
                onClick={removeFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 transition"
                title="Remove uploaded file"
              >
                <X className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Validation & Structure Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Validation Status */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Validation Status</span>
              <div className="flex items-center gap-1.5">
                {isFileValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">Valid CSV Structure</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-300">Validation Issue</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {previewSignal?.missingCount || 0} missing • {previewSignal?.nonNumericCount || 0} non-numeric
              </p>
            </div>

            {/* 2. Detected ECG Recording Structure */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Recording Type</span>
              <div className="flex items-center gap-1.5">
                {isTypeA ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">Type A: Pre-segmented 187</span>
                  </>
                ) : isTypeB ? (
                  <>
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">Type B: Continuous ECG</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-300">Invalid Structure</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {isTypeA
                  ? 'Individual 187-value cardiac cycle.'
                  : isTypeB
                  ? 'Continuous multi-beat time-series.'
                  : 'Check column formatting.'}
              </p>
            </div>

            {/* 3. Dimensions & Columns Info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">Columns & Rows</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white font-mono">
                  {previewSignal?.totalRows || 0} rows × {previewSignal?.totalCols || 0} cols
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate" title={previewSignal?.headers?.join(', ')}>
                Headers: {previewSignal?.headers?.length ? previewSignal.headers.slice(0, 3).join(', ') + (previewSignal.headers.length > 3 ? '...' : '') : 'None'}
              </p>
            </div>

            {/* 4. Model Compatibility */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">1D-CNN Compatibility</span>
              <div className="flex items-center gap-1.5">
                {isCompatible ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Compatible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" /> Unsupported
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {isCompatible
                  ? 'Matches required (batch, 187, 1) tensor.'
                  : isTypeB
                  ? 'Continuous analysis unsupported.'
                  : 'Requires 187 numerical values.'}
              </p>
            </div>
          </div>

          {/* Lead / Signal Column Selection (if multi-column continuous file) */}
          {!isTypeA && previewSignal?.headers && previewSignal.headers.length > 1 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Select ECG Voltage / Lead Signal Column
                </label>
                <p className="text-[11px] text-slate-400">
                  Choose which column from the CSV contains the electrocardiogram voltage readings.
                </p>
              </div>

              <div className="w-full sm:w-auto min-w-[220px]">
                <select
                  value={selectedColumn}
                  onChange={(e) => changeSelectedColumn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                >
                  {previewSignal.headers.map((col, idx) => (
                    <option key={idx} value={col}>
                      {col} {idx === previewSignal.selectedColumnIndex ? '(Selected Signal)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Format Validation Error Alerts */}
      {(localError || analysisError || (previewSignal && hasValidationErrors)) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-semibold text-rose-200">CSV Validation & Compatibility Error</p>
            <p className="text-rose-300/90 text-xs leading-relaxed">
              {localError || analysisError || previewSignal?.error}
            </p>
            {previewSignal?.validationErrors && previewSignal.validationErrors.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/80 pt-1">
                {previewSignal.validationErrors.map((err, idx) => (
                  <li key={idx} className="font-mono">{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Expandable Section: Supported ECG CSV Format Guide */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setIsFormatGuideOpen(!isFormatGuideOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left text-slate-200 hover:text-white hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold tracking-wide">Supported ECG CSV Format Guide</span>
            <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Technical Specifications
            </span>
          </div>
          <div className="text-slate-400">
            {isFormatGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isFormatGuideOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Structure & Numerical Values */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  1. Supported CSV Structures & Numerical Values
                </h4>
                <ul className="space-y-1 text-slate-400 text-[11px] leading-relaxed list-disc list-inside">
                  <li><strong className="text-slate-200">Type A (Pre-segmented 187 - Model Compatible)</strong>: Exactly 187 comma-separated numerical values representing an isolated cardiac cycle. May be a single row or 187 lines of 1 value each.</li>
                  <li><strong className="text-slate-200">Type B (Continuous ECG - Waveform Preview Only)</strong>: Time-series recording with time and voltage channels (e.g., <code className="text-cyan-300">time,voltage</code>).</li>
                  <li><strong className="text-slate-200">Expected Values</strong>: Discrete voltage amplitudes (millivolts or min-max normalized between 0.0 and 1.0). Must not contain NaNs, infinities, or missing empty cells.</li>
                </ul>
              </div>

              {/* Heartbeats vs Continuous & Clinical Device Export */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  2. Pre-segmented Heartbeats vs. Continuous Recordings
                </h4>
                <ul className="space-y-1 text-slate-400 text-[11px] leading-relaxed list-disc list-inside">
                  <li><strong className="text-slate-200">1D-CNN Training Standard</strong>: The CNN was trained on the MIT-BIH Kaggle benchmark with individual heartbeats resampled to 125 Hz, centered on the QRS R-peak, and padded to exactly 187 values.</li>
                  <li><strong className="text-slate-200">Continuous ECG Status</strong>: Continuous multi-beat ECG analysis is currently unsupported for direct CNN prediction because a validated clinical QRS detection and windowing pipeline is required to avoid erroneous arrhythmia classification.</li>
                  <li><strong className="text-slate-200">What to Obtain from Device</strong>: Export raw discrete numerical CSV time-series data or segmented cardiac cycles. Note that PDF reports and JPG/PNG strip plots cannot be parsed by the 1D-CNN.</li>
                </ul>
              </div>
            </div>

            {/* Download Sample CSV Action */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">Download Verified Compatible Sample CSV</p>
                <p className="text-[11px] text-slate-400">
                  Obtain a genuine 187-value normal sinus heartbeat CSV file derived from the MIT-BIH Arrhythmia Database benchmark.
                </p>
              </div>
              <a
                href="/data/samples/sample_normal_187.csv"
                download="sample_normal_187.csv"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download sample_normal_187.csv</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Signal Preview Section (Waveform Viewer) */}
      {previewSignal && previewSignal.points && previewSignal.points.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              ECG Waveform Preview
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                Channel: {previewSignal.selectedColumn || 'ECG Signal'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {previewSignal.points.length} Samples
              </span>
              {previewSignal.stats && (
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Min: {previewSignal.stats.minVoltage.toFixed(3)} | Max: {previewSignal.stats.maxVoltage.toFixed(3)}
                </span>
              )}
            </div>
          </div>

          <ECGWaveformViewer
            points={previewSignal.points}
            title={currentFile ? `Preview: ${currentFile.name}` : 'ECG Signal Preview'}
            sampleRate={samplingRate || 125}
            detectedBeats={previewSignal.detectedBeats || 1}
          />
        </div>
      )}

      {/* Action Bar: Compatibility Check & Prominent Analyse Button */}
      {currentFile && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Model Compatibility Status:
                </span>
                {isCompatible ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Compatible (Ready for 1D-CNN Inference)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isTypeB ? 'Continuous ECG (Analysis Unsupported)' : 'Incompatible Format'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {isCompatible
                  ? 'Input file contains a verified 187-value cardiac heartbeat vector matching tensor input shape (batch_size, 187, 1).'
                  : isTypeB
                  ? 'Continuous ECG analysis is currently unsupported because the trained 1D-CNN model requires pre-segmented 187-sample cardiac cycles. To prevent inaccurate predictions from unsegmented continuous data, the analysis button is disabled.'
                  : (previewSignal?.error || 'Uploaded file format is invalid or contains non-numeric values. Please upload a valid CSV.')}
              </p>
            </div>

            <button
              onClick={runAnalysis}
              disabled={!isCompatible || isAnalyzing || !backendStatus.online}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition shadow-xl active:scale-95 ${
                isCompatible && backendStatus.online && !isAnalyzing
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-900/30 hover:brightness-110 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Executing 1D-CNN Inference...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Analyse ECG with 1D-CNN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {!backendStatus.online && (
            <p className="text-[11px] text-rose-400 font-medium">
              * Note: The analysis button is currently disabled because the FastAPI backend server is offline.
            </p>
          )}
          {isTypeB && (
            <p className="text-[11px] text-amber-400 font-medium">
              * Note: Continuous ECG analysis is unsupported. Please upload a pre-segmented 187-sample heartbeat CSV (Type A) to execute model inference.
            </p>
          )}
        </div>
      )}

      {/* Quick Test Samples Card */}
      {!currentFile && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verified Benchmark Sample Recordings
            </h3>
            <span className="text-[11px] text-slate-400">Click to load and test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sample 1: sample_normal_187.csv (Verified & Functional) */}
            <button
              type="button"
              onClick={() => loadSampleFile('normal_187')}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition group space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  sample_normal_187.csv
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Ready for Analysis
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Single pre-segmented normal sinus heartbeat (187 numerical values) from the MIT-BIH Kaggle benchmark. Fully compatible with 1D-CNN.
              </p>
            </button>

            {/* Sample 2: sample_continuous_lead2.csv (Synthetic Continuous - Waveform Preview Only) */}
            <button
              type="button"
              onClick={() => loadSampleFile('continuous_lead2')}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition group space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  sample_continuous_lead2.csv
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                  Preview Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Synthetic continuous Lead II recording (625 samples). Demonstrates waveform preview and channel selection; analysis is disabled because continuous segmentation is unsupported.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
