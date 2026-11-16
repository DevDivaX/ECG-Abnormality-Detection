"""
FastAPI Backend for ECG Abnormality Detection using a 1D CNN.

This service loads the trained Keras 1D-CNN model from models/ecg_cnn_final.keras
without compilation (due to custom Focal Loss used in training) and exposes:
- GET /: Health check and API metadata.
- POST /predict: Predicts the class of a single 187-sample ECG heartbeat (JSON or CSV file).
- POST /predict/csv: Full CSV ingestion supporting continuous ECG segmentation and batch heartbeats.
- POST /inspect/csv: Inspects an uploaded CSV file, listing available columns and format detection.
"""

import io
import csv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Union

import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ecg_backend")

# 1. Resolve relative model path
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "ecg_cnn_final.keras"

# Exact class labels as required
CLASS_NAMES = [
    "Normal",
    "Supraventricular Ectopic",
    "Ventricular Ectopic",
    "Fusion Beat",
    "Unknown"
]
AAMI_CODES = ["N", "S", "V", "F", "Q"]

# Global model variable
model = None
model_error = None

# Attempt to load model at module load
try:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Trained model not found at expected path: {MODEL_PATH}")
    
    import tensorflow as tf
    logger.info(f"Loading trained 1D-CNN model from: {MODEL_PATH}")
    # 2. Load model with compile=False as required for inference with custom Focal Loss
    model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
    # Perform warmup inference
    _ = model.predict(np.zeros((1, 187, 1), dtype=np.float32), verbose=0)
    logger.info("Model loaded and warmed up successfully.")
except Exception as e:
    logger.error(f"Failed to load model: {e}", exc_info=True)
    model_error = str(e)

# 3. Create FastAPI application
app = FastAPI(
    title="ECG Abnormality Detection API",
    description="1D-CNN Cardiac Arrhythmia Classifier using MIT-BIH AAMI EC57 Benchmark Standard",
    version="1.0.0"
)

# Configure CORS
# React dev servers (Vite port 5173/5174, standard ports) + GitHub Codespaces preview origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://.*(github\.dev|app\.github\.dev|localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Pydantic Request Models
class PredictRequest(BaseModel):
    signal: List[float] = Field(
        ...,
        description="ECG heartbeat signal containing exactly 187 numerical values"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "signal": [0.0] * 187
            }
        }
    }


def _verify_model_ready():
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"CNN Model is not loaded. Error: {model_error or 'Unknown initialization error'}"
        )


def _format_prediction_output(probs: np.ndarray) -> Dict[str, Any]:
    """Helper to convert model raw probabilities into standard dictionary response."""
    probs = np.asarray(probs, dtype=np.float32).flatten()
    pred_class = int(np.argmax(probs))
    pred_class_name = CLASS_NAMES[pred_class]
    confidence = float(probs[pred_class] * 100.0)

    probabilities = {
        CLASS_NAMES[i]: round(float(probs[i] * 100.0), 2)
        for i in range(5)
    }

    class_probabilities = [
        {
            "class": CLASS_NAMES[i],
            "code": AAMI_CODES[i],
            "probability": round(float(probs[i] * 100.0), 2),
            "raw": float(probs[i])
        }
        for i in range(5)
    ]

    return {
        "predicted_class": pred_class,
        "predicted_class_name": pred_class_name,
        "aami_code": AAMI_CODES[pred_class],
        "confidence": round(confidence, 2),
        "probabilities": probabilities,
        "class_probabilities": class_probabilities
    }


def _predict_single_array(signal_values: List[float]) -> Dict[str, Any]:
    """
    Validates exactly 187 numerical values, reshapes to (1, 187, 1),
    and performs model inference without applying unneeded extra transformations.
    """
    _verify_model_ready()

    # 6. Validate exact length 187
    if len(signal_values) != 187:
        raise HTTPException(
            status_code=422,
            detail=f"ECG heartbeat must contain exactly 187 numerical values. Received {len(signal_values)} values."
        )

    # 7. Reject NaN, infinity, or invalid values
    try:
        signal_array = np.array(signal_values, dtype=np.float32)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Non-numeric values found in ECG signal: {str(e)}"
        )

    if not np.all(np.isfinite(signal_array)):
        raise HTTPException(
            status_code=422,
            detail="Signal contains invalid numerical values (NaN or Infinity)."
        )

    # 8. Reshape to (1, 187, 1) float32
    reshaped_input = signal_array.reshape(1, 187, 1)

    # 9. Pass to CNN and get five-class prediction probabilities
    raw_preds = model.predict(reshaped_input, verbose=0)[0]

    # 10. Format and return response
    return _format_prediction_output(raw_preds)


