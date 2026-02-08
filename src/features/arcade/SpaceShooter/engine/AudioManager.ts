/**
 * Audio Manager - Handles game sound effects
 * Uses Web Audio API for low-latency sound playback
 */

import { appLogger } from '../../../../utils/logger';

export type SoundType = 'shoot' | 'explosion' | 'hit' | 'powerup' | 'gameOver' | 'levelUp';

interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  decay?: number;
  sweep?: number;
}

// Procedurally generated sound configurations
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  shoot: {
    frequency: 800,
    type: 'square',
    duration: 0.1,
    volume: 0.15,
    sweep: -400,
  },
  explosion: {
    frequency: 100,
    type: 'sawtooth',
    duration: 0.3,
    volume: 0.25,
    decay: 0.3,
  },
  hit: {
    frequency: 300,
    type: 'square',
    duration: 0.08,
    volume: 0.12,
    sweep: -100,
  },
  powerup: {
    frequency: 400,
    type: 'sine',
    duration: 0.2,
    volume: 0.2,
    sweep: 400,
  },
  gameOver: {
    frequency: 200,
    type: 'sawtooth',
    duration: 0.5,
    volume: 0.2,
    sweep: -150,
  },
  levelUp: {
    frequency: 500,
    type: 'sine',
    duration: 0.3,
    volume: 0.2,
    sweep: 300,
  },
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Load saved preference
    const saved = localStorage.getItem('spaceShooterSound');
    this.enabled = saved !== 'false';
  }

  /**
   * Initialize audio context - must be called after user interaction
   */
  public init(): void {
    if (this.initialized) return;

    try {
      this.audioContext = new (
        window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext
      )();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
      this.initialized = true;
    } catch (e) {
      appLogger.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  }

  /**
   * Play a sound effect
   */
  public play(sound: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const config = SOUND_CONFIGS[sound];
    if (!config) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);

      // Frequency sweep
      if (config.sweep) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(20, config.frequency + config.sweep),
          this.audioContext.currentTime + config.duration,
        );
      }

      // Volume envelope
      gainNode.gain.setValueAtTime(config.volume, this.audioContext.currentTime);

      if (config.decay) {
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.decay);
      } else {
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration);
      }

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + config.duration);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (_e) {
      // Silently fail - audio is not critical
    }
  }

  /**
   * Play explosion sound with variations
   */
  public playExplosion(size: 'small' | 'medium' | 'large' = 'medium'): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const baseFreq = size === 'small' ? 150 : size === 'large' ? 60 : 100;
    const duration = size === 'small' ? 0.15 : size === 'large' ? 0.5 : 0.3;

    try {
      // Create noise for explosion
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;

      // Filter for rumble
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(baseFreq * 2, this.audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(baseFreq / 2, this.audioContext.currentTime + duration);

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      noise.start();
      noise.stop(this.audioContext.currentTime + duration);

      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      };
    } catch (_e) {
      // Fallback to simple explosion
      this.play('explosion');
    }
  }

  /**
   * Toggle sound on/off
   */
  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('spaceShooterSound', String(this.enabled));
    return this.enabled;
  }

  /**
   * Set master volume (0-1)
   */
  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Check if sound is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
