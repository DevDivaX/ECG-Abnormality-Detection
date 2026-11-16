/**
 * CardioTrace - ECG Signal File Parser & Validator.
 * Handles client-side CSV inspection, delimiter sniffing, schema validation,
 * missing/non-numeric value checking, and signal extraction for waveform preview.
 *
 * NO simulated model predictions are produced here; all predictions come from the FastAPI backend.
 */

/**
 * Validates whether an array of tokens contains exactly 187 finite numbers.
 * @param {Array<string|number>} tokens
 * @returns {{ valid: boolean, values?: number[], error?: string }}
 */
function validate187Array(tokens) {
  if (tokens.length !== 187 && tokens.length !== 188) {
    return {
      valid: false,
      error: `Heartbeat length mismatch: Expected exactly 187 numerical values, but found ${tokens.length}.`
    };
  }

  const values = [];
  const targetTokens = tokens.slice(0, 187);

  for (let i = 0; i < targetTokens.length; i++) {
    const raw = String(targetTokens[i]).trim();
    if (raw === '') {
      return {
        valid: false,
        error: `Missing value at sample index ${i + 1} (empty cell). All 187 heartbeat values must be non-empty numbers.`
      };
    }
    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) {
      return {
        valid: false,
        error: `Non-numeric value "${raw}" at sample index ${i + 1}. All 187 values must be valid floating-point numbers.`
      };
    }
    values.push(num);
  }

  return { valid: true, values };
}

/**
 * Extracts a numeric array from a raw string if it represents exactly 187 numbers.
 * Supported formats:
 * - Single row of 187 comma/tab/space-separated values
 * - 187 lines of 1 value each
 * - First row of a multi-row 187-column dataset
 */
export function extract187SignalValues(fileContent) {
  if (!fileContent || typeof fileContent !== 'string') return null;

  const lines = fileContent.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  // Case 1: Single line containing 187 or 188 numbers
  if (lines.length === 1) {
    const tokens = lines[0].split(/[,\t; ]+/).filter(t => t.length > 0);
    const res = validate187Array(tokens);
    return res.valid ? res.values : null;
  }

  // Case 2: Exactly 187 or 188 vertical lines
  if (lines.length === 187 || lines.length === 188) {
    const singleVals = [];
    for (let i = 0; i < 187; i++) {
      const parts = lines[i].split(/[,\t; ]+/).filter(t => t.length > 0);
      if (parts.length >= 1) {
        singleVals.push(parts[0]);
      } else {
        return null;
      }
    }
    const res = validate187Array(singleVals);
    return res.valid ? res.values : null;
  }

  // Case 3: First line of a multi-row CSV has 187 or 188 values
  if (lines.length > 1) {
    const firstRowTokens = lines[0].split(/[,\t; ]+/).filter(t => t.length > 0);
    const res = validate187Array(firstRowTokens);
    if (res.valid) {
      return res.values;
    }
  }

  return null;
}

/**
 * Validates and parses an uploaded ECG CSV file.
 * Returns comprehensive structural details, validation status, model compatibility,
 * and plottable waveform data.
 *
 * @param {string} fileContent - Raw text content of the CSV
 * @param {string} filename - Name of uploaded file
 * @param {string|null} targetColumn - User-selected column name or index
 * @param {number} nominalSampleRate - Default 125 Hz
 */
