// Web Audio API Synthesizer for Snake // Reborn
import storage from './storage';

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.sequencerInterval = null;
    this.seqIndex = 0;
    this.bgmPlaying = false;
  }

  // Safe initialization on user gesture
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.', e);
    }
  }

  async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.startBGM();
  }

  get isMuted() {
    return storage.getSetting('isMuted');
  }

  get sfxVolume() {
    return this.isMuted ? 0 : storage.getSetting('sfxVolume');
  }

  get bgmVolume() {
    return this.isMuted ? 0 : storage.getSetting('bgmVolume');
  }

  playSFX(type, data = 1) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const vol = this.sfxVolume;
    if (vol <= 0) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'hover': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        
        gain.gain.setValueAtTime(vol * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      
      case 'eat': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.06); // E5

        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.1);
        osc2.start(now + 0.06);
        osc2.stop(now + 0.2);
        break;
      }

      case 'powerup': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'combo': {
        // Increment frequency pitch depending on combo level (data: combo count)
        const comboLevel = Math.min(data, 10);
        const pitchMultiplier = 1 + (comboLevel - 1) * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440.00 * pitchMultiplier, now); // Base A4

        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'wrap': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, now);
        
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'gameover': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.linearRampToValueAtTime(65.41, now + 0.7); // C2

        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);
        break;
      }

      case 'achievement': {
        // Happy arpeggio C major
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        gain.connect(this.ctx.destination);

        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          osc.connect(gain);
          osc.start(now + i * 0.08);
          osc.stop(now + 0.6);
        });
        break;
      }

      case 'start': {
        // Retro game start arpeggio
        const notes = [329.63, 392.00, 523.25, 659.25, 783.99]; // E4, G4, C5, E5, G5
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        gain.connect(this.ctx.destination);

        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          osc.connect(gain);
          osc.start(now + i * 0.06);
          osc.stop(now + 0.5);
        });
        break;
      }
    }
  }

  startBGM() {
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    
    // Ambient rhythmic beat loop - runs every 333ms (90 BPM 8th notes)
    const tickTime = 333; 
    this.seqIndex = 0;
    
    this.sequencerInterval = setInterval(() => {
      if (this.ctx.state === 'suspended') return;
      const vol = this.bgmVolume;
      if (vol <= 0) return;

      const now = this.ctx.currentTime;
      const index = this.seqIndex;
      this.seqIndex = (this.seqIndex + 1) % 16; // 16-step loop

      // 1. Soft atmospheric pad on step 0 and 8 (A minor and F major chord feels)
      if (index === 0 || index === 8) {
        const padFreqs = index === 0 ? [110.00, 130.81, 164.81] : [87.31, 110.00, 130.81];
        padFreqs.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const padFilter = this.ctx.createBiquadFilter();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          
          // Smooth fade in and slow fade out to create a warm pad background
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol * 0.07, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
          
          padFilter.type = 'lowpass';
          padFilter.frequency.setValueAtTime(450, now);
          
          osc.connect(gain);
          gain.connect(padFilter);
          padFilter.connect(this.ctx.destination);
          
          osc.start(now);
          osc.stop(now + 2.3);
        });
      }

      // 2. Deep sub-bass pulse on syncopated steps
      const bassSteps = [0, 3, 6, 8, 11, 14];
      if (bassSteps.includes(index)) {
        const rootFreq = (index < 8) ? 55.00 : 43.65; // Am to F bass progression
        // Add a 5th degree bounce on steps 6 and 14
        const freq = (index === 6 || index === 14) ? rootFreq * 1.5 : rootFreq;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now); // Filter out high harmonics for a sub-bass feel
        
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.33);
      }

      // 3. Minimal hi-hat ticks (highly filtered pluck clicks)
      const tickSteps = [2, 6, 10, 14];
      if (tickSteps.includes(index)) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const tickFilter = this.ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500, now);
        osc.frequency.exponentialRampToValueAtTime(6000, now + 0.02);
        
        tickFilter.type = 'highpass';
        tickFilter.frequency.setValueAtTime(2500, now);
        
        gain.gain.setValueAtTime(vol * 0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        
        osc.connect(gain);
        gain.connect(tickFilter);
        tickFilter.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.035);
      }

      // 4. Subtle, spacey space-echo arpeggios
      const leadSteps = [4, 7, 12, 15];
      if (leadSteps.includes(index)) {
        const scale = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // Pentatonic minor
        const noteIndex = (Math.floor(Date.now() / 4500) + index) % scale.length;
        const freq = scale[noteIndex];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delayGain = this.ctx.createGain();
        const delay = this.ctx.createDelay();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(vol * 0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        delay.delayTime.setValueAtTime(0.166, now); // 166ms echo
        delayGain.gain.setValueAtTime(vol * 0.03, now);
        delayGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.4);
      }
    }, tickTime);
  }

  stopBGM() {
    if (this.sequencerInterval) {
      clearInterval(this.sequencerInterval);
      this.sequencerInterval = null;
    }
    this.bgmPlaying = false;
  }

  // Settings updates
  updateSettings() {
    // If volumes are muted/adjusted, they are dynamically caught in getter properties
    // If mute is set to true, or BGM is 0, we could stop sequencer to save resources,
    // but the interval running with 0 gain is extremely low CPU anyway.
  }
}

export const audio = new AudioSynth();
export default audio;
