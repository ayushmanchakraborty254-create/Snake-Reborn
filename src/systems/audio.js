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
    
    // Ambient rhythmic beat loop - runs every 400ms (150 BPM)
    const tickTime = 400; 
    
    this.sequencerInterval = setInterval(() => {
      if (this.ctx.state === 'suspended') return;
      const vol = this.bgmVolume;
      if (vol <= 0) return;

      const now = this.ctx.currentTime;
      const index = this.seqIndex;
      this.seqIndex = (this.seqIndex + 1) % 8;

      // Soft ambient low-pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.connect(this.ctx.destination);

      // Bass notes progression (Am - F - C - G/Em feel)
      // Step 0: A1, Step 2: F1, Step 4: C2, Step 6: G1
      const bassProg = [55.00, 55.00, 43.65, 43.65, 65.41, 65.41, 49.00, 82.41];
      const targetBassFreq = bassProg[index];

      // Bass pulse on steps 0, 2, 4, 6
      if (index % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(targetBassFreq, now);

        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 0.38);
      }

      // Spacey quiet plucks on steps 1, 3, 5, 7 randomly
      if (index % 2 === 1 && Math.random() > 0.4) {
        // Melodic notes: A3 (220), C4 (261), E4 (329), G4 (392), A4 (440)
        const melody = [220.00, 261.63, 329.63, 392.00, 440.00];
        const targetMelodyFreq = melody[Math.floor(Math.random() * melody.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(targetMelodyFreq, now);

        gain.gain.setValueAtTime(vol * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 0.38);
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