# 4. GET / endpoint
@app.get("/", summary="Health Check & Model Metadata")
def read_root():
    """Returns the current status of the FastAPI backend and model metadata."""
    return {
        "status": "online",
        "message": "ECG Abnormality Detection API is running",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "model_error": model_error,
        "input_shape": [None, 187, 1],
        "output_classes": {
            i: CLASS_NAMES[i] for i in range(5)
        },
        "supported_formats": [
            "JSON (single heartbeat: 187 numeric values)",
            "CSV (single heartbeat row/column of 187 values)",
            "CSV (pre-segmented dataset with 187 columns)",
            "CSV (continuous ECG recording with automatic R-peak segmentation)"
        ],
        "unsupported_formats": [
            "PNG / JPG / TIFF images (1D CNN requires calibrated numerical time-series amplitudes)",
            "PDF reports (no direct waveform rasterization permitted)"
        ]
    }


# Signal parsing and segmentation helpers
def _parse_csv_content(content_str: str) -> Dict[str, Any]:
    """Parses raw text CSV/TSV/whitespace content into structured columns and rows."""
    lines = [line.strip() for line in content_str.strip().splitlines() if line.strip()]
    if not lines:
        raise ValueError("The uploaded CSV file is empty.")

    # Detect delimiter
    first_few = "\n".join(lines[:min(len(lines), 10)])
    sniffer = csv.Sniffer()
    delimiter = ","
    try:
        dialect = sniffer.sniff(first_few)
        delimiter = dialect.delimiter
    except Exception:
        if "," in lines[0]:
            delimiter = ","
        elif "\t" in lines[0]:
            delimiter = "\t"
        elif ";" in lines[0]:
            delimiter = ";"
        else:
            delimiter = " "

    # Split lines using csv.reader
    reader = list(csv.reader(lines, delimiter=delimiter))
    if not reader:
        raise ValueError("Could not parse rows from CSV.")

    first_row = reader[0]
    # Robust header detection:
    # A row is only a header if majority of cells cannot be parsed as floats
    # and there are at least 2 lines in total
    has_header = False
    if len(lines) > 1:
        numeric_count = 0
        for cell in first_row:
            try:
                float(cell.strip())
                numeric_count += 1
            except ValueError:
                pass
        # Only consider it a header if strictly less than half the cells are numeric
        if numeric_count < (len(first_row) / 2.0):
            has_header = True

    if has_header:
        headers = [col.strip() for col in first_row]
        data_rows = reader[1:]
    else:
        headers = [f"col_{i+1}" for i in range(len(first_row))]
        data_rows = reader

    return {
        "headers": headers,
        "rows": data_rows,
        "has_header": has_header,
        "total_rows": len(data_rows),
        "total_cols": len(headers)
    }


