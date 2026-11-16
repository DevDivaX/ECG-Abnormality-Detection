import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkBackendHealth, uploadAndPredictCsv, predictSignal, getApiBaseUrl } from '../utils/api';
import { parseECGForPreview, extract187SignalValues } from '../utils/ecgParser';

const AnalysisContext = createContext(null);

const STORAGE_KEY = 'cardiotrace_history_v1';

export function AnalysisProvider({ children }) {
  const [activeNav, setActiveNav] = useState('new-analysis');
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, url: getApiBaseUrl() });
  const [notification, setNotification] = useState(null);
  const [paperGridMode, setPaperGridMode] = useState(false);

  // Active File & Signal
  const [currentFile, setCurrentFile] = useState(null); // { file, name, size, rawText }
  const [previewSignal, setPreviewSignal] = useState(null); // output of parseECGForPreview
  const [selectedColumn, setSelectedColumn] = useState('');
  const [samplingRate, setSamplingRate] = useState(125);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Active Model Output
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);

  // Local Storage History
  const [historyList, setHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Sync history to localStorage
  const saveToHistory = useCallback((resultData, fileMeta) => {
    try {
      const newEntry = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        filename: fileMeta?.name || 'ecg_signal.csv',
        fileSize: fileMeta?.size || 0,
        mode: resultData.mode || 'single_heartbeat',
        totalHeartbeats: resultData.total_heartbeats || 1,
        dominantRhythm: resultData.dominant_rhythm || resultData.predicted_class_name || 'Normal',
        confidence: resultData.confidence || 0,
        result: resultData,
        previewPoints: fileMeta?.previewPoints || null
      };

      setHistoryList((prev) => {
        const updated = [newEntry, ...prev.slice(0, 49)]; // keep max 50 entries
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage limit reached for history:', e);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  }, []);

  const deleteHistoryItem = useCallback((id) => {
    setHistoryList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    showNotification('History entry removed.');
  }, [showNotification]);

  const clearAllHistory = useCallback(() => {
    setHistoryList([]);
    localStorage.removeItem(STORAGE_KEY);
    showNotification('All history records cleared.');
  }, [showNotification]);

  // Periodic Backend Health Check
  const verifyBackend = useCallback(async () => {
    const res = await checkBackendHealth();
    setBackendStatus({ ...res, checking: false });
  }, []);

  useEffect(() => {
    verifyBackend();
    const interval = setInterval(verifyBackend, 10000);
    return () => clearInterval(interval);
  }, [verifyBackend]);

  // Handle file selection and parsing
  const handleFileSelect = useCallback((file, rawContentText = null) => {
    setAnalysisError(null);
    setAnalysisResult(null);

    if (!file) {
      setCurrentFile(null);
      setPreviewSignal(null);
      setSelectedColumn('');
      return;
    }

    const processContent = (content) => {
      setCurrentFile({
        file,
        name: file.name,
        size: file.size,
        rawText: content
      });

      const parsed = parseECGForPreview(content, file.name, null, 125);
      if (parsed.success) {
        setPreviewSignal(parsed);
        if (parsed.selectedColumn) {
          setSelectedColumn(parsed.selectedColumn);
        }
      } else {
        setPreviewSignal(parsed.points && parsed.points.length > 0 ? parsed : null);
        setAnalysisError(parsed.error);
      }
    };

    if (rawContentText !== null && rawContentText !== undefined) {
      processContent(rawContentText);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => processContent(e.target.result);
      reader.onerror = () => setAnalysisError('Failed to read file from disk.');
      reader.readAsText(file);
    }
  }, []);

  // Column re-selection
  const changeSelectedColumn = useCallback((newCol) => {
    setSelectedColumn(newCol);
    if (currentFile && currentFile.rawText) {
      const parsed = parseECGForPreview(currentFile.rawText, currentFile.name, newCol, samplingRate);
      if (parsed.success) {
        setPreviewSignal(parsed);
        setAnalysisError(null);
      } else {
        setPreviewSignal(parsed.points && parsed.points.length > 0 ? parsed : null);
        setAnalysisError(parsed.error);
      }
    }
  }, [currentFile, samplingRate]);

  // Load a sample file for testing
  const loadSampleFile = useCallback(async (sampleName) => {
    try {
      let url = '';
      let filename = '';
      if (sampleName === 'normal_187') {
        url = '/data/samples/sample_normal_187.csv';
        filename = 'sample_normal_187.csv';
      } else if (sampleName === 'continuous_lead2') {
        url = '/data/samples/sample_continuous_lead2.csv';
        filename = 'sample_continuous_lead2.csv';
      }

      let res = await fetch(url);
      if (!res.ok) {
        res = await fetch(`../${url}`);
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch sample: HTTP ${res.status}`);
      }

      const text = await res.text();
      const mockFile = new File([text], filename, {
        type: 'text/csv'
      });

      handleFileSelect(mockFile, text);
      showNotification(`Loaded sample: ${filename}`, 'info');
      setActiveNav('new-analysis');
    } catch (err) {
      showNotification(`Could not load sample directly: ${err.message}`, 'error');
    }
  }, [handleFileSelect, showNotification]);

  // Run Real CNN Analysis
  const runAnalysis = useCallback(async () => {
    if (!currentFile || !currentFile.file) {
      setAnalysisError('No valid ECG file selected. Please choose or drop a CSV file.');
      return;
    }

    if (!backendStatus.online) {
      setAnalysisError(`FastAPI inference backend is currently unavailable (${backendStatus.url || 'http://localhost:8000'}). Please start the backend server.`);
      return;
    }

    // Check compatibility: only pre-segmented 187 heartbeats are supported for CNN inference
    if (previewSignal && previewSignal.isCompatible === false) {
      setAnalysisError(
        previewSignal.compatibilityReason ||
        'Continuous ECG recordings cannot be analyzed directly. The 1D-CNN model requires pre-segmented 187-value cardiac cycles.'
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const exact187 = extract187SignalValues(currentFile.rawText);

      if (!exact187 || exact187.length !== 187) {
        throw new Error(
          `Analysis aborted: The selected file does not contain a compatible 187-value heartbeat vector (found ${exact187 ? exact187.length : 0} values). The 1D-CNN input tensor requires shape (1, 187, 1).`
        );
      }

      // Submit exactly 187 numeric floats to FastAPI POST /predict
      const jsonResult = await predictSignal(exact187);

      const responseData = {
        mode: 'single_heartbeat',
        message: 'Successfully analyzed single 187-sample heartbeat via 1D-CNN.',
        total_heartbeats: 1,
        dominant_rhythm: jsonResult.predicted_class_name,
        confidence: jsonResult.confidence,
        class_summary: {
          [jsonResult.predicted_class_name]: 1
        },
        heartbeats: [
          {
            beat_index: 1,
            ...jsonResult,
            signal_points: exact187.map((v, i) => ({
              time: parseFloat((i / 125.0).toFixed(3)),
              voltage: parseFloat(v.toFixed(4))
            }))
          }
        ],
        ...jsonResult
      };

      setAnalysisResult(responseData);
      setSelectedBeatIndex(0);

      // Save to local history
      saveToHistory(responseData, {
        name: currentFile.name,
        size: currentFile.size,
        previewPoints: previewSignal?.points?.slice(0, 187) || null
      });

      showNotification('1D-CNN inference completed successfully!', 'success');
      setActiveNav('results');
    } catch (err) {
      setAnalysisError(err.message || 'An unexpected error occurred during model inference.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentFile, backendStatus, previewSignal, saveToHistory, showNotification]);

  // Load an existing record from history
  const loadFromHistory = useCallback((historyEntry) => {
    if (!historyEntry || !historyEntry.result) return;
    setAnalysisResult(historyEntry.result);
    setSelectedBeatIndex(0);
    setCurrentFile({
      file: null,
      name: historyEntry.filename,
      size: historyEntry.fileSize,
      rawText: ''
    });
    if (historyEntry.previewPoints) {
      setPreviewSignal({
        success: true,
        isCompatible: true,
        recordingType: 'pre_segmented_187',
        points: historyEntry.previewPoints,
        totalSamples: historyEntry.previewPoints.length,
        durationSeconds: parseFloat((historyEntry.previewPoints.length / 125.0).toFixed(2)),
        sampleRate: 125,
        detectedBeats: historyEntry.totalHeartbeats || 1,
        stats: {
          minVoltage: 0.0,
          maxVoltage: 1.0,
          sampleCount: historyEntry.previewPoints.length,
          sampleRate: 125,
          durationSeconds: parseFloat((historyEntry.previewPoints.length / 125.0).toFixed(2))
        }
      });
    }
    setActiveNav('results');
    showNotification(`Loaded historical analysis: ${historyEntry.filename}`);
  }, [showNotification]);

  return (
    <AnalysisContext.Provider
      value={{
        activeNav,
        setActiveNav,
        backendStatus,
        verifyBackend,
        notification,
        showNotification,
        paperGridMode,
        setPaperGridMode,
        currentFile,
        previewSignal,
        selectedColumn,
        setSelectedColumn,
        changeSelectedColumn,
        samplingRate,
        setSamplingRate,
        isAnalyzing,
        analysisError,
        setAnalysisError,
        analysisResult,
        selectedBeatIndex,
        setSelectedBeatIndex,
        historyList,
        runAnalysis,
        handleFileSelect,
        loadSampleFile,
        loadFromHistory,
        deleteHistoryItem,
        clearAllHistory
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
