/**
 * Game Audio - Shared audio utility for arcade games
 * Uses Web Audio API for procedurally generated sound effects
 */

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundConfig {
  frequency: number;
  type: OscType;
  duration: number;
  volume: number;
  decay?: number;
  sweep?: number;
}

// Pre-defined sound configurations for common game events
const SOUNDS: Record<string, SoundConfig> = {
  // General sounds
  eat: { frequency: 600, type: 'sine', duration: 0.1, volume: 0.2, sweep: 200 },
  powerup: { frequency: 400, type: 'sine', duration: 0.25, volume: 0.2, sweep: 400 },
  hit: { frequency: 200, type: 'square', duration: 0.1, volume: 0.15, sweep: -100 },
  gameOver: { frequency: 200, type: 'sawtooth', duration: 0.5, volume: 0.2, sweep: -150 },
  win: { frequency: 500, type: 'sine', duration: 0.4, volume: 0.2, sweep: 300 },
  click: { frequency: 800, type: 'sine', duration: 0.05, volume: 0.1 },

  // Snake specific
  snakeEat: { frequency: 700, type: 'sine', duration: 0.08, volume: 0.15, sweep: 300 },
  snakeDie: { frequency: 150, type: 'sawtooth', duration: 0.4, volume: 0.2, sweep: -100 },
  snakePowerup: { frequency: 500, type: 'sine', duration: 0.2, volume: 0.2, sweep: 500 },

  // Tetris specific
  tetrisMove: { frequency: 150, type: 'square', duration: 0.03, volume: 0.08 },
  tetrisRotate: { frequency: 300, type: 'square', duration: 0.05, volume: 0.1, sweep: 100 },
  tetrisDrop: { frequency: 100, type: 'square', duration: 0.08, volume: 0.12 },
  tetrisLine: { frequency: 600, type: 'sine', duration: 0.15, volume: 0.2, sweep: 200 },
  tetrisMultiLine: { frequency: 800, type: 'sine', duration: 0.3, volume: 0.25, sweep: 400 },
  tetrisLevelUp: { frequency: 400, type: 'sine', duration: 0.3, volume: 0.2, sweep: 600 },

  // Breakout specific
  breakoutPaddle: { frequency: 400, type: 'square', duration: 0.05, volume: 0.1 },
  breakoutBrick: { frequency: 500, type: 'square', duration: 0.06, volume: 0.12, sweep: 100 },
  breakoutWall: { frequency: 300, type: 'square', duration: 0.04, volume: 0.08 },
  breakoutPowerup: { frequency: 600, type: 'sine', duration: 0.2, volume: 0.2, sweep: 400 },
  breakoutLoseLife: { frequency: 200, type: 'sawtooth', duration: 0.3, volume: 0.15, sweep: -150 },

  // Flappy Bird specific
  flap: { frequency: 400, type: 'sine', duration: 0.08, volume: 0.1, sweep: 200 },
  flappyScore: { frequency: 600, type: 'sine', duration: 0.1, volume: 0.15, sweep: 300 },
  flappyDie: { frequency: 200, type: 'sawtooth', duration: 0.3, volume: 0.2, sweep: -150 },

  // Memory Match specific
  cardFlip: { frequency: 500, type: 'sine', duration: 0.06, volume: 0.1 },
  cardMatch: { frequency: 700, type: 'sine', duration: 0.15, volume: 0.2, sweep: 200 },
  cardNoMatch: { frequency: 250, type: 'square', duration: 0.15, volume: 0.12, sweep: -50 },
  memoryWin: { frequency: 600, type: 'sine', duration: 0.4, volume: 0.25, sweep: 400 },

  // Space Invaders specific
  invaderShoot: { frequency: 600, type: 'square', duration: 0.08, volume: 0.1, sweep: -200 },
  invaderHit: { frequency: 400, type: 'square', duration: 0.1, volume: 0.15, sweep: 200 },
  invaderDie: { frequency: 200, type: 'sawtooth', duration: 0.3, volume: 0.2, sweep: -150 },

  // Asteroids specific
  asteroidShoot: { frequency: 800, type: 'square', duration: 0.05, volume: 0.1, sweep: -300 },
  asteroidHit: { frequency: 300, type: 'sawtooth', duration: 0.15, volume: 0.15, sweep: -100 },
  asteroidDie: { frequency: 150, type: 'sawtooth', duration: 0.4, volume: 0.2, sweep: -100 },

  // Pong specific
  pongPaddle: { frequency: 500, type: 'square', duration: 0.04, volume: 0.12 },
  pongWall: { frequency: 300, type: 'square', duration: 0.03, volume: 0.08 },
  pongScore: { frequency: 600, type: 'sine', duration: 0.2, volume: 0.15, sweep: 300 },

  // Sudoku specific
  sudokuPlace: { frequency: 500, type: 'sine', duration: 0.06, volume: 0.1, sweep: 100 },
  sudokuError: { frequency: 200, type: 'square', duration: 0.15, volume: 0.12, sweep: -50 },
  sudokuHint: { frequency: 600, type: 'sine', duration: 0.1, volume: 0.15, sweep: 200 },

  // Simon Says specific
  simonGreen: { frequency: 392, type: 'sine', duration: 0.3, volume: 0.2 }, // G4
  simonRed: { frequency: 262, type: 'sine', duration: 0.3, volume: 0.2 }, // C4
  simonYellow: { frequency: 330, type: 'sine', duration: 0.3, volume: 0.2 }, // E4
  simonBlue: { frequency: 196, type: 'sine', duration: 0.3, volume: 0.2 }, // G3
  simonSuccess: { frequency: 500, type: 'sine', duration: 0.15, volume: 0.2, sweep: 200 },
  simonWrong: { frequency: 150, type: 'sawtooth', duration: 0.4, volume: 0.2, sweep: -50 },

  // Whack-a-Mole specific
  moleHit: { frequency: 400, type: 'square', duration: 0.08, volume: 0.15, sweep: 200 },
  moleGolden: { frequency: 600, type: 'sine', duration: 0.15, volume: 0.2, sweep: 400 },
};

class GameAudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    const saved = localStorage.getItem('arcadeGameSound');
    this.enabled = saved !== 'false';
  }

  public init(): void {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5;
      this.initialized = true;
    } catch {
      this.enabled = false;
    }
  }

  public play(sound: string): void {
    if (!this.enabled) return;

    // Initialize on first play (requires user interaction)
    if (!this.initialized) {
      this.init();
    }

    if (!this.audioContext || !this.masterGain) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const config = SOUNDS[sound];
    if (!config) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);

      if (config.sweep) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(20, config.frequency + config.sweep),
          this.audioContext.currentTime + config.duration
        );
      }

      gainNode.gain.setValueAtTime(config.volume, this.audioContext.currentTime);

      if (config.decay) {
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + config.decay
        );
      } else {
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + config.duration
        );
      }

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + config.duration);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch {
      // Audio is not critical, fail silently
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('arcadeGameSound', String(this.enabled));
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

// Singleton instance
let instance: GameAudioManager | null = null;

export function getGameAudio(): GameAudioManager {
  if (!instance) {
    instance = new GameAudioManager();
  }
  return instance;
}

export type { GameAudioManager };
