/**
 * API Service for communicating with the FastAPI ECG 1D-CNN Backend.
 * Handles dynamic environment detection (including GitHub Codespaces port forwarding),
 * health checks, format inspection, and 1D-CNN inference requests.
 */

/**
 * Dynamically resolves the API base URL.
 * Supports:
 * 1. User-configured VITE_API_URL environment variable.
 * 2. GitHub Codespaces forwarded port environment (*.app.github.dev or *.github.dev).
 * 3. Localhost development environments.
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  // Browser environment checks
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;

    // Detect GitHub Codespaces web preview URL pattern
    const isCodespace = hostname.endsWith('.app.github.dev') || hostname.endsWith('.github.dev');
    if (isCodespace) {
      // If user explicitly configured a remote URL that is NOT localhost, respect it
      if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/+$/, '');
      }

      // Auto-translate forwarded port in Codespace hostname: e.g. <name>-3000.app.github.dev -> <name>-8000.app.github.dev
      const portRegex = /-([0-9]+)\.(app\.github\.dev|github\.dev)$/;
      const match = hostname.match(portRegex);
      if (match) {
        const backendHost = hostname.replace(`-${match[1]}.`, '-8000.');
        return `${protocol}//${backendHost}`;
      }
    }

    // Standard environment with configured VITE_API_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.replace(/\/+$/, '');
    }

    // Default to port 8000 on the same host
    if (hostname) {
      const port = '8000';
      return `${protocol}//${hostname}:${port}`;
    }
  }

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
}

/**
 * Checks if the FastAPI backend is running and model is loaded.
 */
export async function checkBackendHealth() {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      online: true,
      data,
      url: baseUrl
    };
  } catch (err) {
    return {
      online: false,
      error: err.name === 'AbortError'
        ? `Connection to backend at ${baseUrl} timed out.`
        : `Backend unreachable at ${baseUrl}. Ensure FastAPI is running on port 8000.`,
      url: baseUrl
    };
  }
}

/**
 * Predicts the class for a single 187-value heartbeat array via POST /predict.
 * @param {number[]} signal - Exactly 187 numerical values
 */
export async function predictSignal(signal) {
  if (!Array.isArray(signal) || signal.length !== 187) {
    throw new Error(`Input validation failed: Expected exactly 187 numerical values, received ${signal?.length || 0}.`);
  }

  // Validate no NaNs or Infs
  for (let i = 0; i < signal.length; i++) {
    const val = signal[i];
    if (typeof val !== 'number' || !isFinite(val)) {
      throw new Error(`Invalid numerical value at sample index ${i}: "${val}". NaN and Infinity are not accepted.`);
    }
  }

  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signal })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || `Server error (HTTP ${res.status})`);
    }

    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error(`Backend unavailable at ${baseUrl}. Please check that FastAPI server is running on port 8000.`);
    }
    throw err;
  }
}

/**
 * Uploads a CSV file to POST /predict/csv for automatic format detection and batch analysis.
 * @param {File} file
 * @param {Object} options - { column, samplingRate }
 */
export async function uploadAndPredictCsv(file, options = {}) {
  const filename = (file.name || '').toLowerCase();

  // Unsupported format pre-check with clear clinical feedback
  if (/\.(png|jpe?g|bmp|webp|gif|tiff)$/i.test(filename)) {
    throw new Error(
      'Unsupported file format: ECG images (PNG/JPG) cannot be ingested by the 1D-CNN. ' +
      'The model requires discrete calibrated voltage amplitudes over time. Please provide numerical CSV data.'
    );
  }
  if (/\.pdf$/i.test(filename)) {
    throw new Error(
      'Unsupported file format: PDF clinical reports are not supported as raw 1D-CNN signal input. ' +
      'Please export or extract the raw numerical CSV time-series recordings.'
    );
  }

  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  if (options.column) {
    formData.append('column', options.column);
  }
  if (options.samplingRate) {
    formData.append('sampling_rate', String(options.samplingRate));
  }

  try {
    const res = await fetch(`${baseUrl}/predict/csv`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || `Server error (HTTP ${res.status})`);
    }

    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error(`Backend unavailable at ${baseUrl}. Please check that FastAPI server is running on port 8000.`);
    }
    throw err;
  }
}

/**
 * Inspects uploaded CSV columns and row counts before processing via POST /inspect/csv.
 * @param {File} file
 */
export async function inspectCsvFile(file) {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${baseUrl}/inspect/csv`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || `Server error (HTTP ${res.status})`);
    }

    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error(`Backend unavailable at ${baseUrl}. Ensure FastAPI is active.`);
    }
    throw err;
  }
}
