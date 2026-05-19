export class AudioEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
  trackFilter: BiquadFilterNode;
  
  bassOsc: OscillatorNode | null = null;
  bassGain: GainNode | null = null;
  bassFilter: BiquadFilterNode | null = null;
  
  // Intrinsic Bassline Hum (The "Voice and Soul")
  humOsc: OscillatorNode | null = null;
  humGain: GainNode | null = null;
  humFilter: BiquadFilterNode | null = null;
  
  padOsc1: OscillatorNode | null = null;
  padOsc2: OscillatorNode | null = null;
  padGain: GainNode | null = null;
  currentBaseFreq: number = 55;
  lastFreq: number = 55;
  
  // Track Pitch Shifting
  trackPlaybackRate: number = 1.0;
  currentTrackPlaybackRate: number = 1.0;
  currentSpeed: number = 0;
  currentDy: number = 0;

  customTrackSource: AudioBufferSourceNode | null = null;
  customAudioBuffer: AudioBuffer | null = null;
  hasCustomTrack: boolean = false;
  trackStartTime: number = 0;
  trackOffset: number = 0;
  trackDuration: number = 0;
  detectedBeat: number = 500; // Default 500ms beat
  beatOffset: number = 0; // Beat offset in seconds
  
  accumulatedAudioTime: number = 0;
  lastUpdateTime: number = 0;

  isPlaying: boolean = false;
  isPenalty: boolean = false;
  private lastSwingTime = 0;
  private spikeStartTime = 0;
  private spikeValue = 0;
  
  ambientGain: GainNode | null = null;
  ambientSource: AudioBufferSourceNode | null = null;
  
  static clashPoints = [21.7, 25.4, 27.2, 29.0, 32.7, 34.6, 35.5, 51.2, 54.9, 56.7, 58.6, 62.3, 64.1, 66.0, 69.7, 71.5, 73.4, 77.0, 78.9, 84.4, 86.3, 88.1, 91.8, 93.7, 94.6];
  clashBuffers: AudioBuffer[] = [];
  clashMoments: number[] = [];
  tapMoments: number[] = [];
  basslineSequence: number[] = [];
  currentBassTarget: number = 55.0;
  pitchShift: number = 1.0;
  rotationPitchShift: number = 1.0;
  minPitch: number = 0.5;
  maxPitch: number = 1.5;
  
  clashHitCount: number = 0;
  
  manualPitch: number = 1.0;
  isHumiliated: boolean = false;
  humiliationTimer: number = 0;
  
  private initId: number = 0;
  
  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128; // Small size for punchy visual updates
    
    this.trackFilter = this.ctx.createBiquadFilter();
    this.trackFilter.type = 'lowpass';
    this.trackFilter.frequency.value = 20000;
    this.trackFilter.connect(this.masterGain);
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    
    this.loadClashSounds();
    this.setupAmbient();
  }

  async loadClashSounds() {
    const urls = [
      "https://www.dropbox.com/scl/fi/ar2u57rawo2amqqaq2lzu/Clash-Boom-1.mp3?rlkey=nx3ynl8jyahr1mhdqwn4pqhu3&dl=1",
      "https://www.dropbox.com/scl/fi/8sxh5vh9vib8xn1harn0n/Clash-Boom-2.mp3?rlkey=1eymyc6555bp8jr44ibhulm77&dl=1",
      "https://www.dropbox.com/scl/fi/rfbw0gn0ej87qyuaa5r3p/Clash-Boom-3.mp3?rlkey=n9watyp38k5oiec32x393xgft&dl=1",
      "https://www.dropbox.com/scl/fi/bxdsxju6b0mzxaix7m033/Clash-Boom-4.mp3?rlkey=ihwx59woku1h1ftw5qo1wgis3&dl=1",
      "https://www.dropbox.com/scl/fi/dmainjfdayp5r5ax1wje4/KICK-BASS-2.wav?rlkey=jz5pibiljboqmw0k86gwmpz49&st=cvaj5b21&dl=1",
      "https://www.dropbox.com/scl/fi/n5rmpas7k8ftal8uwe65g/808-By-JV-6.wav?rlkey=60zvggfxcdsdj979dh6k47q60&st=oupz9un9&dl=1"
    ];
    
    for (const url of urls) {
      try {
        const finalUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        const res = await fetch(finalUrl);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.clashBuffers.push(audioBuffer);
      } catch (e) {
        console.error("Failed to load clash sound:", url, e);
      }
    }
  }

  async setupAmbient() {
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.0195; // 20% of previous
    this.ambientGain.connect(this.masterGain);
    
    try {
      const url = "https://www.dropbox.com/scl/fi/eqifuhiocj3zo2z44z7wk/Arena-Crowd-SFX.mp3?rlkey=6l59skrdq7isfcl1ehykmjcqn&st=eq1gz1vq&dl=1";
      const res = await fetch(url.replace('www.dropbox.com', 'dl.dropboxusercontent.com'));
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      
      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = audioBuffer;
      this.ambientSource.loop = true;
      this.ambientSource.connect(this.ambientGain);
      this.ambientSource.start();
    } catch (e) {
      console.error("Failed to load ambient crowd SFX, falling back to noise:", e);
      // Fallback to noise if fetch fails
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        let val = Math.random() * 0.5;
        const cheer = Math.sin(t * Math.PI * 0.5) * Math.sin(t * Math.PI * 2);
        val += Math.max(0, cheer) * Math.random() * 0.5;
        data[i] = val * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 1;
      noise.connect(filter);
      filter.connect(this.ambientGain);
      noise.start();
    }
  }

  setAmbientIntensity(momentum: number) {
    if (!this.ambientGain || !isFinite(momentum) || !isFinite(this.ctx.currentTime)) return;
    // Momentum 0-100. Target gain range 0.013 to 0.052 (20% of previous)
    const targetGain = Math.max(0.013, Math.min(0.052, 0.013 + (momentum / 100) * 0.039));
    this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
  }

  getAudioData(dataArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }
  }

  getElapsedTime(): number {
    if (!this.hasCustomTrack || !this.isPlaying || this.trackDuration === 0) return 0;
    return this.accumulatedAudioTime % this.trackDuration;
  }

  getNextClash(): number | null {
    if (!this.hasCustomTrack || !this.isPlaying || this.clashMoments.length === 0) return null;
    const elapsed = this.getElapsedTime();
    for (let i = 0; i < this.clashMoments.length; i++) {
      if (this.clashMoments[i] > elapsed) {
        return this.clashMoments[i];
      }
    }
    return this.clashMoments[0];
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.customTrackSource) {
      try {
        this.customTrackSource.stop();
        this.customTrackSource.disconnect();
      } catch (e) {
        console.warn("Error stopping custom track:", e);
      }
      this.customTrackSource = null;
    }
    if (this.padOsc1) {
      try { this.padOsc1.stop(); this.padOsc1.disconnect(); } catch (e) {}
      this.padOsc1 = null;
    }
    if (this.padOsc2) {
      try { this.padOsc2.stop(); this.padOsc2.disconnect(); } catch (e) {}
      this.padOsc2 = null;
    }
    if (this.bassOsc) {
      try { this.bassOsc.stop(); this.bassOsc.disconnect(); } catch (e) {}
      this.bassOsc = null;
    }
    if (this.humOsc) {
      try { this.humOsc.stop(); this.humOsc.disconnect(); } catch (e) {}
      this.humOsc = null;
    }
    if (this.humGain) {
      try { this.humGain.disconnect(); } catch (e) {}
      this.humGain = null;
    }
    if (this.humFilter) {
      try { this.humFilter.disconnect(); } catch (e) {}
      this.humFilter = null;
    }
  }

  async init(customAudioUrl?: string | null, onAnalysisProgress?: (progress: number) => void) {
    const currentInitId = ++this.initId;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.isPlaying) this.stop();
    this.isPlaying = true;

    if (customAudioUrl) {
      this.hasCustomTrack = true;
      try {
        // Handle Dropbox links specifically for direct access
        let finalUrl = customAudioUrl;
        if (finalUrl.includes('dropbox.com')) {
          finalUrl = finalUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
          finalUrl = finalUrl.replace('dl=0', 'dl=1');
          if (!finalUrl.includes('dl=1') && !finalUrl.includes('raw=1')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'dl=1';
          }
        }

        console.log("Fetching audio from:", finalUrl);
        if (onAnalysisProgress) onAnalysisProgress(0.1); // Fetching
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (currentInitId !== this.initId) return;
        
        if (onAnalysisProgress) onAnalysisProgress(0.3); // Decoding
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        if (currentInitId !== this.initId) return;
        this.customAudioBuffer = audioBuffer;
        this.trackDuration = audioBuffer.duration;
        
        if (onAnalysisProgress) onAnalysisProgress(0.5); // Analyzing
        
        // Analyze track for BPM/Peaks and TRUE CLASH MOMENTS
        const analysis = await this.analyzeTrackDeep(audioBuffer, onAnalysisProgress);
        if (currentInitId !== this.initId) return;
        this.detectedBeat = analysis.beatInterval;
        this.beatOffset = analysis.beatOffset;
        this.clashMoments = analysis.clashMoments;
        this.tapMoments = analysis.tapMoments;
        this.basslineSequence = analysis.basslineSequence;
        console.log("Analysis complete - Beat:", this.detectedBeat, "Offset:", this.beatOffset, "Clashes:", this.clashMoments.length, "Taps:", this.tapMoments.length);

        this.customTrackSource = this.ctx.createBufferSource();
        this.customTrackSource.buffer = audioBuffer;
        this.customTrackSource.loop = true;
        this.currentTrackPlaybackRate = this.trackPlaybackRate;
        this.customTrackSource.playbackRate.value = this.trackPlaybackRate;
        
        // Lower the volume of the backing track slightly so the bassline cuts through
        const trackGain = this.ctx.createGain();
        trackGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        
        this.customTrackSource.connect(trackGain);
        trackGain.connect(this.trackFilter);
        
        this.trackStartTime = this.ctx.currentTime;
        this.lastUpdateTime = this.ctx.currentTime;
        this.customTrackSource.start();
        console.log("Custom track started successfully");
      } catch (e) {
        console.error("Error loading custom track, falling back to synth", e);
        this.hasCustomTrack = false;
        this.startPad();
        this.startDrums();
      }
    } else {
      this.startPad();
      this.startDrums();
    }

    this.startBass();
  }

  startPad() {
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padGain = this.ctx.createGain();
    
    this.padOsc1.type = 'sine';
    this.padOsc2.type = 'triangle';
    
    this.padOsc1.connect(this.padGain);
    this.padOsc2.connect(this.padGain);
    this.padGain.connect(this.masterGain);
    
    this.padGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    
    this.padOsc1.start();
    this.padOsc2.start();
  }

  startDrums() {
    let nextNoteTime = this.ctx.currentTime + 0.1;
    const schedule = () => {
      if (!this.isPlaying || this.hasCustomTrack) return;
      
      const now = this.ctx.currentTime;
      const loopTime = now % 8.0;
      let f1 = 55, f2 = 55 * 1.5;
      if (loopTime < 2.0) { f1 = 55.00; f2 = 55.00 * 1.5; } // A
      else if (loopTime < 4.0) { f1 = 43.65; f2 = 43.65 * 1.5; } // F
      else if (loopTime < 6.0) { f1 = 65.41; f2 = 65.41 * 1.25; } // C
      else { f1 = 49.00; f2 = 49.00 * 1.5; } // G
      
      if (this.padOsc1 && this.padOsc2) {
        const safeF1 = isFinite(f1) ? f1 : 55.0;
        const safeF2 = isFinite(f2) ? f2 : 55.0;
        if (!isFinite(now)) return;
        this.padOsc1.frequency.setTargetAtTime(safeF1 * 2, now, 0.1);
        this.padOsc2.frequency.setTargetAtTime(safeF2 * 2, now, 0.1);
      }

      while (nextNoteTime < this.ctx.currentTime + 0.1) {
        if (!this.isPenalty) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.frequency.setValueAtTime(150, nextNoteTime);
          osc.frequency.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
          gain.gain.setValueAtTime(1, nextNoteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
          osc.start(nextNoteTime);
          osc.stop(nextNoteTime + 0.5);
        }
        nextNoteTime += 0.5;
      }
      requestAnimationFrame(schedule);
    };
    schedule();
  }

  startBass() {
    // Standard Bass (Existing)
    this.bassOsc = this.ctx.createOscillator();
    this.bassOsc.type = 'sawtooth';
    this.bassOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.bassOsc.connect(this.bassFilter);
    this.bassFilter.connect(this.bassGain);
    this.bassGain.connect(this.masterGain);
    this.bassOsc.start();

    // Intrinsic Hum (The "Voice and Soul")
    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'triangle'; // Richer than sine
    this.humOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // Start at 110Hz (A2) for better audibility
    this.humFilter = this.ctx.createBiquadFilter();
    this.humFilter.type = 'lowpass';
    this.humFilter.frequency.setValueAtTime(400, this.ctx.currentTime); // Higher cutoff for more presence
    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(1, this.ctx.currentTime); // Lowered base volume by 75%
    this.humOsc.connect(this.humFilter);
    this.humFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain);
    this.humOsc.start();
  }

  resetTrack() {
    if (this.customTrackSource && this.customAudioBuffer) {
      this.customTrackSource.stop();
      this.customTrackSource.disconnect();
      
      this.customTrackSource = this.ctx.createBufferSource();
      this.customTrackSource.buffer = this.customAudioBuffer;
      this.customTrackSource.loop = true;
      this.currentTrackPlaybackRate = this.trackPlaybackRate;
      this.customTrackSource.playbackRate.value = this.trackPlaybackRate;
      
      const trackGain = this.ctx.createGain();
      trackGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      
      this.customTrackSource.connect(trackGain);
      trackGain.connect(this.trackFilter);
      
      this.trackStartTime = this.ctx.currentTime;
      this.customTrackSource.start();
    }
  }

  setTrackPitch(momentum: number, combo: number = 0) {
    if (!this.customTrackSource) return;
    
    // Base rate from momentum (0.99x to 1.01x)
    // 50 momentum = 1.0x speed
    let targetRate = 0.98 + (momentum / 100) * 0.04;
    
    // Add bonus for combo (+2% per combo, up to +10%)
    if (combo > 0) {
      const comboBonus = Math.min(0.10, combo * 0.02);
      targetRate += comboBonus;
    }

    // Clamp to a reasonable range (0.95 to 1.12)
    targetRate = Math.max(0.95, Math.min(1.12, targetRate));

    const now = this.ctx.currentTime;
    this.trackPlaybackRate = targetRate; // Store target base rate
    // We no longer use linearRampToValueAtTime here because update()
    // constantly overrides the playbackRate. Instead, we'll interpolate
    // currentTrackPlaybackRate towards trackPlaybackRate in update().
  }

  updateComplimentaryBassline() {
    if (!this.hasCustomTrack || !this.isPlaying || this.clashMoments.length === 0) return;
    
    const elapsed = this.getElapsedTime();
    
    // Find the next clash moment
    let nextClashIdx = this.clashMoments.findIndex(t => t > elapsed);
    if (nextClashIdx === -1) nextClashIdx = 0; // Loop back
    
    // The target bass note is the one associated with the upcoming clash
    if (this.basslineSequence && this.basslineSequence.length > nextClashIdx) {
      const target = this.basslineSequence[nextClashIdx];
      if (isFinite(target)) {
        this.currentBassTarget = target;
      } else {
        this.currentBassTarget = 55.0; // Fallback
      }
    } else {
      this.currentBassTarget = 55.0; // Fallback
    }
  }

  setChargeState(isCharging: boolean) {
    if (!this.bassGain || !this.bassOsc || !this.bassFilter || !this.humGain || !this.humOsc) return;
    const now = this.ctx.currentTime;
    
    this.updateComplimentaryBassline();
    
    this.bassGain.gain.cancelScheduledValues(now);
    this.humGain.gain.cancelScheduledValues(now);
    
    if (isCharging && !this.isPenalty) {
      // 50% user control (lastFreq), 50% automatic readjustment to complimentary bassline
      const safeLastFreq = isFinite(this.lastFreq) ? this.lastFreq : 55.0;
      const safeTarget = isFinite(this.currentBassTarget) ? this.currentBassTarget : 55.0;
      
      this.currentBaseFreq = (safeLastFreq * 0.5) + (safeTarget * 0.5);
      this.currentBaseFreq = Math.max(30, Math.min(600, this.currentBaseFreq));
      if (!isFinite(this.currentBaseFreq)) this.currentBaseFreq = 55.0;
      
      const finalFreq = this.currentBaseFreq * this.rotationPitchShift;
      
      this.bassOsc.frequency.setValueAtTime(finalFreq, now);
      this.bassGain.gain.linearRampToValueAtTime(1.05, now + 0.1);
      
      // Hum reacts to charging - Raise frequency to be more audible (1 octave up from base)
      this.humOsc.frequency.setTargetAtTime(finalFreq * 2, now, 0.1);
      this.humGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    } else {
      // Sustain slightly, glide back to current target
      this.bassGain.gain.linearRampToValueAtTime(0.42, now + 0.2);
      
      // Ensure target is finite before setting
      const safeTarget = isFinite(this.currentBassTarget) ? this.currentBassTarget : 55.0;
      
      this.currentBaseFreq = safeTarget;
      this.lastFreq = safeTarget;
      
      const finalFreq = safeTarget * this.rotationPitchShift;
      
      this.bassOsc.frequency.setTargetAtTime(finalFreq, now, 0.5);
      this.bassFilter.frequency.setTargetAtTime(200, now, 0.5);
      
      // Hum glides back to idle - Raise frequency to be more audible
      this.humOsc.frequency.setTargetAtTime(finalFreq * 2, now, 0.5);
      this.humGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    }
  }

  lastUpdateSpeedTime: number = 0;

  setSwingMotion(speed: number, dy: number = 0, isVoltaMode: boolean = false, dx: number = 0) {
    if (!this.bassOsc || !this.bassFilter || !this.humOsc || !this.humFilter || this.isPenalty) return;
    const now = this.ctx.currentTime;
    
    // Spike logic
    const threshold = 10; 
    if (speed > threshold && now - this.lastSwingTime > 0.5) {
        this.lastSwingTime = now;
        this.spikeStartTime = now;
        this.spikeValue = dy < 0 ? 0.015 : -0.015; 
    }
    
    this.updateComplimentaryBassline();
    
    // In Volta mode, speed has a much larger effect on frequency
    const speedFactor = isVoltaMode ? speed / 7.5 : speed / 20;
    const multiplier = 1.0 + Math.min(speedFactor, isVoltaMode ? 2.0 : 0.5);
    
    const safeTarget = isFinite(this.currentBassTarget) ? this.currentBassTarget : 55.0;
    const safeBase = isFinite(this.currentBaseFreq) ? this.currentBaseFreq : 55.0;
    
    let targetFreq = ((safeBase * multiplier) * 0.5) + (safeTarget * 0.5);
    
    // Swipe pitch shift in Volta mode
    if (isVoltaMode) {
        // dx > 0 (right) -> pitch up, dx < 0 (left) -> pitch down
        // dy < 0 (up) -> pitch up, dy > 0 (down) -> pitch down
        const swipeShift = (dx - dy) * 0.5; // Arbitrary scaling factor
        targetFreq += swipeShift;
    }

    if (!isFinite(targetFreq) || targetFreq < 20) targetFreq = 55.0;
    
    this.lastFreq = targetFreq; 
    
    const finalFreq = targetFreq * this.rotationPitchShift;
    
    this.bassOsc.frequency.setTargetAtTime(finalFreq, now, 0.1);
    this.bassFilter.frequency.setTargetAtTime(200 + (multiplier - 1) * 1000, now, 0.1);
    
    // Hum reacts to swing speed
    this.humOsc.frequency.setTargetAtTime(finalFreq, now, 0.1);
    this.humFilter.frequency.setTargetAtTime(400 + (multiplier - 1) * 1000, now, 0.1);
    
    this.currentSpeed = speed;
    this.currentDy = dy;
    this.lastUpdateSpeedTime = now;
  }

  triggerHumiliation() {
    this.isHumiliated = true;
    this.humiliationTimer = 5000; // 5 seconds of clown music
    
    // Tinny filter
    if (this.trackFilter) {
      this.trackFilter.type = 'bandpass';
      this.trackFilter.frequency.setTargetAtTime(1000, this.ctx.currentTime, 0.1);
      this.trackFilter.Q.setTargetAtTime(5, this.ctx.currentTime, 0.1);
    }
  }

  setDeviceRotation(db: number) {
    // A full 90 degree turn either direction should be a 6.0 transpose increase or decrease in pitch (half sensitivity)
    // 12 semitones = 12.0 transpose
    // pitch ratio = 2 ^ (semitones / 12)
    const semitones = (db / 90) * 6;
    this.rotationPitchShift = Math.pow(2, semitones / 12);
    
    if (this.bassOsc && this.humOsc) {
      const now = this.ctx.currentTime;
      const finalFreq = this.lastFreq * this.rotationPitchShift;
      if (isFinite(finalFreq)) {
        this.bassOsc.frequency.setTargetAtTime(finalFreq, now, 0.1);
        this.humOsc.frequency.setTargetAtTime(finalFreq, now, 0.1);
      }
    }
  }

  update(dt: number) {
    if (!this.customTrackSource || !this.isPlaying) return;
    
    const now = this.ctx.currentTime;
    
    // Update accumulatedAudioTime
    if (this.lastUpdateTime > 0) {
        const delta = now - this.lastUpdateTime;
        this.accumulatedAudioTime += delta * this.currentTrackPlaybackRate;
    }
    this.lastUpdateTime = now;
    
    if (this.isHumiliated) {
      this.humiliationTimer -= dt;
      if (this.humiliationTimer <= 0) {
        this.isHumiliated = false;
        if (this.trackFilter) {
          this.trackFilter.type = 'lowpass';
          this.trackFilter.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.5);
          this.trackFilter.Q.setTargetAtTime(1, this.ctx.currentTime, 0.5);
        }
      } else {
        // Clown wobble
        const wobble = Math.sin(now * 15) * 0.15;
        this.customTrackSource.playbackRate.setTargetAtTime(1.0 + wobble, now, 0.05);
        return; // Skip normal pitch logic while humiliated
      }
    }
    
    // Smoothly interpolate the base rate towards the target rate (set by setTrackPitch)
    // dt is in ms, so dt * 0.005 gives a smooth lerp factor
    const lerpFactor = 1 - Math.exp(-dt * 0.005);
    const targetRate = this.trackPlaybackRate * this.pitchShift * this.manualPitch;
    this.currentTrackPlaybackRate += (targetRate - this.currentTrackPlaybackRate) * lerpFactor;
    this.customTrackSource.playbackRate.setTargetAtTime(this.currentTrackPlaybackRate, now, 0.1);

    // Decay speed and dy so they don't get stuck if setSwingMotion stops being called
    if (now - this.lastUpdateSpeedTime > 0.1) {
      const decayFactor = Math.exp(-dt * 0.01);
      this.currentSpeed *= decayFactor;
      this.currentDy *= decayFactor;
    }

    let spike = 0;
    if (now - this.spikeStartTime < 0.3) {
        const progress = (now - this.spikeStartTime) / 0.3;
        spike = this.spikeValue * (1 - progress);
    }

    // Add a dynamic bend based on current swing speed (up to +0.02x speed during a fast swing)
    const swingBend = Math.min(this.currentSpeed / 100, 0.02); 
    
    // Vertical bend: positive dy (down) lowers pitch, negative dy (up) raises pitch
    // Non-linear: smaller changes for normal swings (1-2%), larger for intense ones
    let verticalBend = -Math.sign(this.currentDy) * Math.pow(Math.abs(this.currentDy), 1.2) * 0.00005;
    verticalBend = Math.max(-0.02, Math.min(0.02, verticalBend)); // Clamp to max 2%
    
    // Clamp the total swing effect to +/- 3% (0.03) as requested
    let totalSwingEffect = swingBend + verticalBend + spike;
    totalSwingEffect = Math.max(-0.03, Math.min(0.03, totalSwingEffect));
    
    const dynamicRate = this.currentTrackPlaybackRate + totalSwingEffect;
    let safeRate = Math.max(this.minPitch, Math.min(this.maxPitch, isFinite(dynamicRate) ? dynamicRate : 1.0));
    this.customTrackSource.playbackRate.setTargetAtTime(safeRate, now, 0.02);
  }

  setPitchBend(delta: number) {
    // Pitch bend via drag removed per user request.
  }

  getPitchAccuracy(): number {
    if (!this.bassOsc || !this.analyser) return 0;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Find dominant bass frequency in the track
    const sampleRate = this.ctx.sampleRate;
    const fftSize = this.analyser.fftSize;
    const binWidth = sampleRate / fftSize;
    
    let maxEnergy = 0;
    let dominantBin = 0;
    
    // Look at bins corresponding to 30Hz - 300Hz
    const minBin = Math.floor(30 / binWidth);
    const maxBin = Math.ceil(300 / binWidth);
    
    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > maxEnergy) {
        maxEnergy = dataArray[i];
        dominantBin = i;
      }
    }
    
    if (maxEnergy < 50) return 0; // Not enough bass energy in track
    
    const dominantFreq = dominantBin * binWidth;
    if (dominantFreq <= 0) return 0; // Prevent division by zero and infinite loop
    
    const currentFreq = this.bassOsc.frequency.value;
    
    // Calculate ratio between current freq and dominant freq
    let ratio = currentFreq / dominantFreq;
    if (ratio < 1) ratio = dominantFreq / currentFreq;
    
    if (!isFinite(ratio)) return 0;
    
    // Normalize ratio to a single octave (1 to 2)
    let loopCount = 0;
    while (ratio >= 2.0 && loopCount < 10) {
      ratio /= 2.0;
      loopCount++;
    }
    
    // Good ratios: 1.0 (unison/octave), 1.25 (major third), 1.333 (perfect fourth), 1.5 (perfect fifth), 2.0
    const goodRatios = [1.0, 1.25, 1.333, 1.5, 2.0];
    
    let bestMatch = 1.0;
    for (const r of goodRatios) {
      const dist = Math.abs(ratio - r);
      if (dist < bestMatch) bestMatch = dist;
    }
    
    // Map to 0-1 score. If dist < 0.15, it's somewhat accurate.
    const score = Math.max(0, 1 - (bestMatch / 0.15));
    return score;
  }

  triggerNoteHit() {
    // Tap SFX removed per user request
  }

  triggerMiss() {
    const now = this.ctx.currentTime;
    this.trackFilter.frequency.cancelScheduledValues(now);
    this.trackFilter.frequency.setValueAtTime(400, now); // Muffle track
    this.trackFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.5); // Recover quickly
  }

  triggerSyncopatedMiss() {
    const now = this.ctx.currentTime;
    // Mute the pad (synth chords) to simulate losing a specific instrument track
    if (this.padGain) {
      this.padGain.gain.cancelScheduledValues(now);
      this.padGain.gain.setValueAtTime(0, now); // Instantly mute
      this.padGain.gain.linearRampToValueAtTime(0.05, now + 2.0); // Slowly fade back in over 2 seconds
    }
    // Also slightly muffle the main track
    this.trackFilter.frequency.cancelScheduledValues(now);
    this.trackFilter.frequency.setValueAtTime(800, now); 
    this.trackFilter.frequency.exponentialRampToValueAtTime(20000, now + 1.0); 
  }

  triggerPenalty() {
    this.isPenalty = true;
    const now = this.ctx.currentTime;
    if (this.bassGain) {
      this.bassGain.gain.cancelScheduledValues(now);
      this.bassGain.gain.setValueAtTime(0, now);
    }
    const osc1 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.2);
    osc1.frequency.linearRampToValueAtTime(200, now + 0.5);
    osc1.frequency.linearRampToValueAtTime(500, now + 1.0);
    osc1.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    osc1.start(now);
    osc1.stop(now + 1.0);
    setTimeout(() => { this.isPenalty = false; }, 1000);
  }

  triggerZap(volMultiplier: number = 1.0) {
    const now = this.ctx.currentTime;
    
    // Play alternating clash sounds
    if (this.clashBuffers.length >= 6) {
      let idx = 0;
      if (this.clashHitCount % 2 === 0) {
        // Standard Clash-Boom (0 to 3)
        idx = Math.floor(Math.random() * 4);
      } else {
        // Alternate between KICK BASS (4) and MOODY 808 SLIDE (5)
        const isKickBass = (this.clashHitCount % 4 === 1);
        idx = isKickBass ? 4 : 5;
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = this.clashBuffers[idx];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volMultiplier, now); // Scaled to voltage
      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
      
      this.clashHitCount++;
    } else if (this.clashBuffers.length > 0) {
      const idx = Math.floor(Math.random() * this.clashBuffers.length);
      const source = this.ctx.createBufferSource();
      source.buffer = this.clashBuffers[idx];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volMultiplier, now); // Scaled to voltage
      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
    }

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volMultiplier, now);
    gain.gain.exponentialRampToValueAtTime(0.01 * volMultiplier, now + 0.5);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  async analyzeTrackDeep(buffer: AudioBuffer, onProgress?: (p: number) => void): Promise<{ beatInterval: number, beatOffset: number, clashMoments: number[], tapMoments: number[], basslineSequence: number[] }> {
    return new Promise((resolve) => {
      // We use a timeout to yield to the UI thread so the loading bar can update,
      // and to simulate the "deep dive" analysis time.
      setTimeout(() => {
        const rawData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        
        // Pass 1: Low-pass filter for bass/kick detection (approx < 150Hz)
        if (onProgress) onProgress(0.5);
        const fc = 150; 
        const dt = 1 / sampleRate;
        const rc = 1 / (2 * Math.PI * fc);
        const alpha = dt / (rc + dt);
        
        const lowData = new Float32Array(rawData.length);
        lowData[0] = rawData[0];
        for (let i = 1; i < rawData.length; i++) {
          lowData[i] = lowData[i-1] + alpha * (rawData[i] - lowData[i-1]);
        }
        
        // Pass 1.5: High-pass filter for melody/snare detection (approx > 2000Hz)
        const fch = 2000;
        const rch = 1 / (2 * Math.PI * fch);
        const alphah = rch / (rch + dt);
        const highData = new Float32Array(rawData.length);
        highData[0] = 0;
        for (let i = 1; i < rawData.length; i++) {
          highData[i] = alphah * (highData[i-1] + rawData[i] - rawData[i-1]);
        }

        // Pass 2: Energy windowing (10ms resolution)
        if (onProgress) onProgress(0.6);
        const windowSize = Math.floor(sampleRate * 0.01);
        const energyLow: number[] = [];
        const energyHigh: number[] = [];
        for (let i = 0; i < rawData.length; i += windowSize) {
          let sumL = 0, sumH = 0;
          for (let j = 0; j < windowSize && i + j < rawData.length; j++) {
            sumL += lowData[i + j] * lowData[i + j];
            sumH += highData[i + j] * highData[i + j];
          }
          energyLow.push(Math.sqrt(sumL / windowSize));
          energyHigh.push(Math.sqrt(sumH / windowSize));
        }
        
        // Pass 3: Derivative (Energy Flux)
        if (onProgress) onProgress(0.7);
        const fluxLow: number[] = [0];
        const fluxHigh: number[] = [0];
        for (let i = 1; i < energyLow.length; i++) {
          fluxLow.push(Math.max(0, energyLow[i] - energyLow[i-1]));
          fluxHigh.push(Math.max(0, energyHigh[i] - energyHigh[i-1]));
        }

        // Pass 4: Find TRUE CLASH MOMENTS (Bass impacts)
        if (onProgress) onProgress(0.8);
        const clashMoments: number[] = [];
        const basslineSequence: number[] = [];
        const minClashSpacing = 4.0; 
        
        const sortedFluxLow = [...fluxLow].sort((a, b) => b - a);
        // Be more generous with threshold to find more clashes across the track
        const clashThreshold = sortedFluxLow[Math.floor(sortedFluxLow.length * 0.03)]; 

        const pentatonic = [55.00, 65.41, 73.42, 82.41, 98.00];
        const avgEnergyLow = energyLow.reduce((a, b) => a + b, 0) / energyLow.length;

        for (let i = 1; i < fluxLow.length - 1; i++) {
          if (fluxLow[i] > clashThreshold && fluxLow[i] > fluxLow[i-1] && fluxLow[i] > fluxLow[i+1]) {
            const timeInSeconds = i * 0.01;
            if (clashMoments.length === 0 || timeInSeconds - clashMoments[clashMoments.length - 1] >= minClashSpacing) {
              clashMoments.push(timeInSeconds);
              const noteIdx = Math.floor((energyLow[i] / avgEnergyLow) * pentatonic.length) % pentatonic.length;
              basslineSequence.push(pentatonic[noteIdx]);
            }
          }
        }

        // Pass 4.5: Find TAP MOMENTS (Melody/High-freq peaks)
        const tapMoments: number[] = [];
        const minTapSpacing = 0.4;
        const sortedFluxHigh = [...fluxHigh].sort((a, b) => b - a);
        const tapThreshold = sortedFluxHigh[Math.floor(sortedFluxHigh.length * 0.05)];

        for (let i = 1; i < fluxHigh.length - 1; i++) {
          if (fluxHigh[i] > tapThreshold && fluxHigh[i] > fluxHigh[i-1] && fluxHigh[i] > fluxHigh[i+1]) {
            const timeInSeconds = i * 0.01;
            if (tapMoments.length === 0 || timeInSeconds - tapMoments[tapMoments.length - 1] >= minTapSpacing) {
              tapMoments.push(timeInSeconds);
            }
          }
        }

        // Pass 5: BPM Detection
        if (onProgress) onProgress(0.9);
        const spikes: number[] = [];
        const energyThreshold = avgEnergyLow * 1.5;

        for (let i = 1; i < energyLow.length - 1; i++) {
          if (energyLow[i] > energyThreshold && energyLow[i] > energyLow[i-1] && energyLow[i] > energyLow[i+1]) {
            spikes.push(i * 0.01);
          }
        }

        const intervals: number[] = [];
        for (let i = 1; i < spikes.length; i++) {
          const diff = spikes[i] - spikes[i-1];
          if (diff > 0.3 && diff < 1.0) intervals.push(diff);
        }

        let bestBeat = 0.5;
        let beatOffset = 0;
        if (intervals.length > 0) {
          const bins: Record<string, number> = {};
          intervals.forEach(v => {
            const bin = (Math.round(v * 100) / 100).toString();
            bins[bin] = (bins[bin] || 0) + 1;
          });
          let maxCount = 0;
          for (const bin in bins) {
            if (bins[bin] > maxCount) {
              maxCount = bins[bin];
              bestBeat = parseFloat(bin);
            }
          }
          const firstSpike = spikes[0] || 0;
          beatOffset = firstSpike % bestBeat;
        }

        if (onProgress) onProgress(1.0);
        
        // Add a slight artificial delay to make the "deep analysis" feel weighty and thorough
        setTimeout(() => {
          resolve({ 
            beatInterval: Math.round(bestBeat * 1000),
            beatOffset: beatOffset,
            clashMoments: clashMoments,
            tapMoments: tapMoments,
            basslineSequence: basslineSequence
          });
        }, 1500);
        
      }, 100);
    });
  }
}