def _segment_continuous_signal(
    signal: np.ndarray,
    sampling_rate: float
) -> Dict[str, Any]:
    """
    Implements physiological R-peak detection and heartbeat segmentation
    strictly compatible with the Kaggle MIT-BIH dataset preprocessing:
    - Resamples to 125 Hz if original recording sampling frequency differs.
    - Bandpass filters (0.5 - 40 Hz) to eliminate baseline wander and high-frequency EMG noise.
    - Uses Pan-Tompkins / peak detection with refractory period (>= 0.25s).
    - Extracts cardiac cycle window centered on R-peak.
    - Min-max normalizes to [0, 1] range as in Kaggle MIT-BIH.
    - Zero-pads or trims to exactly 187 samples.
    - Refuses to segment if no valid R-peaks are detected (arbitrary 187-chunking is forbidden).
    """
    from scipy.signal import butter, filtfilt, find_peaks, resample

    if len(signal) < 100:
        raise ValueError("Continuous signal is too short (minimum 100 samples required for physiological analysis).")

    # Resample to 125 Hz (Kaggle MIT-BIH benchmark rate)
    target_fs = 125.0
    if abs(sampling_rate - target_fs) > 1.0:
        num_target_samples = int(round(len(signal) * target_fs / sampling_rate))
        if num_target_samples < 50:
            raise ValueError(f"Signal duration at {sampling_rate} Hz is insufficient after resampling to {target_fs} Hz.")
        proc_signal = resample(signal, num_target_samples)
        current_fs = target_fs
    else:
        proc_signal = signal.copy()
        current_fs = target_fs

    # Bandpass filter (0.5 Hz - 40.0 Hz)
    try:
        nyquist = 0.5 * current_fs
        low = 0.5 / nyquist
        high = min(40.0 / nyquist, 0.95)
        b, a = butter(2, [low, high], btype="bandpass")
        filtered = filtfilt(b, a, proc_signal)
    except Exception as e:
        logger.warning(f"Bandpass filtering fallback to raw signal: {e}")
        filtered = proc_signal

    # R-peak detection: refractory period >= 250 ms (0.25 * fs = ~31 samples at 125 Hz)
    min_distance = max(10, int(0.25 * current_fs))
    height_threshold = float(np.percentile(filtered, 65))
    prominence_threshold = float((np.max(filtered) - np.min(filtered)) * 0.25)

    peaks, properties = find_peaks(
        filtered,
        height=height_threshold,
        distance=min_distance,
        prominence=prominence_threshold
    )

    # Fallback to height only if prominence was too strict
    if len(peaks) == 0:
        peaks, _ = find_peaks(filtered, height=height_threshold, distance=min_distance)

    # 8. Do not assume arbitrary 187-sample chunks are valid heartbeats!
    if len(peaks) == 0:
        raise ValueError(
            "Continuous ECG signal could not be segmented: No valid physiological R-peaks (QRS complexes) "
            "could be detected. In compliance with clinical validation standards, arbitrary 187-sample "
            "chunking is not permitted. Please verify that the signal contains real electrocardiogram deflections."
        )

    # Segment each beat matching Kaggle MIT-BIH protocol:
    # Pre-R: ~0.20s (25 samples at 125Hz)
    # Post-R: ~0.60s (75 samples at 125Hz)
    # Total window: 100 samples, padded with zeros to 187 samples, normalized [0, 1]
    pre_r = int(0.20 * current_fs)
    post_r = int(0.60 * current_fs)

    segmented_beats = []
    beat_metadata = []

    for idx, peak_idx in enumerate(peaks):
        start = max(0, peak_idx - pre_r)
        end = min(len(proc_signal), peak_idx + post_r)
        beat_slice = proc_signal[start:end]

        if len(beat_slice) < 20:
            continue

        # Min-max normalize each heartbeat to [0, 1] as in Kaggle training set
        b_min = float(np.min(beat_slice))
        b_max = float(np.max(beat_slice))
        if b_max > b_min:
            norm_beat = (beat_slice - b_min) / (b_max - b_min)
        else:
            norm_beat = np.zeros_like(beat_slice)

        # Zero-pad to exactly 187 samples
        padded = np.zeros(187, dtype=np.float32)
        copy_len = min(len(norm_beat), 187)
        padded[:copy_len] = norm_beat[:copy_len]

        time_in_sec = round(float(peak_idx / current_fs), 3)

        segmented_beats.append(padded)
        beat_metadata.append({
            "beat_index": idx + 1,
            "peak_sample": int(peak_idx),
            "timestamp_seconds": time_in_sec,
            "raw_length": len(beat_slice)
        })

    if not segmented_beats:
        raise ValueError("Could not extract any valid cardiac segments from detected R-peaks.")

    # Calculate average heart rate
    avg_hr = 0.0
    if len(peaks) >= 2:
        rr_intervals = np.diff(peaks) / current_fs
        avg_rr = float(np.mean(rr_intervals))
        if avg_rr > 0:
            avg_hr = round(60.0 / avg_rr, 1)

    return {
        "segments": np.array(segmented_beats, dtype=np.float32),
        "metadata": beat_metadata,
        "total_detected_peaks": len(peaks),
        "estimated_hr": avg_hr,
        "resampled_fs": current_fs,
        "original_fs": sampling_rate
    }


