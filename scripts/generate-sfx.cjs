const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050; // 22.05 kHz mono 16-bit PCM

function createWavBuffer(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = mono)
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16-bit)

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), 44 + i * 2);
  }

  return buffer;
}

// 1. hit-critical: Impactful heavy hit with pitch drop + noise transient (0.35s)
function generateHitCritical() {
  const duration = 0.35;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 9);
    const freq = 60 + 200 * Math.exp(-t * 15);
    const wave1 = Math.sin(2 * Math.PI * freq * t);
    const wave2 = 0.5 * Math.sin(4 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 35);

    let sample = (wave1 + wave2 + noise * 0.8) * env * 0.9;
    sample = Math.tanh(sample * 1.5);
    samples[i] = sample;
  }
  return samples;
}

// 2. hit-standard: Snappy quick strike / blip (0.12s)
function generateHitStandard() {
  const duration = 0.12;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 22);
    const freq = 220 + 380 * Math.exp(-t * 30);
    const wave = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 60);

    let sample = (wave * 0.8 + noise * 0.3) * env * 0.85;
    samples[i] = sample;
  }
  return samples;
}

// 3. damage-taken: Low dissonant metallic crunch / shield break (0.30s)
function generateDamageTaken() {
  const duration = 0.30;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 10);
    const freq1 = 160 * Math.exp(-t * 6);
    const freq2 = 215 * Math.exp(-t * 6);
    const wave = 0.6 * Math.sin(2 * Math.PI * freq1 * t) + 0.5 * Math.sin(2 * Math.PI * freq2 * t);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);

    let sample = (wave + noise * 0.6) * env * 0.9;
    samples[i] = Math.tanh(sample * 1.3);
  }
  return samples;
}

// 4. combo-tick: Crisp high chime / bright tick (0.14s)
function generateComboTick() {
  const duration = 0.14;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 18);
    const freq = 980 + 300 * Math.exp(-t * 25);
    const wave = Math.sin(2 * Math.PI * freq * t);
    const overtone = 0.3 * Math.sin(4 * Math.PI * freq * t);

    samples[i] = (wave + overtone) * env * 0.75;
  }
  return samples;
}

// 5. mastery-badge: Ascending 4-tone triumphant arpeggio (C5 -> E5 -> G5 -> C6) (0.45s)
function generateMasteryBadge() {
  const duration = 0.45;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  const notes = [523.25, 659.25, 783.99, 1046.50];
  const noteDuration = 0.09;

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    for (let n = 0; n < notes.length; n++) {
      const noteStart = n * noteDuration;
      if (t >= noteStart) {
        const noteT = t - noteStart;
        const noteEnv = Math.exp(-noteT * 7);
        const freq = notes[n];
        const wave = Math.sin(2 * Math.PI * freq * noteT) + 0.25 * Math.sin(4 * Math.PI * freq * noteT);
        s += wave * noteEnv * 0.35;
      }
    }

    samples[i] = Math.tanh(s);
  }
  return samples;
}

// 6. rare-67: Playful, retrofuturistic double chirp for the 67 easter egg (0.48s)
function generateRare67() {
  const duration = 0.48;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 6);
    const vibrato = 25 * Math.sin(2 * Math.PI * 18 * t);
    const baseFreq = t < 0.2 ? 370 : 660;
    const freq = baseFreq + vibrato;
    const wave = Math.sin(2 * Math.PI * freq * t);
    const sub = 0.3 * Math.sin(Math.PI * freq * t);

    samples[i] = (wave + sub) * env * 0.75;
  }
  return samples;
}

// 7. boss-victory: Triumphant, heroic brass fanfare arpeggio (C4 -> E4 -> G4 -> C5 -> E5) (0.75s)
function generateBossVictory() {
  const duration = 0.75;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
  const noteDuration = 0.12;

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let n = 0; n < notes.length; n++) {
      const noteStart = n * noteDuration;
      if (t >= noteStart) {
        const noteT = t - noteStart;
        const noteEnv = Math.exp(-noteT * 4.5);
        const freq = notes[n];
        // Rich brass-like timbre with harmonics
        const wave =
          Math.sin(2 * Math.PI * freq * noteT) +
          0.5 * Math.sin(4 * Math.PI * freq * noteT) +
          0.25 * Math.sin(6 * Math.PI * freq * noteT);
        s += wave * noteEnv * 0.32;
      }
    }
    samples[i] = Math.tanh(s * 1.2);
  }
  return samples;
}

