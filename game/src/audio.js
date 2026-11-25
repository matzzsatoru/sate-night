// audio.js — all sound is synthesized with WebAudio. No audio files, no network.
// One job: tiny sound effects for chopping, sizzling, serving and alarms.

export function createAudio() {
  let ctx = null;
  let sizzleGain = null;
  let sizzleSrc = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      } catch (err) {
        return null;
      }
      // Sizzle: looped filtered noise, gain follows the grill load.
      const len = ctx.sampleRate * 1;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      sizzleSrc = ctx.createBufferSource();
      sizzleSrc.buffer = buf;
      sizzleSrc.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5200;
      filter.Q.value = 0.6;
      sizzleGain = ctx.createGain();
      sizzleGain.gain.value = 0;
      sizzleSrc.connect(filter).connect(sizzleGain).connect(ctx.destination);
      sizzleSrc.start();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.16, when = 0, slideTo = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noiseBurst(dur, vol = 0.2, freq = 1800) {
    const c = ensure();
    if (!c || muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    src.connect(f).connect(c.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    setMuted(m) { muted = m; if (sizzleGain) sizzleGain.gain.value = 0; },
    isMuted() { return muted; },
    setSizzle(level) {
      if (!sizzleGain || muted) return;
      sizzleGain.gain.setTargetAtTime(Math.min(0.05, level * 0.02), ctx.currentTime, 0.1);
    },
    take() { tone(520, 0.07, 'square', 0.08); tone(780, 0.06, 'square', 0.06, 0.05); },
    place() { noiseBurst(0.08, 0.14, 900); tone(220, 0.08, 'triangle', 0.1); },
    assemble() { tone(660, 0.08, 'triangle', 0.12); tone(880, 0.1, 'triangle', 0.12, 0.07); },
    ready() { tone(880, 0.12, 'sine', 0.16); tone(1174, 0.16, 'sine', 0.16, 0.1); tone(1568, 0.2, 'sine', 0.12, 0.2); },
    serve() { tone(1046, 0.14, 'sine', 0.18); tone(1568, 0.22, 'sine', 0.16, 0.1); noiseBurst(0.1, 0.1, 3200); },
    error() { tone(140, 0.16, 'sawtooth', 0.1, 0, 90); },
    ticket() { tone(740, 0.09, 'triangle', 0.09); tone(988, 0.09, 'triangle', 0.09, 0.08); },
    expire() { tone(330, 0.2, 'sawtooth', 0.1, 0, 180); tone(220, 0.25, 'sawtooth', 0.1, 0.15, 110); },
    rush() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.08, i * 0.09)); },
    fan() { noiseBurst(0.35, 0.16, 500); },
    bin() { noiseBurst(0.12, 0.14, 300); tone(180, 0.1, 'triangle', 0.08, 0, 120); },
    click() { tone(600, 0.05, 'square', 0.06); },
  };
}
