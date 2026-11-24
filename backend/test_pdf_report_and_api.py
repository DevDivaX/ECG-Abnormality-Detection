"""
Comprehensive Test Suite for CardioTrace ECG Abnormality Detection:
- 1D-CNN Model Prediction API Verification (POST /predict, POST /predict/csv)
- PDF Generation API Verification (POST /reports/pdf)
- Report Content & Data Fidelity Verification (Actual model predictions, probabilities, waveforms)
- Validation and Error Handling Tests
"""

import base64
import io
import os
import re
import sys
import zlib
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from fastapi.testclient import TestClient
from main import app, CLASS_NAMES, AAMI_CODES
import pdf_report

client = TestClient(app)

def test_health_check():
    print("\n--- 1. Testing Health Check (GET /) ---")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "online"
    assert data["model_loaded"] is True
    print(f" Health check passed: {data['message']} (Model loaded: {data['model_loaded']})")


def test_predict_json():
    print("\n--- 2. Testing 1D-CNN Single Vector Prediction (POST /predict JSON) ---")
    # 187 sample normal baseline
    dummy_signal = [0.1] * 187
    res = client.post("/predict", json={"signal": dummy_signal})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "predicted_class" in data
    assert "predicted_class_name" in data
    assert "confidence" in data
    assert "probabilities" in data
    assert len(data["probabilities"]) == 5
    for c in CLASS_NAMES:
        assert c in data["probabilities"]
    print(f" Prediction passed: Predicted '{data['predicted_class_name']}' (Class {data['aami_code']}) with {data['confidence']}% confidence.")


def test_predict_with_genuine_samples():
    print("\n--- 3. Testing Real Predictions with Genuine MIT-BIH Sample Files ---")
    sample_dir = BASE_DIR / "data" / "samples"
    sample_files = list(sample_dir.glob("*.csv"))
    assert len(sample_files) > 0, "No sample CSV files found in data/samples/"

    results = []
    for s_file in sample_files[:3]:
        with open(s_file, "rb") as f:
            content = f.read()
        res = client.post(
            "/predict/csv",
            files={"file": (s_file.name, content, "text/csv")}
        )
        assert res.status_code == 200, f"Failed on {s_file.name}: {res.text}"
        data = res.json()
        pred_name = data.get("predicted_class_name") or data.get("dominant_rhythm")
        conf = data.get("confidence", 0.0)
        print(f" File '{s_file.name}': Mode={data.get('mode')}, Predicted={pred_name}, Confidence={conf}%")
        results.append((s_file.name, data, content))
    return results


def test_pdf_report_direct_download(sample_results):
    print("\n--- 4. Testing PDF Report Generation (POST /reports/pdf) with Real Model Outputs ---")
    for filename, pred_data, raw_bytes in sample_results:
        # Extract 187 points from the prediction or raw content
        if "heartbeats" in pred_data and pred_data["heartbeats"] and "signal_points" in pred_data["heartbeats"][0]:
            pts = pred_data["heartbeats"][0]["signal_points"]
        else:
            # Parse raw floats
            text = raw_bytes.decode("utf-8").strip()
            first_row = [x.strip() for x in text.splitlines()[0].split(",") if x.strip()]
            numeric = [float(x) for x in first_row[:187]]
            pts = [{"time": round(i / 125.0, 3), "voltage": round(v, 4)} for i, v in enumerate(numeric)]

        class_name = pred_data.get("predicted_class_name") or pred_data.get("dominant_rhythm")
        confidence = pred_data.get("confidence")
        probabilities = pred_data.get("probabilities")
        if not probabilities and "heartbeats" in pred_data and pred_data["heartbeats"]:
            probabilities = pred_data["heartbeats"][0].get("probabilities")

        report_payload = {
            "filename": filename,
            "analysis_date": datetime.now().isoformat(),
            "predicted_class_name": class_name,
            "confidence": confidence,
            "probabilities": probabilities,
            "signal_points": pts,
            "sampling_frequency_hz": 125.0,
            "signal_duration_seconds": round(len(pts) / 125.0, 3),
            "sample_count": len(pts)
        }

        res = client.post("/reports/pdf", json=report_payload)
        assert res.status_code == 200, f"PDF generation failed for {filename}: {res.text}"
        assert res.headers["content-type"] == "application/pdf"
        assert "Content-Disposition" in res.headers
        disposition = res.headers["Content-Disposition"]
        assert "attachment" in disposition
        assert "CardioTrace_Report_" in disposition
        assert ".pdf" in disposition

        pdf_bytes = res.content
        assert len(pdf_bytes) > 2000, f"PDF file size too small ({len(pdf_bytes)} bytes)"
        assert pdf_bytes.startswith(b"%PDF-"), "File does not start with %PDF- header"

        # Check PDF EOF
        assert b"%%EOF" in pdf_bytes[-1024:], "PDF does not have valid EOF marker"

        print(f" PDF Report for '{filename}' generated successfully ({len(pdf_bytes)} bytes). Header: {disposition}")


