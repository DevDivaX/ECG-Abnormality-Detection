# ECG Abnormality Detection using a 1D CNN

An explainable deep learning system for detecting and classifying cardiac arrhythmias and ECG abnormalities from discrete electrocardiogram signals using a 1D Convolutional Neural Network (CNN).

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [AAMI EC57 Five ECG Classes](#aami-ec57-five-ecg-classes)
- [System Architecture & Technologies](#system-architecture--technologies)
- [Model Information](#model-information)
- [Project Structure](#project-structure)
- [Backend Setup & Execution](#backend-setup--execution)
- [Frontend Setup & Execution](#frontend-setup--execution)
- [API Documentation](#api-documentation)
- [Signal Preprocessing & Input Formats](#signal-preprocessing--input-formats)
- [Important Limitations & Clinical Disclaimer](#important-limitations--clinical-disclaimer)

---

## 🩺 Project Overview

Cardiovascular diseases are the leading cause of global mortality. While prolonged Holter and ambulatory monitoring capture thousands of cardiac cycles over hours or days, manual inspection of subtle, paroxysmal arrhythmias (such as intermittent Premature Ventricular Contractions or Atrial Fibrillation) is labor-intensive and prone to fatigue-induced diagnostic delays.

This project delivers an end-to-end full-stack solution:
1. **A trained 1D Convolutional Neural Network** that operates directly on sequential time-series voltage amplitudes, capturing P-Q-R-S-T wave morphometry without converting 1D electrical traces into lossy 2D spectrograms or raster plots.
2. **A high-performance FastAPI backend** that loads the trained model (`models/ecg_cnn_final.keras`) without compilation (due to custom Focal Loss used during training), validates signals, handles both single 187-sample heartbeats and continuous ECG recordings via automatic R-peak segmentation, and returns class probabilities.
3. **An interactive React + Vite frontend** featuring real-time telemetry playback, dual visual themes (Dark Telemetry & Classic Pink ECG Paper Grid), interactive CSV uploading, column selection, per-beat scrubbing, and Explainable AI (XAI) feature attribution.

---

## ✨ Key Features

- **Direct 1D-CNN Inference**: Sub-5ms inference per cardiac cycle, operating on raw 187-sample normalized voltage vectors.
- **Support for Single Heartbeats & Continuous ECG**:
  - Direct 187-value JSON or CSV input for isolated cardiac beats.
  - Continuous raw ECG recording support with automatic Pan-Tompkins QRS R-peak detection, standard 125 Hz resampling, window segmentation, and zero-padding matching the MIT-BIH benchmark.
- **Multi-Column CSV Lead Selection**: Inspects uploaded CSV files and allows users to select the target signal lead/column (e.g., `voltage`, `MLII`, `Lead II`).
- **AAMI EC57 Multi-Class Classification**: Softmax posterior probability distribution across all 5 standard clinical classes.
- **Multi-Beat Analytics**: Summarizes continuous recordings with total beat counts, estimated heart rate (BPM), abnormality rates, and individual beat browsing.
- **Interactive Waveform Studio**: SVG electrocardiogram viewer with dynamic play/pause sweep animation, R-peak markers, P/T wave annotations, gain adjustment, and pink paper grid toggle.
- **Format Validation**: Rejects non-numeric values, NaNs, infinities, and explicitly denies unsupported file formats (such as PNG/JPG images and PDF reports) with clear medical informatics explanations.

---

## 🏷️ AAMI EC57 Five ECG Classes

The Association for the Advancement of Medical Instrumentation (AAMI) EC57 standard groups the 15+ MIT-BIH arrhythmia beat types into five standardized classes:

| Class Index | Class Name | AAMI Code | Description & Clinical Examples |
|:-----------:|:-----------|:---------:|:--------------------------------|
| **0** | **Normal** | `N` | Normal sinus rhythm, Left/Right Bundle Branch Block (LBBB/RBBB), sinus bradycardia, sinus tachycardia. |
| **1** | **Supraventricular Ectopic** | `S` | Atrial Premature Contractions (APCs/PACs), aberrant atrial beats, nodal premature beats, supraventricular tachycardias. |
| **2** | **Ventricular Ectopic** | `V` | Premature Ventricular Contractions (PVCs), ventricular escape beats, ventricular bigeminy / trigeminy. |
| **3** | **Fusion Beat** | `F` | Hybrid beats occurring when ventricular ectopic pacemakers and normal supraventricular impulses collide. |
| **4** | **Unknown** | `Q` | Paced beats (artificial electronic pacemaker spikes), fusion of paced beats, unclassifiable or distorted beats. |

---

## 🛠️ System Architecture & Technologies

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI**: Asynchronous web framework for high-throughput REST API endpoints.
- **Uvicorn**: Lightning-fast ASGI web server.
- **TensorFlow / Keras**: Deep learning engine executing the 1D-CNN model graph.
- **NumPy**: High-performance tensor and array manipulation.
- **SciPy**: Signal processing utilities (Butterworth bandpass filtering, peak detection, signal resampling).
- **python-multipart**: Streaming multipart/form-data CSV file uploads.

### Frontend
- **React 18** + **Vite 6**: Fast, modern frontend framework and bundler.
- **Tailwind CSS**: Medical-grade dark telemetry styling.
- **Lucide React**: Clean iconography.
- **Recharts**: Metric distributions and training history charting.

---

## 🧠 Model Information

- **Model File**: [`models/ecg_cnn_final.keras`](file:///workspaces/ECG-Abnormality-Detection/models/ecg_cnn_final.keras)
- **Input Tensor Shape**: `(Batch_Size, 187, 1)` (single-channel 1D time-series)
- **Output Tensor Shape**: `(Batch_Size, 5)` (Softmax probability distribution)
- **Loss Function**: Custom **Focal Loss** (designed to counter extreme class imbalance in cardiac data where normal beats heavily dominate ectopic beats).
- **Inference Loading**: Loaded with `compile=False` to allow standalone inference without requiring the custom loss function to be compiled:
  ```python
  import tensorflow as tf
  model = tf.keras.models.load_model('models/ecg_cnn_final.keras', compile=False)
  ```

---

## 📁 Project Structure

```text
ECG-Abnormality-Detection/
├── app/                          # React + Vite frontend
│   ├── .env                      # Frontend environment variables (VITE_API_URL)
│   ├── package.json              # Frontend npm dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS theme
│   └── src/
│       ├── App.jsx               # Main React application shell
│       ├── components/
│       │   ├── Header.jsx        # Navigation & FastAPI connection status badge
│       │   ├── FileUploadSection.jsx # CSV upload, validation & column selection
│       │   ├── PredictionPanel.jsx   # 5-class probability cards & multi-beat scrubber
│       │   ├── ECGWaveformViewer.jsx # Interactive SVG waveform monitor
│       │   ├── Overview.jsx      # Clinical problem statement & architecture
│       │   ├── ModelMetrics.jsx  # Benchmarks & confusion matrix
│       │   └── DisclaimerBanner.jsx  # Medical education disclosure
│       ├── data/
│       │   ├── demoSignals.js    # Pre-configured clinical waveforms
│       │   └── modelMetricsData.js   # Benchmark metrics & layer parameters
│       └── utils/
│           ├── api.js            # Fetch client for FastAPI backend endpoints
│           └── ecgParser.js      # CSV parser, peak detector & synthetic sample generator
├── backend/                      # FastAPI Python backend
│   ├── main.py                   # FastAPI app, endpoints, segmentation, model loading
│   └── requirements.txt          # Python dependencies
├── data/
│   ├── README.md                 # Dataset documentation
│   └── samples/                  # Ready-to-test CSV files
│       ├── sample_normal_187.csv         # Valid 187-sample normal beat
│       └── sample_continuous_lead2.csv   # 5-second continuous recording
├── models/
│   ├── README.md
│   └── ecg_cnn_final.keras       # Trained 1D-CNN Keras model (DO NOT MODIFY)
├── notebooks/                    # Jupyter notebooks for model development
├── results/                      # Experiment logs and evaluation figures
├── src/                          # Reusable Python training & evaluation modules
└── README.md                     # Project documentation
```

---

## 🚀 Backend Setup & Execution

### 1. Prerequisites
- Python 3.11, 3.12, 3.13, or 3.14
- pip package manager

### 2. Install Dependencies
From the repository root directory, run:
```bash
pip install -r backend/requirements.txt
```

### 3. Start the FastAPI Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend server will initialize, load `models/ecg_cnn_final.keras` with `compile=False`, perform a warmup inference, and start listening on port `8000`.

- **API Root**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 💻 Frontend Setup & Execution

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm

### 2. Environment Configuration
Verify that `app/.env` contains the correct backend URL:
```env
VITE_API_URL=http://localhost:8000
```
*(In remote environments or GitHub Codespaces, set `VITE_API_URL` to your forwarded port 8000 URL).*

### 3. Install Dependencies
```bash
cd app
npm install
```

### 4. Start Development Server
```bash
npm run dev
```
The frontend will start at [http://localhost:5173/](http://localhost:5173/).

### 5. Build for Production
```bash
npm run build
```
Build outputs are written to `app/dist/`.

---

## 📡 API Documentation

### 1. Health Check & Metadata
- **Endpoint**: `GET /`
- **Description**: Verifies that the API service is running and confirms that `models/ecg_cnn_final.keras` is loaded.
- **Example Response**:
  ```json
  {
    "status": "online",
    "message": "ECG Abnormality Detection API is running",
    "model_loaded": true,
    "model_path": "/workspaces/ECG-Abnormality-Detection/models/ecg_cnn_final.keras",
    "input_shape": [null, 187, 1],
    "output_classes": {
      "0": "Normal",
      "1": "Supraventricular Ectopic",
      "2": "Ventricular Ectopic",
      "3": "Fusion Beat",
      "4": "Unknown"
    }
  }
  ```

---

### 2. Predict Single Heartbeat (JSON or CSV)
- **Endpoint**: `POST /predict`
- **Headers**: `Content-Type: application/json` or `multipart/form-data`
- **Payload (JSON)**:
  ```json
  {
    "signal": [0.0, 0.02, 0.15, ..., 0.0]  // Exactly 187 float values
  }
  ```
- **Validation**:
  - Rejects inputs where `len(signal) != 187` with HTTP 422.
  - Rejects `NaN`, `Infinity`, and non-numeric characters with HTTP 422.
- **Example Response**:
  ```json
  {
    "predicted_class": 0,
    "predicted_class_name": "Normal",
    "aami_code": "N",
    "confidence": 80.32,
    "probabilities": {
      "Normal": 80.32,
      "Supraventricular Ectopic": 11.81,
      "Ventricular Ectopic": 6.42,
      "Fusion Beat": 0.28,
      "Unknown": 1.17
    },
    "class_probabilities": [
      { "class": "Normal", "code": "N", "probability": 80.32 },
      { "class": "Supraventricular Ectopic", "code": "S", "probability": 11.81 },
      { "class": "Ventricular Ectopic", "code": "V", "probability": 6.42 },
      { "class": "Fusion Beat", "code": "F", "probability": 0.28 },
      { "class": "Unknown", "code": "Q", "probability": 1.17 }
    ]
  }
  ```

---

### 3. Continuous ECG & Batch CSV Processing
- **Endpoint**: `POST /predict/csv`
- **Method**: Multipart Form Upload
- **Parameters**:
  - `file`: CSV / TXT file containing numerical ECG recordings.
  - `column`: (Optional) Column header to select if multi-column CSV.
  - `sampling_rate`: (Optional) Sampling rate in Hz (default: 125 Hz).
- **Behavior**:
  - Automatically identifies whether data is a single heartbeat, multi-row 187-value batch, or continuous ECG.
  - For continuous ECG, runs Butterworth bandpass filtering (0.5–40 Hz) and Pan-Tompkins R-peak detection.
  - Segments each physiological heartbeat centered around R-peaks, min-max normalizes to `[0, 1]`, and pads to 187 samples matching MIT-BIH preprocessing.
  - Returns individual beat predictions and an overall rhythm summary.
  - Rejects flatline or non-cardiac signals where no valid QRS peaks exist.
  - Rejects image files (`.png`, `.jpg`) and PDF reports (`.pdf`) with HTTP 400.

---

### 4. Inspect CSV Columns
- **Endpoint**: `POST /inspect/csv`
- **Method**: Multipart Form Upload
- **Description**: Returns CSV column headers, row counts, detected data format, and preview rows to enable frontend lead/column selection.

---

## 🔬 Signal Preprocessing & Input Formats

### 1. Isolated Heartbeat Mode (187 Samples)
- In the Kaggle MIT-BIH training dataset, each heartbeat is resampled to **125 Hz**, centered around its QRS complex, min-max normalized between 0.0 and 1.0, and zero-padded to **187 values**.
- When sending 187 values to `/predict`, **no additional scaling or filtering is applied** so that the signal matches the model's exact training space.

### 2. Continuous ECG Mode
- If an uploaded CSV contains a continuous time-series recording (e.g. 500+ samples across seconds or minutes):
  1. If original sampling rate $\neq$ 125 Hz, the signal is resampled to 125 Hz using polyphase filtering.
  2. Baseline drift is eliminated via a 0.5–40 Hz Butterworth bandpass filter.
  3. QRS R-peaks are detected with a minimum refractory distance of $\ge 250\text{ ms}$ (to prevent false double-counting of T-waves).
  4. Each cardiac cycle is extracted (pre-R window ~25 samples, post-R window ~75 samples), min-max normalized to $[0, 1]$, and zero-padded to 187 samples.
  5. Arbitrary 187-sample slicing is strictly forbidden to preserve physiological validity.

### 3. Unsupported Formats
- **ECG Images (PNG / JPG / TIFF)**: Not supported. 1D CNNs require discrete calibrated numerical amplitudes (mV) sampled uniformly in time. Image plots lose voltage calibration and temporal resolution.
- **PDF Clinical Reports**: Not supported as direct model input. Numerical time-series data must be extracted or exported from the ECG machine before analysis.

---

## ⚠️ Important Limitations & Clinical Disclaimer

> [!CAUTION]
> **EDUCATIONAL DEMONSTRATION ONLY — NOT A CLINICAL DIAGNOSTIC DEVICE**
>
> 1. **Academic Prototype**: This application is developed strictly as a college engineering project for academic demonstration and machine learning research on 1D Convolutional Neural Networks.
> 2. **Not Clinically Validated**: This system has not been evaluated, verified, or cleared by the FDA, EMA, CDSCO, or any recognized medical regulatory body.
> 3. **No Clinical Reliance**: Healthcare professionals and patients must **NOT** use outputs, predictions, or risk scores from this application for primary diagnosis, patient triage, clinical decision-making, prescription adjustments, or emergency treatment.
> 4. **Electrophysiological Constraints**: Predictions are based on Lead II morphological benchmarks from the MIT-BIH Arrhythmia Database and may not generalize across 12-lead vectorcardiography, multi-channel telemetry, severe electrode motion artifacts, pacemaker interference, or diverse clinical populations.