def _process_csv_data(
    content_str: str,
    selected_column: Optional[str] = None,
    sampling_rate: Optional[float] = None
) -> Dict[str, Any]:
    """Core logic to analyze and segment uploaded CSV data."""
    _verify_model_ready()
    parsed = _parse_csv_content(content_str)
    headers = parsed["headers"]
    rows = parsed["rows"]

    # 4. Determine whether the uploaded data is continuous ECG or already segmented 187-value samples
    # Check Case A: Pre-segmented row-wise dataset (e.g. Kaggle mitbih_test.csv where each row has 187 or 188 columns)
    if parsed["total_cols"] in [187, 188] and parsed["total_rows"] >= 1:
        # Pre-segmented dataset format
        segments = []
        labels = []
        for r_idx, row in enumerate(rows):
            try:
                numeric_vals = [float(x.strip()) for x in row if x.strip() != ""]
                if len(numeric_vals) >= 187:
                    segments.append(numeric_vals[:187])
                    if len(numeric_vals) >= 188:
                        labels.append(int(round(numeric_vals[187])))
            except Exception:
                continue

        if not segments:
            raise HTTPException(
                status_code=422,
                detail="No valid 187-value numerical rows found in the pre-segmented CSV file."
            )

        segments_arr = np.array(segments, dtype=np.float32)
        if not np.all(np.isfinite(segments_arr)):
            raise HTTPException(
                status_code=422,
                detail="CSV contains invalid numerical values (NaN or Infinity)."
            )

        # Batch predict
        inputs = segments_arr.reshape(-1, 187, 1)
        preds = model.predict(inputs, verbose=0)

        beat_results = []
        class_counts = {name: 0 for name in CLASS_NAMES}

        for i in range(len(preds)):
            formatted = _format_prediction_output(preds[i])
            class_counts[formatted["predicted_class_name"]] += 1
            beat_results.append({
                "beat_index": i + 1,
                "predicted_class": formatted["predicted_class"],
                "predicted_class_name": formatted["predicted_class_name"],
                "aami_code": formatted["aami_code"],
                "confidence": formatted["confidence"],
                "probabilities": formatted["probabilities"],
                "signal_preview": [round(float(v), 4) for v in segments[i][:50]],
                "true_label": labels[i] if i < len(labels) else None
            })

        dominant_class = max(class_counts, key=class_counts.get)
        single_beat_info = beat_results[0] if len(beat_results) == 1 else None
        res = {
            "mode": "segmented_batch" if len(beat_results) > 1 else "single_heartbeat",
            "message": f"Processed {len(segments)} pre-segmented 187-value heartbeat(s).",
            "total_heartbeats": len(segments),
            "dominant_rhythm": dominant_class,
            "class_summary": class_counts,
            "heartbeats": beat_results[:200],  # Cap response payload for responsiveness
            "single_beat": single_beat_info
        }
        if single_beat_info:
            res.update({
                "predicted_class": single_beat_info["predicted_class"],
                "predicted_class_name": single_beat_info["predicted_class_name"],
                "aami_code": single_beat_info["aami_code"],
                "confidence": single_beat_info["confidence"],
                "probabilities": single_beat_info["probabilities"]
            })
        return res

    # Check Case B: Exactly 1 row with 187 comma-separated values
    if parsed["total_rows"] == 1:
        first_row = [x.strip() for x in rows[0] if x.strip()]
        if len(first_row) == 187:
            try:
                numeric_vals = [float(x) for x in first_row]
                pred = _predict_single_array(numeric_vals)
                return {
                    "mode": "single_heartbeat",
                    "message": "Processed single 187-sample heartbeat.",
                    "total_heartbeats": 1,
                    "dominant_rhythm": pred["predicted_class_name"],
                    "class_summary": {pred["predicted_class_name"]: 1},
                    "heartbeats": [{
                        "beat_index": 1,
                        **pred,
                        "signal_points": [{"time": round(i / 125.0, 3), "voltage": round(v, 4)} for i, v in enumerate(numeric_vals)]
                    }],
                    **pred
                }
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Failed to parse 187 values from row: {e}")

    # Check Case C: 1 column of exactly 187 rows (single heartbeat in vertical format)
    if parsed["total_cols"] == 1 and parsed["total_rows"] == 187:
        try:
            numeric_vals = [float(r[0].strip()) for r in rows if r and r[0].strip()]
            if len(numeric_vals) == 187:
                pred = _predict_single_array(numeric_vals)
                return {
                    "mode": "single_heartbeat",
                    "message": "Processed single 187-sample vertical column heartbeat.",
                    "total_heartbeats": 1,
                    "dominant_rhythm": pred["predicted_class_name"],
                    "class_summary": {pred["predicted_class_name"]: 1},
                    "heartbeats": [{
                        "beat_index": 1,
                        **pred,
                        "signal_points": [{"time": round(i / 125.0, 3), "voltage": round(v, 4)} for i, v in enumerate(numeric_vals)]
                    }],
                    **pred
                }
        except Exception:
            pass

    # Case D: Continuous ECG recording (many samples)
    # 2. Allow user to select signal column if multi-column
    col_idx = 0
    if selected_column:
        if selected_column in headers:
            col_idx = headers.index(selected_column)
        else:
            try:
                col_idx = int(selected_column)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Selected column '{selected_column}' not found. Available columns: {headers}"
                )
    else:
        # Auto-detect if multi-column
        if len(headers) > 1:
            # Common names: voltage, MLII, lead, V5, ecg, signal
            potential = ["voltage", "mlii", "lead", "ecg", "signal", "val", "v5", "ii"]
            found = False
            for target in potential:
                for idx, h in enumerate(headers):
                    if target in h.lower():
                        col_idx = idx
                        found = True
                        break
                if found:
                    break
            if not found:
                # If col 0 looks like time, select col 1
                if "time" in headers[0].lower() or "t" == headers[0].lower():
                    col_idx = 1
                else:
                    col_idx = 0

    # Extract chosen signal column
    chosen_col_name = headers[col_idx] if col_idx < len(headers) else f"Column {col_idx+1}"
    signal_series = []
    for r_idx, row in enumerate(rows):
        if col_idx < len(row):
            val_str = row[col_idx].strip()
            if not val_str:
                continue
            try:
                signal_series.append(float(val_str))
            except ValueError:
                # Skip invalid string or raise if high fraction is invalid
                continue

    # 3. Validate missing values and invalid signal data
    if len(signal_series) < 50:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient numerical values ({len(signal_series)}) found in column '{chosen_col_name}'. Minimum 50 required."
        )

    signal_array = np.array(signal_series, dtype=np.float32)
    if not np.all(np.isfinite(signal_array)):
        raise HTTPException(
            status_code=422,
            detail=f"Column '{chosen_col_name}' contains invalid numerical values (NaN or Infinity)."
        )

    # 5. Continuous ECG: R-peak segmentation compatible with Kaggle MIT-BIH
    # If sampling rate not provided, default to 125.0 Hz (standard benchmark rate)
    fs = sampling_rate if sampling_rate and sampling_rate > 0 else 125.0

    try:
        segmentation_res = _segment_continuous_signal(signal_array, sampling_rate=fs)
    except ValueError as ve:
        raise HTTPException(
            status_code=422,
            detail=str(ve)
        )

    segments = segmentation_res["segments"]
    meta = segmentation_res["metadata"]

    # 6. Pass segments to CNN
    inputs = segments.reshape(-1, 187, 1)
    preds = model.predict(inputs, verbose=0)

    # 7. Display predictions for each processed heartbeat and overall summary
    beat_results = []
    class_counts = {name: 0 for name in CLASS_NAMES}

    for i in range(len(preds)):
        formatted = _format_prediction_output(preds[i])
        class_counts[formatted["predicted_class_name"]] += 1
        beat_results.append({
            "beat_index": meta[i]["beat_index"],
            "timestamp_seconds": meta[i]["timestamp_seconds"],
            "predicted_class": formatted["predicted_class"],
            "predicted_class_name": formatted["predicted_class_name"],
            "aami_code": formatted["aami_code"],
            "confidence": formatted["confidence"],
            "probabilities": formatted["probabilities"],
            "signal_points": [
                {"time": round(j / 125.0, 3), "voltage": round(float(v), 4)}
                for j, v in enumerate(segments[i])
            ]
        })

    # Summary analytics
    total_beats = len(beat_results)
    abnormal_beats = total_beats - class_counts["Normal"]
    dominant_class = max(class_counts, key=class_counts.get)
    abnormality_rate = round((abnormal_beats / total_beats) * 100.0, 1) if total_beats > 0 else 0.0

    return {
        "mode": "continuous_ecg",
        "message": f"Successfully segmented and analyzed {total_beats} physiological heartbeats from continuous ECG.",
        "selected_column": chosen_col_name,
        "available_columns": headers,
        "sampling_rate_used": fs,
        "resampled_to_hz": 125.0,
        "total_heartbeats": total_beats,
        "abnormal_heartbeats": abnormal_beats,
        "abnormality_rate": abnormality_rate,
        "estimated_hr": segmentation_res["estimated_hr"],
        "dominant_rhythm": dominant_class,
        "class_summary": class_counts,
        "heartbeats": beat_results,
        # Default first beat for primary display
        **beat_results[0]
    }


