// Synthesized WebAudio only: no audio files, no network. Engine hum
// follows speed, plus sirens, gunshots, blips, chimes and booms.
export function createAudio() {
  let ctx = null;
  let engineOsc = null; let engineGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineGain = ctx.createGain();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 60;
      engineGain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 500;
      engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch { return false; }
  }

  function blip(freq, dur, type, vol, slideTo) {
    if (muted || !ensure()) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* audio is best-effort */ }
  }

  function noise(dur, vol, lowFreq) {
    if (muted || !ensure()) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = lowFreq || 800;
      const g = ctx.createGain();
      g.gain.value = vol || 0.25;
      src.connect(filter); filter.connect(g); g.connect(ctx.destination);
      src.start();
    } catch { /* best-effort */ }
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    setMuted(m) { muted = m; if (engineGain) engineGain.gain.value = 0; },
    isMuted() { return muted; },
    engine(speed, maxSpeed) {
      if (!ensure() || muted || !engineGain) return;
      const ratio = Math.abs(speed) / Math.max(1, maxSpeed);
      engineOsc.frequency.value = 55 + ratio * 140;
      engineGain.gain.value = speed !== 0 ? 0.03 + ratio * 0.03 : 0.015;
    },
    engineOff() { if (engineGain) engineGain.gain.value = 0; },
    shot() { noise(0.12, 0.3, 3000); blip(220, 0.08, 'square', 0.15, 60); },
    punch() { noise(0.08, 0.2, 600); },
    hit() { blip(140, 0.15, 'sawtooth', 0.15, 70); },
    thud() { noise(0.15, 0.25, 400); },
    crash() { noise(0.3, 0.35, 500); },
    explosion() { noise(0.9, 0.5, 300); blip(60, 0.7, 'sine', 0.3, 30); },
    honk() { blip(370, 0.25, 'square', 0.08); blip(440, 0.25, 'square', 0.06); },
    siren() { blip(700, 0.5, 'sine', 0.07, 950); },
    pickup() { blip(660, 0.1, 'sine', 0.12); blip(990, 0.15, 'sine', 0.12); },
    mission() { blip(523, 0.12, 'sine', 0.12); blip(659, 0.12, 'sine', 0.12); blip(784, 0.25, 'sine', 0.12); },
    complete() { blip(523, 0.12, 'sine', 0.14); blip(659, 0.12, 'sine', 0.14); blip(784, 0.12, 'sine', 0.14); blip(1046, 0.3, 'sine', 0.14); },
    fail() { blip(400, 0.2, 'sawtooth', 0.1, 200); },
    steal() { blip(300, 0.1, 'square', 0.1, 500); },
    empty() { blip(180, 0.08, 'square', 0.08); },
    busted() { blip(500, 0.4, 'sawtooth', 0.12, 150); },
  };
}
