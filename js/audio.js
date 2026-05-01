// Procedural audio using Web Audio API — no external files needed
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.18;
    this.musicGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.4;
    this.sfxGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // === SOUND EFFECTS ===

  playBang() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Gunshot: short noise burst + low thump
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass for gunshot character
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.15);

    // Low thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0.5, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(thumpGain);
    thumpGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playSplat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05; // slight delay after bang

    // Wet splat: filtered noise with pitch drop
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.15));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Low-pass filter that drops for wet sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.3);

    // Squelch tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playHit() {
    this.playBang();
    this.playSplat();
  }

  playMiss() {
    this.playBang();
  }

  // === BACKGROUND MUSIC ===
  // Fun upbeat loop using oscillators

  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.scheduleMusic();
  }

  scheduleMusic() {
    if (!this.musicPlaying) return;

    const t = this.ctx.currentTime;
    const bpm = 140;
    const beat = 60 / bpm;

    // Cheerful melody in C major pentatonic
    const melody = [
      523, 587, 659, 784, 659, 587, 523, 440,
      523, 659, 784, 880, 784, 659, 523, 587,
      440, 523, 587, 659, 523, 440, 392, 440,
      523, 587, 659, 523, 784, 659, 587, 523,
    ];

    // Bass line
    const bass = [
      131, 131, 165, 165, 175, 175, 131, 131,
      131, 131, 165, 165, 196, 196, 175, 175,
      110, 110, 131, 131, 165, 165, 131, 131,
      131, 131, 165, 165, 175, 175, 131, 131,
    ];

    const loopDuration = melody.length * beat;

    // Melody
    for (let i = 0; i < melody.length; i++) {
      const noteTime = t + i * beat;
      this.playNote(melody[i], noteTime, beat * 0.7, 'triangle', 0.12);
    }

    // Bass
    for (let i = 0; i < bass.length; i++) {
      const noteTime = t + i * beat;
      this.playNote(bass[i], noteTime, beat * 0.9, 'sine', 0.15);
    }

    // Hi-hat rhythm
    for (let i = 0; i < melody.length; i++) {
      this.playHiHat(t + i * beat, beat);
      if (i % 2 === 1) {
        this.playHiHat(t + i * beat + beat * 0.5, beat);
      }
    }

    // Kick on beats 1 and 3
    for (let i = 0; i < melody.length; i += 2) {
      this.playKick(t + i * beat);
    }

    // Schedule next loop
    setTimeout(() => this.scheduleMusic(), (loopDuration - 0.1) * 1000);
  }

  playNote(freq, time, duration, type, volume) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.setValueAtTime(volume, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  playHiHat(time, beat) {
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.05);
  }

  playKick(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  stopMusic() {
    this.musicPlaying = false;
  }
}
