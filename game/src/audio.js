// Tiny synthesised sound effects (WebAudio, no audio files).
// Every sound is built from oscillators and filtered noise at run time,
// so the game ships no sound assets at all.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, gain = 0.08, lowpass = 1200) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  chop() { this.noise(0.07, 0.15, 900); this.tone(180, 0.06, 'triangle', 0.1, 90); }
  pickup() { this.tone(520, 0.07, 'sine', 0.08, 700); }
  place() { this.tone(300, 0.08, 'triangle', 0.1, 220); }
  sizzle() { this.noise(0.35, 0.05, 4000); }
  ding() { this.tone(880, 0.25, 'sine', 0.12); this.tone(1318, 0.3, 'sine', 0.07); }
  serve() { this.tone(660, 0.1, 'sine', 0.1); setTimeout(() => this.tone(990, 0.18, 'sine', 0.1), 90); }
  bad() { this.tone(220, 0.25, 'sawtooth', 0.07, 110); }
  burn() { this.tone(160, 0.4, 'sawtooth', 0.09, 70); this.noise(0.3, 0.06, 500); }
  click() { this.tone(700, 0.04, 'square', 0.05); }
  start() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'sine', 0.1), i * 110)); }
}
