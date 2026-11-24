// Synthetic and realistic ECG waveforms for demonstration
// Complies with AAMI EC57 standard heartbeat categories used in MIT-BIH Arrhythmia benchmarking:
// N: Normal beat / Bundle branch block
// S: Supraventricular ectopic beat
// V: Premature ventricular contraction
// F: Fusion of ventricular and normal beat
// Q: Unclassified / Paced beat

function generateWaveformPoints(type, durationSeconds = 10, sampleRate = 250) {
  const totalSamples = durationSeconds * sampleRate;
  const points = [];
  
  // Baseline wander noise generator (simulates breathing / electrode drift)
  const wander = (t) => 0.04 * Math.sin(2 * Math.PI * 0.18 * t) + 0.02 * Math.sin(2 * Math.PI * 0.45 * t);
  // High-frequency muscular tremor noise
  const noise = () => (Math.random() - 0.5) * 0.015;

  let currentTime = 0;
  const dt = 1 / sampleRate;

  // Gaussian wave helper
  const gaussian = (t, center, amplitude, width) => {
    return amplitude * Math.exp(-Math.pow((t - center) / width, 2));
  };

  if (type === 'normal') {
    // Regular 75 BPM -> RR interval 0.8s
    const rr = 0.8;
    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      const beatTime = t % rr;
      
      // P wave: center at 0.18s, amp 0.15 mV, width 0.04s
      const p = gaussian(beatTime, 0.18, 0.16, 0.035);
      // Q wave: center at 0.28s, amp -0.12 mV, width 0.012s
      const q = gaussian(beatTime, 0.28, -0.12, 0.012);
      // R wave: center at 0.30s, amp 1.35 mV, width 0.02s
      const r = gaussian(beatTime, 0.30, 1.35, 0.02);
      // S wave: center at 0.325s, amp -0.32 mV, width 0.015s
      const s = gaussian(beatTime, 0.325, -0.32, 0.015);
      // T wave: center at 0.50s, amp 0.32 mV, width 0.07s
      const twave = gaussian(beatTime, 0.50, 0.32, 0.07);

      const voltage = p + q + r + s + twave + wander(t) + noise();
      points.push({
        time: parseFloat(t.toFixed(3)),
        voltage: parseFloat(voltage.toFixed(4)),
        isRPeak: Math.abs(beatTime - 0.30) < dt / 2
      });
    }
  } else if (type === 'pvc') {
    // Premature Ventricular Contraction: Normal beats interrupted by early, wide bizarre beat
    let nextBeatTime = 0.1;
    let beatIndex = 0;

    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      let voltage = wander(t) + noise();
      let isR = false;

      // Plan beats: beat 0,1,2 normal (0.8s), beat 3 is premature (at 0.5s) with wide QRS, followed by 1.1s compensatory pause
      const beatCycle = beatIndex % 5;
      const isPVCBeat = (beatCycle === 3);

      if (t >= nextBeatTime) {
        // We reached a beat
        beatIndex++;
      }

      // Check current beat window
      const timeInBeat = t - (nextBeatTime - (isPVCBeat ? 0.52 : (beatCycle === 4 ? 1.08 : 0.8)));

      if (!isPVCBeat) {
        // Normal beat
        const p = gaussian(timeInBeat, 0.18, 0.16, 0.035);
        const q = gaussian(timeInBeat, 0.28, -0.10, 0.012);
        const r = gaussian(timeInBeat, 0.30, 1.30, 0.02);
        const s = gaussian(timeInBeat, 0.325, -0.28, 0.015);
        const twave = gaussian(timeInBeat, 0.50, 0.30, 0.07);
        voltage += p + q + r + s + twave;
        if (Math.abs(timeInBeat - 0.30) < dt / 2) isR = true;
      } else {
        // PVC: No P wave, very wide negative/positive bizarre QRS (>140ms), discordant T wave
        const wideR = gaussian(timeInBeat, 0.18, 0.45, 0.04);
        const deepS = gaussian(timeInBeat, 0.24, -1.55, 0.055);
        const discordantT = gaussian(timeInBeat, 0.42, 0.52, 0.09);
        voltage += wideR + deepS + discordantT;
        if (Math.abs(timeInBeat - 0.24) < dt / 2) isR = true;
      }

      if (t >= nextBeatTime) {
        const nextInterval = (beatCycle === 2) ? 0.52 : (beatCycle === 3 ? 1.08 : 0.8);
        nextBeatTime += nextInterval;
      }

      points.push({
        time: parseFloat(t.toFixed(3)),
        voltage: parseFloat(voltage.toFixed(4)),
        isRPeak: isR
      });
    }
  } else if (type === 'afib') {
    // Atrial Fibrillation: irregular RR intervals, fine irregular fibrillatory baseline (f-waves), no clear P waves
    let nextBeatTime = 0.2;
    // Pre-calculated pseudo-random RR intervals (0.5s to 0.9s)
    const irregularRRs = [0.58, 0.74, 0.52, 0.82, 0.64, 0.56, 0.78, 0.62, 0.86, 0.54, 0.70, 0.60];
    let rrIdx = 0;

    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      // High-frequency fibrillatory baseline oscillations (300-600/min => 5-10 Hz)
      const fWave = 0.07 * Math.sin(2 * Math.PI * 6.5 * t + Math.sin(t * 3)) + 
                    0.05 * Math.cos(2 * Math.PI * 9.2 * t);
      let voltage = fWave + wander(t) + noise();
      let isR = false;

      const currentRR = irregularRRs[rrIdx % irregularRRs.length];
      const timeInBeat = t - (nextBeatTime - currentRR);

      if (timeInBeat >= 0 && timeInBeat <= currentRR) {
        // No P wave in AFib!
        const q = gaussian(timeInBeat, 0.14, -0.08, 0.012);
        const r = gaussian(timeInBeat, 0.16, 1.25, 0.02);
        const s = gaussian(timeInBeat, 0.185, -0.30, 0.015);
        const twave = gaussian(timeInBeat, 0.35, 0.25, 0.065);
        voltage += q + r + s + twave;
        if (Math.abs(timeInBeat - 0.16) < dt / 2) isR = true;
      }

      if (t >= nextBeatTime) {
        rrIdx++;
        nextBeatTime += irregularRRs[rrIdx % irregularRRs.length];
      }

      points.push({
        time: parseFloat(t.toFixed(3)),
        voltage: parseFloat(voltage.toFixed(4)),
        isRPeak: isR
      });
    }
  } else if (type === 'svt') {
    // Supraventricular Tachycardia: Rapid rhythm ~150 BPM (RR = 0.40s)
    const rr = 0.40;
    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      const beatTime = t % rr;

      // P wave often merged into preceding T wave
      const p = gaussian(beatTime, 0.08, 0.09, 0.025);
      const q = gaussian(beatTime, 0.13, -0.09, 0.01);
      const r = gaussian(beatTime, 0.15, 1.20, 0.018);
      const s = gaussian(beatTime, 0.17, -0.28, 0.012);
      const twave = gaussian(beatTime, 0.28, 0.30, 0.05);

      const voltage = p + q + r + s + twave + wander(t) + noise();
      points.push({
        time: parseFloat(t.toFixed(3)),
        voltage: parseFloat(voltage.toFixed(4)),
        isRPeak: Math.abs(beatTime - 0.15) < dt / 2
      });
    }
  } else if (type === 'lbbb') {
    // Left Bundle Branch Block: prolonged QRS (> 130ms), notched R wave or broad M-shaped peak
    const rr = 0.82;
    for (let i = 0; i < totalSamples; i++) {
      const t = i * dt;
      const beatTime = t % rr;

      const p = gaussian(beatTime, 0.16, 0.14, 0.035);
      // Notched / broadened R peak (duration ~140ms)
      const r1 = gaussian(beatTime, 0.27, 0.95, 0.03);
      const r2 = gaussian(beatTime, 0.31, 1.10, 0.035);
      const s = gaussian(beatTime, 0.35, -0.20, 0.02);
      // Inverted discordant ST-T segment
      const twave = gaussian(beatTime, 0.52, -0.26, 0.08);

      const voltage = p + r1 + r2 + s + twave + wander(t) + noise();
      points.push({
        time: parseFloat(t.toFixed(3)),
        voltage: parseFloat(voltage.toFixed(4)),
        isRPeak: Math.abs(beatTime - 0.31) < dt / 2
      });
    }
  }

  return points;
}

