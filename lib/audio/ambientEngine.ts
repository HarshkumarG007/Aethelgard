/**
 * Aethelgard Procedural Celestial Ambient Engine
 * Synthesizes a warm, low-frequency atmospheric sanctuary drone
 * entirely offline via the Web Audio API with zero external dependencies.
 */

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private analyser: AnalyserNode | null = null;
  private active = false;
  private currentVolume = 0.25;

  /**
   * Initializes and starts the celestial drone harmonic layers.
   */
  public async start(initialVolume = 0.25): Promise<void> {
    if (this.active) return;
    this.currentVolume = initialVolume;

    // Create or resume AudioContext
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser environment.");
    }

    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContextClass();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Master Gain Node (with soft initial silence for zero-pop attack)
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, initialVolume), now + 3.0);

    // 2. Analyser Node for Visual Waveforms
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect masterGain -> analyser -> destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // 3. Resonant Lowpass Filter (Celestial warmth)
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(420, now);
    this.filter.Q.setValueAtTime(2.5, now);
    this.filter.connect(this.masterGain);

    // 4. LFO (Low-Frequency Oscillator) for breathing celestial ocean tide
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(0.08, now); // ~12.5s gentle breath cycle

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(140, now); // Modulates filter between ~280Hz and ~560Hz

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start(now);

    // 5. Harmonic Drone Layers (Root, Fifth, Octave, Sub-octave)
    // C2 (65.41Hz), G2 (98.00Hz), C3 (130.81Hz), E3 (164.81Hz)
    const frequencies = [65.41, 98.0, 130.81, 164.81];
    const types: OscillatorType[] = ["triangle", "sine", "sine", "triangle"];
    const relativeGains = [0.35, 0.25, 0.2, 0.15];

    this.oscillators = [];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = types[idx];
      osc.frequency.setValueAtTime(freq, now);

      // Subtle micro-detuning for lush organic chorus
      const detuneCents = (idx % 2 === 0 ? 1 : -1) * (idx + 1) * 3;
      osc.detune.setValueAtTime(detuneCents, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(relativeGains[idx], now);

      osc.connect(oscGain);
      oscGain.connect(this.filter!);
      osc.start(now);

      this.oscillators.push(osc);
    });

    this.active = true;
  }

  /**
   * Smoothly ceases atmospheric drone playback.
   */
  public async stop(): Promise<void> {
    if (!this.active || !this.ctx || !this.masterGain) {
      this.active = false;
      return;
    }

    const now = this.ctx.currentTime;
    // Gentle 1.5s fade-out to silence
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Already stopped
        }
      });
      this.oscillators = [];

      if (this.lfo) {
        try {
          this.lfo.stop();
          this.lfo.disconnect();
        } catch {
          // Already stopped
        }
        this.lfo = null;
      }

      this.active = false;
    }, 1550);
  }

  /**
   * Adjusts volume smoothly.
   */
  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, this.currentVolume),
        now + 0.1
      );
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public isPlaying(): boolean {
    return this.active;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

// Global singleton instance for sanctuary session
export const ambientEngine = new AmbientSoundscapeEngine();