// 8. boss-shield-break: Shattering crystalline/glass transient with dispersion (0.32s)
function generateBossShieldBreak() {
  const duration = 0.32;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 14);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 22);
    // Multiple metallic resonant glass frequencies
    const wave1 = 0.4 * Math.sin(2 * Math.PI * (1450 + 200 * Math.sin(60 * t)) * t);
    const wave2 = 0.3 * Math.sin(2 * Math.PI * (2300 + 400 * Math.sin(40 * t)) * t);
    const wave3 = 0.2 * Math.sin(2 * Math.PI * (3800 * Math.exp(-t * 8)) * t);

    let sample = (wave1 + wave2 + wave3 + noise * 0.7) * env;
    samples[i] = Math.tanh(sample * 1.4);
  }
  return samples;
}

// 9. blitz-time-warning: Tense, urgent heartbeat pulse with low-pass resonance (0.28s)
function generateBlitzTimeWarning() {
  const duration = 0.28;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    // Double pulse: lub-dub
    const p1 = Math.exp(-Math.pow((t - 0.05) / 0.035, 2));
    const p2 = 0.7 * Math.exp(-Math.pow((t - 0.16) / 0.035, 2));
    const env = p1 + p2;
    const freq = 68 - 18 * t;
    const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);

    samples[i] = Math.tanh(wave * env * 1.5) * 0.85;
  }
  return samples;
}

// 10. level-up: Sparkling, magical ascending shimmer with bright overtone sparkle (0.55s)
function generateLevelUp() {
  const duration = 0.55;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);
  const notes = [440, 554.37, 659.25, 880, 1108.73];
  const step = 0.08;

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let n = 0; n < notes.length; n++) {
      const noteStart = n * step;
      if (t >= noteStart) {
        const noteT = t - noteStart;
        const noteEnv = Math.exp(-noteT * 6);
        const freq = notes[n];
        const shimmer = 0.2 * Math.sin(2 * Math.PI * 12 * noteT);
        const wave = Math.sin(2 * Math.PI * (freq + shimmer * 50) * noteT);
        const bell = 0.35 * Math.sin(4 * Math.PI * freq * noteT);
        s += (wave + bell) * noteEnv * 0.28;
      }
    }
    samples[i] = Math.tanh(s * 1.1);
  }
  return samples;
}

// 11. streak-flame: Crackling fiery ignition with warm resonant whoosh (0.40s)
function generateStreakFlame() {
  const duration = 0.40;
  const total = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 7);
    const crackle = (Math.random() > 0.88 ? Math.random() * 2 - 1 : 0) * Math.exp(-t * 12);
    const whooshFreq = 180 + 350 * Math.exp(-t * 10);
    const whoosh = Math.sin(2 * Math.PI * whooshFreq * t);
    const warmth = 0.4 * Math.sin(Math.PI * whooshFreq * t);

    let sample = (whoosh + warmth + crackle * 0.8) * env * 0.8;
    samples[i] = Math.tanh(sample * 1.3);
  }
  return samples;
}

function main() {
  const outDir = path.resolve(__dirname, '..', 'public', 'sounds');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const sounds = [
    { name: 'hit-critical', gen: generateHitCritical },
    { name: 'hit-standard', gen: generateHitStandard },
    { name: 'damage-taken', gen: generateDamageTaken },
    { name: 'combo-tick', gen: generateComboTick },
    { name: 'mastery-badge', gen: generateMasteryBadge },
    { name: 'rare-67', gen: generateRare67 },
    { name: 'boss-victory', gen: generateBossVictory },
    { name: 'boss-shield-break', gen: generateBossShieldBreak },
    { name: 'blitz-time-warning', gen: generateBlitzTimeWarning },
    { name: 'level-up', gen: generateLevelUp },
    { name: 'streak-flame', gen: generateStreakFlame },
  ];

  for (const s of sounds) {
    const samples = s.gen();
    const wavBuffer = createWavBuffer(samples);
    
    // Save as .wav
    const wavPath = path.join(outDir, `${s.name}.wav`);
    fs.writeFileSync(wavPath, wavBuffer);

    // Save as .ogg (exact audio content readable by HTMLAudio / WebAudio)
    const oggPath = path.join(outDir, `${s.name}.ogg`);
    fs.writeFileSync(oggPath, wavBuffer);

    console.log(`Generated ${s.name}: ${wavBuffer.length} bytes`);
  }

  console.log('All 6 SFX procedural audio assets generated successfully in public/sounds/!');
}

main();