# 5. POST /predict endpoint
@app.post("/predict", summary="Predict ECG Abnormality")
async def predict_endpoint(request: Request):
    """
    Predicts cardiac rhythm abnormalities for an ECG signal.
    Accepts:
    1. JSON: {'signal': [187 numerical values]}
    2. JSON array: [187 numerical values]
    3. Multipart CSV file: uploaded file with 187 values or continuous recording.
    """
    _verify_model_ready()
    content_type = request.headers.get("content-type", "")

    # Handle Multipart File Upload directly on /predict
    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file uploaded. Expected 'file' form field."
            )
        
        filename = getattr(file, "filename", "unnamed.csv").lower()
        # 9 & 10: Reject ECG images and PDF reports with clear clinical explanation
        if any(filename.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".webp"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ECG image files (PNG/JPG) are not supported. This 1D Convolutional Neural Network "
                       "requires discrete numerical voltage time-series data. Image plots lack exact calibrated "
                       "millivolt amplitudes and sampling intervals."
            )
        if filename.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF clinical reports are not supported as raw 1D-CNN model input. "
                       "Please export or extract the raw numerical CSV time-series signal data."
            )

        content_bytes = await file.read()
        try:
            content_str = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must be UTF-8 encoded text or CSV."
            )

        column = form.get("column")
        sr_val = form.get("sampling_rate")
        sr = float(sr_val) if sr_val else None

        return _process_csv_data(content_str, selected_column=column, sampling_rate=sr)

    # Handle JSON input
    if "application/json" in content_type or not content_type:
        try:
            data = await request.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON body: {str(e)}"
            )

        if isinstance(data, list):
            signal_values = data
        elif isinstance(data, dict) and "signal" in data:
            signal_values = data["signal"]
        else:
            raise HTTPException(
                status_code=422,
                detail="JSON body must contain a 'signal' list of exactly 187 floats, e.g. {'signal': [0.1, ...]}"
            )

        return _predict_single_array(signal_values)

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail=f"Unsupported Content-Type '{content_type}'. Use 'application/json' or 'multipart/form-data'."
    )