export function parseECGForPreview(
  fileContent,
  filename = 'recording.csv',
  targetColumn = null,
  nominalSampleRate = 125
) {
  try {
    if (!fileContent || typeof fileContent !== 'string' || fileContent.trim().length === 0) {
      return {
        success: false,
        error: 'The uploaded file is empty. Please upload a CSV file containing numerical ECG data.',
        validationErrors: ['File is empty.']
      };
    }

    // Only CSV files are initially supported
    const lowerName = (filename || '').toLowerCase();
    if (!lowerName.endsWith('.csv')) {
      const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toUpperCase() : 'unknown';
      return {
        success: false,
        error: `Unsupported file type (.${ext}). Only CSV files (.csv) are currently supported. Please convert or export your ECG recording to standard comma-separated CSV format.`,
        validationErrors: [`Unsupported file extension: .${ext}`]
      };
    }

    const rawLines = fileContent.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) {
      return {
        success: false,
        error: 'The uploaded CSV file contains no non-blank data rows.',
        validationErrors: ['No data rows found.']
      };
    }

    // Detect delimiter: check commas, tabs, semicolons, whitespace
    let delimiter = ',';
    const firstLine = rawLines[0];
    if (firstLine.includes(',')) delimiter = ',';
    else if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(' ')) delimiter = ' ';

    // Helper to split a line safely
    const splitLine = (line) => {
      if (delimiter === ' ') {
        return line.split(/\s+/).filter(t => t.length > 0);
      }
      return line.split(delimiter).map(t => t.trim());
    };

    const firstRowTokens = splitLine(firstLine);

    // -------------------------------------------------------------
    // Check Case A: Single Heartbeat (187 or 188 values in 1 row)
    // -------------------------------------------------------------
    if (rawLines.length === 1 && firstRowTokens.length > 1) {
      const check = validate187Array(firstRowTokens);
      if (!check.valid) {
        return {
          success: false,
          error: check.error,
          validationErrors: [check.error],
          totalRows: 1,
          totalCols: firstRowTokens.length,
          headers: [`1 row × ${firstRowTokens.length} columns`]
        };
      }

      const values = check.values;
      const points = values.map((val, idx) => ({
        index: idx,
        time: parseFloat((idx / nominalSampleRate).toFixed(3)),
        voltage: parseFloat(val.toFixed(4)),
        isRPeak: idx === 38 || idx === 35 // Typical R-peak region in Kaggle MIT-BIH
      }));

      const minVoltage = Math.min(...values);
      const maxVoltage = Math.max(...values);

      return {
        success: true,
        recordingType: 'pre_segmented_187',
        isCompatible: true,
        compatibilityReason: 'Compatible with 1D-CNN input shape (batch_size, 187, 1). Pre-segmented heartbeat matches the Kaggle MIT-BIH benchmark format.',
        totalRows: 1,
        totalCols: 187,
        headers: ['Sample_187'],
        selectedColumn: 'Sample_187',
        selectedColumnIndex: 0,
        missingCount: 0,
        nonNumericCount: 0,
        points,
        totalSamples: points.length,
        durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3)),
        sampleRate: nominalSampleRate,
        detectedBeats: 1,
        stats: {
          minVoltage: parseFloat(minVoltage.toFixed(4)),
          maxVoltage: parseFloat(maxVoltage.toFixed(4)),
          sampleCount: points.length,
          sampleRate: nominalSampleRate,
          durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3))
        }
      };
    }

    // -------------------------------------------------------------
    // Check Case A.2: Exactly 187 or 188 vertical rows of 1 column
    // -------------------------------------------------------------
    if ((rawLines.length === 187 || rawLines.length === 188) && firstRowTokens.length === 1) {
      const singleTokens = rawLines.map(l => splitLine(l)[0]);
      const check = validate187Array(singleTokens);
      if (check.valid) {
        const values = check.values;
        const points = values.map((val, idx) => ({
          index: idx,
          time: parseFloat((idx / nominalSampleRate).toFixed(3)),
          voltage: parseFloat(val.toFixed(4)),
          isRPeak: idx === 38 || idx === 35
        }));

        const minVoltage = Math.min(...values);
        const maxVoltage = Math.max(...values);

        return {
          success: true,
          recordingType: 'pre_segmented_187',
          isCompatible: true,
          compatibilityReason: 'Compatible with 1D-CNN input shape (batch_size, 187, 1). Vertical 187-value heartbeat matches benchmark format.',
          totalRows: 187,
          totalCols: 1,
          headers: ['voltage'],
          selectedColumn: 'voltage',
          selectedColumnIndex: 0,
          missingCount: 0,
          nonNumericCount: 0,
          points,
          totalSamples: points.length,
          durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3)),
          sampleRate: nominalSampleRate,
          detectedBeats: 1,
          stats: {
            minVoltage: parseFloat(minVoltage.toFixed(4)),
            maxVoltage: parseFloat(maxVoltage.toFixed(4)),
            sampleCount: points.length,
            sampleRate: nominalSampleRate,
            durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3))
          }
        };
      }
    }

    // -------------------------------------------------------------
    // Case B & C: Multi-row or Multi-column tabular CSV
    // -------------------------------------------------------------
    // Header detection: if majority of cells in first row are non-numeric and rows > 1
    let numericHeaderCount = 0;
    for (const token of firstRowTokens) {
      if (token !== '' && !isNaN(Number(token)) && isFinite(Number(token))) {
        numericHeaderCount++;
      }
    }
    const hasHeader = rawLines.length > 1 && numericHeaderCount < (firstRowTokens.length / 2.0);

    const headers = hasHeader
      ? firstRowTokens
      : firstRowTokens.map((_, i) => `col_${i + 1}`);

    const dataRows = hasHeader ? rawLines.slice(1) : rawLines;
    const totalRows = dataRows.length;
    const totalCols = headers.length;

    // Check Case A.3: Multi-row pre-segmented dataset (e.g. 187 or 188 columns per row)
    if (totalCols === 187 || totalCols === 188) {
      const firstRowVals = splitLine(dataRows[0]);
      const check = validate187Array(firstRowVals);
      if (check.valid) {
        const values = check.values;
        const points = values.map((val, idx) => ({
          index: idx,
          time: parseFloat((idx / nominalSampleRate).toFixed(3)),
          voltage: parseFloat(val.toFixed(4)),
          isRPeak: idx === 38 || idx === 35
        }));

        const minVoltage = Math.min(...values);
        const maxVoltage = Math.max(...values);

        return {
          success: true,
          recordingType: 'pre_segmented_187',
          isCompatible: true,
          compatibilityReason: `Compatible with 1D-CNN input shape (batch_size, 187, 1). Pre-segmented dataset containing ${totalRows} heartbeat rows of 187 features.`,
          totalRows,
          totalCols,
          headers,
          selectedColumn: headers[0],
          selectedColumnIndex: 0,
          missingCount: 0,
          nonNumericCount: 0,
          points,
          totalSamples: points.length,
          durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3)),
          sampleRate: nominalSampleRate,
          detectedBeats: 1,
          stats: {
            minVoltage: parseFloat(minVoltage.toFixed(4)),
            maxVoltage: parseFloat(maxVoltage.toFixed(4)),
            sampleCount: points.length,
            sampleRate: nominalSampleRate,
            durationSeconds: parseFloat((points.length / nominalSampleRate).toFixed(3))
          }
        };
      }
    }

    // -------------------------------------------------------------
    // Case B: Continuous Time-Series ECG Recording
    // -------------------------------------------------------------
    // Determine column index to extract
    let colIdx = 0;
    if (targetColumn !== null && targetColumn !== undefined) {
      if (typeof targetColumn === 'string' && headers.includes(targetColumn)) {
        colIdx = headers.indexOf(targetColumn);
      } else if (!isNaN(Number(targetColumn))) {
        colIdx = Math.max(0, Math.min(headers.length - 1, Number(targetColumn)));
      }
    } else {
      // Auto-detect voltage / lead signal column
      const leadKeywords = ['voltage', 'mlii', 'lead', 'ecg', 'signal', 'val', 'v5', 'ii', 'amplitude'];
      let found = false;
      for (const kw of leadKeywords) {
        for (let i = 0; i < headers.length; i++) {
          if (headers[i].toLowerCase().includes(kw)) {
            colIdx = i;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      // If col 0 looks like time or index, select col 1
      if (!found && headers.length > 1) {
        const col0 = headers[0].toLowerCase();
        if (col0.includes('time') || col0 === 't' || col0 === 'sec' || col0.includes('index')) {
          colIdx = 1;
        }
      }
    }

    const chosenColName = headers[colIdx] || `Column ${colIdx + 1}`;

    // Validate the chosen signal column across all data rows
    const validationErrors = [];
    const validVoltages = [];
    let missingCount = 0;
    let nonNumericCount = 0;
    const maxErrorsToReport = 5;

    for (let r = 0; r < dataRows.length; r++) {
      const parts = splitLine(dataRows[r]);
      const rowNum = hasHeader ? r + 2 : r + 1;

      if (colIdx >= parts.length || parts[colIdx] === '') {
        missingCount++;
        if (validationErrors.length < maxErrorsToReport) {
          validationErrors.push(`Row ${rowNum}: Missing value in signal column "${chosenColName}".`);
        }
        continue;
      }

      const rawVal = parts[colIdx];
      const num = Number(rawVal);
      if (isNaN(num) || !isFinite(num)) {
        nonNumericCount++;
        if (validationErrors.length < maxErrorsToReport) {
          validationErrors.push(`Row ${rowNum}: Non-numeric value "${rawVal}" in signal column "${chosenColName}".`);
        }
        continue;
      }

      validVoltages.push(num);
    }

    if (missingCount > maxErrorsToReport) {
      validationErrors.push(`... and ${missingCount - maxErrorsToReport} additional missing values.`);
    }
    if (nonNumericCount > maxErrorsToReport) {
      validationErrors.push(`... and ${nonNumericCount - maxErrorsToReport} additional non-numeric values.`);
    }

    // If completely invalid or no numbers extracted
    if (validVoltages.length === 0) {
      return {
        success: false,
        error: `No valid numerical ECG values could be extracted from column "${chosenColName}". Please ensure the column contains discrete numeric values.`,
        validationErrors,
        totalRows,
        totalCols,
        headers,
        selectedColumn: chosenColName,
        selectedColumnIndex: colIdx,
        missingCount,
        nonNumericCount
      };
    }

    // Check if the signal is pre-segmented heartbeat with incorrect length
    // (e.g. user uploaded 1-row or 1-column with length between 2 and 186 or > 188)
    if (totalCols === 1 && totalRows < 50) {
      return {
        success: false,
        error: `Invalid heartbeat length: Found ${totalRows} samples in single column. The 1D-CNN model requires exactly 187 numerical values per heartbeat.`,
        validationErrors: [`Sample count ${totalRows} does not match expected 187 values.`],
        totalRows,
        totalCols,
        headers,
        selectedColumn: chosenColName,
        selectedColumnIndex: colIdx,
        missingCount,
        nonNumericCount
      };
    }

    // Build waveform points (limit to 3000 for high performance rendering)
    const maxPreview = 3000;
    const previewSlice = validVoltages.slice(0, maxPreview);

    const minVoltage = Math.min(...previewSlice);
    const maxVoltage = Math.max(...previewSlice);
    const voltageRange = maxVoltage - minVoltage || 1;
    const peakThresh = minVoltage + voltageRange * 0.7;

    const points = [];
    const peakIndices = [];

    for (let i = 0; i < previewSlice.length; i++) {
      const v = previewSlice[i];
      let isPeak = false;
      if (
        i >= 2 && i < previewSlice.length - 2 &&
        v > peakThresh &&
        v > previewSlice[i - 1] && v > previewSlice[i - 2] &&
        v >= previewSlice[i + 1] && v >= previewSlice[i + 2]
      ) {
        if (peakIndices.length === 0 || (i - peakIndices[peakIndices.length - 1]) > (nominalSampleRate * 0.25)) {
          peakIndices.push(i);
          isPeak = true;
        }
      }
      points.push({
        index: i,
        time: parseFloat((i / nominalSampleRate).toFixed(3)),
        voltage: parseFloat(v.toFixed(4)),
        isRPeak: isPeak
      });
    }

    // If there were missing or non-numeric values, report validation issue
    if (missingCount > 0 || nonNumericCount > 0) {
      return {
        success: false,
        error: `CSV validation failed: Found ${missingCount} missing value(s) and ${nonNumericCount} non-numeric value(s) in signal column "${chosenColName}". The ECG signal must be continuous and purely numerical.`,
        validationErrors,
        totalRows,
        totalCols,
        headers,
        selectedColumn: chosenColName,
        selectedColumnIndex: colIdx,
        missingCount,
        nonNumericCount,
        points: [],
        totalSamples: validVoltages.length
      };
    }

    // Continuous ECG recording (Type B)
    // As per Requirement 4: Continuous ECG analysis is unsupported for now.
    return {
      success: true,
      recordingType: 'continuous_ecg',
      isCompatible: false, // Unsupported for 1D-CNN analysis
      compatibilityReason: 'Continuous ECG recording detected. The trained 1D-CNN model requires pre-segmented 187-value cardiac cycles. Because clinical R-peak detection and Kaggle-standard window segmentation are not currently implemented for standalone inference, continuous ECG analysis is disabled to prevent inaccurate arrhythmia classification.',
      totalRows,
      totalCols,
      headers,
      selectedColumn: chosenColName,
      selectedColumnIndex: colIdx,
      missingCount: 0,
      nonNumericCount: 0,
      validationErrors: [],
      points,
      totalSamples: validVoltages.length,
      durationSeconds: parseFloat((validVoltages.length / nominalSampleRate).toFixed(2)),
      sampleRate: nominalSampleRate,
      detectedBeats: peakIndices.length,
      stats: {
        minVoltage: parseFloat(minVoltage.toFixed(4)),
        maxVoltage: parseFloat(maxVoltage.toFixed(4)),
        sampleCount: validVoltages.length,
        sampleRate: nominalSampleRate,
        durationSeconds: parseFloat((validVoltages.length / nominalSampleRate).toFixed(2))
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while parsing the CSV file.',
      validationErrors: [err.message || 'Parsing error']
    };
  }
}

// Backward-compatible export alias
export const parseECGFile = parseECGForPreview;