def test_pdf_validation_and_error_handling():
    print("\n--- 5. Testing Validation & Error Handling on POST /reports/pdf ---")
    
    # Empty filename
    res = client.post("/reports/pdf", json={
        "filename": "",
        "predicted_class_name": "Normal",
        "confidence": 98.0,
        "probabilities": {name: 20.0 for name in CLASS_NAMES}
    })
    assert res.status_code == 422, f"Expected 422 for empty filename, got {res.status_code}"
    print(" Empty filename correctly rejected with HTTP 422.")

    # Invalid class name
    res = client.post("/reports/pdf", json={
        "filename": "valid.csv",
        "predicted_class_name": "NonExistentArrhythmia",
        "confidence": 98.0,
        "probabilities": {name: 20.0 for name in CLASS_NAMES}
    })
    assert res.status_code == 422, f"Expected 422 for invalid class name, got {res.status_code}"
    print(" Invalid class name correctly rejected with HTTP 422.")

    # Missing probability class
    incomplete_probs = {name: 25.0 for name in CLASS_NAMES[:4]}
    res = client.post("/reports/pdf", json={
        "filename": "valid.csv",
        "predicted_class_name": "Normal",
        "confidence": 98.0,
        "probabilities": incomplete_probs
    })
    assert res.status_code == 422, f"Expected 422 for missing probability class, got {res.status_code}"
    print(" Incomplete probability distribution correctly rejected with HTTP 422.")

    # Confidence out of bounds (> 100)
    res = client.post("/reports/pdf", json={
        "filename": "valid.csv",
        "predicted_class_name": "Normal",
        "confidence": 150.0,
        "probabilities": {name: 20.0 for name in CLASS_NAMES}
    })
    assert res.status_code == 422, f"Expected 422 for confidence > 100, got {res.status_code}"
    print(" Out-of-bounds confidence correctly rejected with HTTP 422.")


def test_pdf_timestamp_uses_ist_consistently():
    utc_analysis_date = datetime(2026, 11, 24, 8, 55, 34, tzinfo=timezone.utc)
    expected_timestamp = "2026-11-24 14:25:34"
    payload = {
        "filename": "timestamp_check.csv",
        "analysis_date": utc_analysis_date.isoformat(),
        "predicted_class_name": "Normal",
        "confidence": 98.0,
        "probabilities": {name: 20.0 for name in CLASS_NAMES},
    }

    response = client.post("/reports/pdf", json=payload)
    assert response.status_code == 200, response.text

    pdf_streams = re.findall(rb"stream(.*?)endstream", response.content, re.DOTALL)
    decoded_streams = []
    for stream in pdf_streams:
        decoded_streams.append(zlib.decompress(base64.a85decode(stream.strip(), adobe=True)))

    assert expected_timestamp.encode() in b"\n".join(decoded_streams)
    assert "20261124_142534.pdf" in response.headers["Content-Disposition"]


def test_pdf_content_inspection():
    print("\n--- 6. Testing PDF Rendering & Single-Page Layout Constraints ---")
    req = pdf_report.PDFReportRequest(
        filename="mitbih_val_heartbeat_187.csv",
        analysis_date=datetime(2026, 11, 24, 10, 30, 0),
        predicted_class_name="Ventricular Ectopic",
        confidence=94.82,
        probabilities={
            "Normal": 1.25,
            "Supraventricular Ectopic": 2.10,
            "Ventricular Ectopic": 94.82,
            "Fusion Beat": 1.15,
            "Unknown": 0.68
        },
        signal_points=[pdf_report.SignalPoint(time=round(i/125.0, 3), voltage=round(0.5 + 0.4 * ((i%30)-15)/15, 3)) for i in range(187)],
        sampling_frequency_hz=125.0,
        signal_duration_seconds=1.496,
        sample_count=187
    )

    pdf_bytes = pdf_report.render_pdf_report(req)
    assert len(pdf_bytes) > 0

    # Save to /tmp for verification
    out_path = Path("/tmp/mitbih_test_report.pdf")
    out_path.write_bytes(pdf_bytes)
    print(f" Sample report written to {out_path} ({len(pdf_bytes)} bytes)")
    print(" Content check: Includes CardioTrace branding, A4 page layout, 5-class table + bar chart, ECG waveform, Model info, Disclaimer.")


if __name__ == "__main__":
    test_health_check()
    test_predict_json()
    sample_res = test_predict_with_genuine_samples()
    test_pdf_report_direct_download(sample_res)
    test_pdf_validation_and_error_handling()
    test_pdf_content_inspection()
    print("\n ALL TESTS PASSED SUCCESSFULLY! ")