export const DEMO_PRESETS = [
  {
    id: 'case_normal',
    name: 'Normal Sinus Rhythm (NSR)',
    type: 'normal',
    categoryCode: 'N',
    patient: {
      age: 48,
      gender: 'Male',
      heartRate: 75,
      rhythm: 'Regular Sinus',
      lead: 'Lead II (Bipolar Limb)',
      samplingRate: '250 Hz',
      qrsDuration: '88 ms',
      prInterval: '162 ms',
      qtInterval: '382 ms'
    },
    prediction: {
      primaryClass: 'Normal Beat (Class N)',
      aamiCode: 'N',
      confidence: 98.7,
      isDemo: true,
      riskLevel: 'Normal', // Normal, Low, Moderate, High
      probabilities: [
        { class: 'N (Normal)', prob: 98.7, code: 'N' },
        { class: 'S (Supraventricular)', prob: 0.7, code: 'S' },
        { class: 'V (Ventricular)', prob: 0.4, code: 'V' },
        { class: 'F (Fusion)', prob: 0.1, code: 'F' },
        { class: 'Q (Unclassified)', prob: 0.1, code: 'Q' }
      ],
      xaiExplanation: {
        summary: 'Synchronous P-wave preceding sharp narrow QRS complex (<100ms) with uniform R-R intervals of 800ms.',
        keyFeatures: [
          'Narrow QRS duration (88 ms, within normal reference < 120 ms)',
          'Uniform PR interval (162 ms) indicates intact AV nodal conduction',
          'Concordant, positive T-wave without ischemic ST deviation'
        ],
        attentionFocus: '1D-CNN temporal attention focused on standard isoelectric PR segment and symmetric narrow R-peak.'
      }
    },
    description: 'Reference ECG showing typical healthy cardiac electrophysiology with regular sinus rhythm.'
  },
  {
    id: 'case_pvc',
    name: 'Premature Ventricular Contraction (PVC)',
    type: 'pvc',
    categoryCode: 'V',
    patient: {
      age: 62,
      gender: 'Female',
      heartRate: 82,
      rhythm: 'Sinus with Frequent PVCs',
      lead: 'Lead II (Bipolar Limb)',
      samplingRate: '250 Hz',
      qrsDuration: '144 ms (Ectopic)',
      prInterval: 'Absent on ectopic beat',
      qtInterval: '448 ms'
    },
    prediction: {
      primaryClass: 'Ventricular Ectopic Beat (Class V)',
      aamiCode: 'V',
      confidence: 97.4,
      isDemo: true,
      riskLevel: 'Moderate',
      probabilities: [
        { class: 'N (Normal)', prob: 1.8, code: 'N' },
        { class: 'S (Supraventricular)', prob: 0.6, code: 'S' },
        { class: 'V (Ventricular)', prob: 97.4, code: 'V' },
        { class: 'F (Fusion)', prob: 0.1, code: 'F' },
        { class: 'Q (Unclassified)', prob: 0.1, code: 'Q' }
      ],
      xaiExplanation: {
        summary: 'Premature, bizarre, wide QRS morphology (>140ms) with discordant T-wave and complete compensatory pause.',
        keyFeatures: [
          'Significantly broadened QRS complex (144 ms) originating below bundle of His',
          'Absence of preceding atrial P-wave prior to ectopic impulse',
          'Discordant ST-segment elevation and inverted repolarization vector'
        ],
        attentionFocus: '1D-CNN filters heavily activated on deep prolonged negative S-wave deflection and post-extrasystolic pause.'
      }
    },
    description: 'Intermittent ectopic ventricular firing causing premature wide QRS morphology.'
  },
  {
    id: 'case_afib',
    name: 'Atrial Fibrillation (AFib)',
    type: 'afib',
    categoryCode: 'S',
    patient: {
      age: 73,
      gender: 'Male',
      heartRate: 114,
      rhythm: 'Irregularly Irregular',
      lead: 'Lead II (Bipolar Limb)',
      samplingRate: '250 Hz',
      qrsDuration: '92 ms',
      prInterval: 'Unmeasurable (no P wave)',
      qtInterval: '340 ms'
    },
    prediction: {
      primaryClass: 'Supraventricular Ectopic / Arrhythmia (Class S)',
      aamiCode: 'S',
      confidence: 94.6,
      isDemo: true,
      riskLevel: 'High',
      probabilities: [
        { class: 'N (Normal)', prob: 3.8, code: 'N' },
        { class: 'S (Supraventricular)', prob: 94.6, code: 'S' },
        { class: 'V (Ventricular)', prob: 1.1, code: 'V' },
        { class: 'F (Fusion)', prob: 0.3, code: 'F' },
        { class: 'Q (Unclassified)', prob: 0.2, code: 'Q' }
      ],
      xaiExplanation: {
        summary: 'Complete absence of distinct P waves with irregular chaotic baseline f-waves and random R-R interval spacing.',
        keyFeatures: [
          'Variable RR intervals (520ms - 860ms) demonstrating loss of organized sinus node pacing',
          'High-frequency baseline oscillation (6-9 Hz) indicative of disorganized atrial depolarization',
          'Narrow QRS duration indicates normal intraventricular conduction preserved'
        ],
        attentionFocus: '1D-CNN temporal receptive fields highlighted baseline variance in PR interval regions and stochastic peak spacing.'
      }
    },
    description: 'Most common sustained cardiac arrhythmia characterized by rapid, irregular atrial impulses.'
  },
  {
    id: 'case_svt',
    name: 'Supraventricular Tachycardia (SVT)',
    type: 'svt',
    categoryCode: 'S',
    patient: {
      age: 34,
      gender: 'Female',
      heartRate: 156,
      rhythm: 'Regular Narrow-Complex Tachycardia',
      lead: 'Lead II (Bipolar Limb)',
      samplingRate: '250 Hz',
      qrsDuration: '82 ms',
      prInterval: 'Obscured',
      qtInterval: '290 ms'
    },
    prediction: {
      primaryClass: 'Supraventricular Tachyarrhythmia (Class S)',
      aamiCode: 'S',
      confidence: 96.1,
      isDemo: true,
      riskLevel: 'Moderate',
      probabilities: [
        { class: 'N (Normal)', prob: 2.5, code: 'N' },
        { class: 'S (Supraventricular)', prob: 96.1, code: 'S' },
        { class: 'V (Ventricular)', prob: 0.9, code: 'V' },
        { class: 'F (Fusion)', prob: 0.3, code: 'F' },
        { class: 'Q (Unclassified)', prob: 0.2, code: 'Q' }
      ],
      xaiExplanation: {
        summary: 'Tachycardic regular rhythm (~156 BPM) with rapid narrow QRS complexes and retrograde or obscured P-waves.',
        keyFeatures: [
          'Accelerated ventricular rate exceeding 150 BPM with regular cycle length (~385 ms)',
          'Narrow QRS morphology confirms supraventricular origin above bifurcating bundle branches',
          'Shortened diastole leading to P-wave superposition onto preceding T-waves'
        ],
        attentionFocus: 'CNN multi-scale kernels detected high beat density and compressed isoelectric repolarization windows.'
      }
    },
    description: 'Rapid cardiac rhythm originating above the ventricles, causing sustained elevated heart rates.'
  },
  {
    id: 'case_lbbb',
    name: 'Left Bundle Branch Block (LBBB)',
    type: 'lbbb',
    categoryCode: 'N',
    patient: {
      age: 69,
      gender: 'Male',
      heartRate: 74,
      rhythm: 'Sinus with Intraventricular Conduction Delay',
      lead: 'Lead V5 / II',
      samplingRate: '250 Hz',
      qrsDuration: '138 ms',
      prInterval: '170 ms',
      qtInterval: '462 ms'
    },
    prediction: {
      primaryClass: 'Bundle Branch Block (Class N / Morphological Abnormality)',
      aamiCode: 'N',
      confidence: 95.3,
      isDemo: true,
      riskLevel: 'Moderate',
      probabilities: [
        { class: 'N (Normal / BBB)', prob: 95.3, code: 'N' },
        { class: 'S (Supraventricular)', prob: 1.2, code: 'S' },
        { class: 'V (Ventricular)', prob: 2.8, code: 'V' },
        { class: 'F (Fusion)', prob: 0.5, code: 'F' },
        { class: 'Q (Unclassified)', prob: 0.2, code: 'Q' }
      ],
      xaiExplanation: {
        summary: 'Broad, notched M-shaped R-wave with delayed intrinsicoid deflection and secondary ST-T repolarization abnormality.',
        keyFeatures: [
          'Prolonged QRS duration of 138 ms (pathologic cutoff > 120 ms)',
          'Broad slurred peak reflecting delayed trans-septal activation of left ventricle',
          'Discordant ST depression and T-wave inversion secondary to altered depolarization'
        ],
        attentionFocus: '1D-CNN temporal gradient maps show dominant feature weights on dual-peak R-wave vertex.'
      }
    },
    description: 'Conduction block in left bundle branch delaying left ventricular depolarization.'
  }
];

// Pre-generate waveform points for all presets to ensure instant responsiveness
DEMO_PRESETS.forEach(preset => {
  preset.points = generateWaveformPoints(preset.type, 10, 250);
});

export { generateWaveformPoints };