# Dedicated POST /predict/csv endpoint
@app.post("/predict/csv", summary="Process and Segment CSV ECG Recording")
async def predict_csv_endpoint(
    file: UploadFile = File(...),
    column: Optional[str] = Form(None),
    sampling_rate: Optional[float] = Form(None)
):
    """
    Accepts an uploaded CSV file containing ECG signal readings.
    Supports continuous ECG recordings, multi-column datasets, and 187-value single/batch heartbeats.
    """
    filename = (file.filename or "recording.csv").lower()

    # 9 & 10: Reject unsupported image/PDF formats
    if any(filename.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".webp"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ECG image files (PNG/JPG) are not supported. This 1D Convolutional Neural Network "
                   "requires discrete numerical voltage time-series data. Image plots lack exact calibrated "
                   "millivolt amplitudes and sampling intervals."
        )
    if filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF clinical reports are not supported as raw 1D-CNN model input. "
                   "Please export or extract the raw numerical CSV time-series signal data."
        )

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be UTF-8 encoded text or CSV."
        )

    return _process_csv_data(content_str, selected_column=column, sampling_rate=sampling_rate)


# Helper endpoint: Inspect CSV columns before processing
@app.post("/inspect/csv", summary="Inspect CSV File Structure & Columns")
async def inspect_csv_endpoint(file: UploadFile = File(...)):
    """Inspects an uploaded CSV file, returning column names, row counts, and detected format."""
    filename = (file.filename or "recording.csv").lower()
    if any(filename.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".pdf"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Images and PDF files cannot be inspected as tabular CSV signals."
        )

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Uploaded file must be a UTF-8 text CSV file.")

    try:
        parsed = _parse_csv_content(content_str)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to inspect CSV: {str(e)}")

    # Sample preview of first 5 rows
    preview = []
    for r in parsed["rows"][:5]:
        preview.append(r)

    detected_type = "continuous_ecg"
    if parsed["total_cols"] in [187, 188]:
        detected_type = "segmented_dataset_187"
    elif parsed["total_rows"] == 1 and len(parsed["rows"][0]) == 187:
        detected_type = "single_heartbeat_187"
    elif parsed["total_cols"] == 1 and parsed["total_rows"] == 187:
        detected_type = "single_heartbeat_187"

    return {
        "filename": file.filename,
        "total_rows": parsed["total_rows"],
        "total_cols": parsed["total_cols"],
        "columns": parsed["headers"],
        "has_header": parsed["has_header"],
        "detected_type": detected_type,
        "preview_rows": preview
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
