// WebAudio synth bleeps: every sound is built in code, no audio files.
// The context is created lazily on the first user gesture so headless loads
// and quiet browsers never throw.
let context = null;
let alarmNodes = null;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function blip(freq, seconds, type, volume, when = 0, slideTo = null) {
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  } catch {
    // Sound is garnish; a failed blip never breaks the game.
  }
}

export function playPickup() {
  blip(660, 0.09, 'sine', 0.16);
  blip(990, 0.14, 'sine', 0.16, 0.08);
}

export function playCoin() {
  blip(1560, 0.07, 'triangle', 0.14);
  blip(1180, 0.1, 'triangle', 0.1, 0.06);
}

export function playSmoke() {
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const dur = 0.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}

export function playEmp() {
  blip(880, 0.35, 'sawtooth', 0.1, 0, 110);
}

export function playSpotted() {
  blip(520, 0.12, 'square', 0.12);
  blip(520, 0.12, 'square', 0.12, 0.16);
}

export function playBusted() {
  blip(220, 0.5, 'sawtooth', 0.16, 0, 55);
}

export function playEscape() {
  [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.18, 'sine', 0.16, i * 0.11));
}

export function startAlarmHum() {
  const ctx = ensureContext();
  if (!ctx || alarmNodes) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 98;
    gain.gain.value = 0.0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    alarmNodes = { osc, gain };
  } catch {
    alarmNodes = null;
  }
}

export function setAlarmHum(on) {
  if (!alarmNodes) return;
  try {
    alarmNodes.gain.gain.setTargetAtTime(on ? 0.035 : 0.0, context.currentTime, 0.1);
  } catch {
    // ignore
  }
}

export function stopAlarmHum() {
  if (!alarmNodes) return;
  try {
    alarmNodes.osc.stop();
  } catch {
    // ignore
  }
  alarmNodes = null;
}
