// Sound from oscillators alone — no audio files. A low engine hum whose
// pitch follows the throttle, a bright chime for a gate, a thud for a hit.
// Created lazily on the first user gesture, as browsers require.

export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 62;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0.0;
      engineOsc.connect(filter).connect(engineGain).connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur);
  }

  return {
    start() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    engine(throttle, speed) {
      if (!ctx || !engineOsc) return;
      engineOsc.frequency.value = 48 + throttle * 58 + speed * 0.22;
      engineGain.gain.value = 0.028 + throttle * 0.03;
    },
    mute() { if (engineGain) engineGain.gain.value = 0; },
    gate() { blip(880, 0.16, 'sine', 0.16); blip(1318, 0.22, 'sine', 0.14, 0.07); },
    cargo() { blip(523, 0.14, 'triangle', 0.18); blip(784, 0.2, 'triangle', 0.16, 0.09); },
    warn() { blip(196, 0.18, 'square', 0.1); },
    hit() { blip(82, 0.3, 'sawtooth', 0.22); },
    landed() { blip(392, 0.2, 'sine', 0.16); blip(523, 0.2, 'sine', 0.16, 0.14); blip(659, 0.34, 'sine', 0.16, 0.28); },
  };
}
