// Space Shooter Game Type Definitions

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends GameObject {
  lives: number;
  score: number;
  invincible: boolean;
  invincibleTimer: number;
  powerUpLevel: number;
  fireRate: number;
  lastFireTime: number;
}

export interface Enemy extends GameObject {
  type: EnemyType;
  health: number;
  points: number;
  fireRate: number;
  lastFireTime: number;
  pattern: MovementPattern;
  patternTime: number;
}

export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss';

export type MovementPattern =
  | 'straight'
  | 'zigzag'
  | 'sine'
  | 'dive'
  | 'circle';

export interface Bullet extends GameObject {
  damage: number;
  isPlayerBullet: boolean;
  color: string;
}

export interface Particle extends GameObject {
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
}

export interface PowerUp extends GameObject {
  type: PowerUpType;
}

export type PowerUpType =
  | 'health'
  | 'rapidFire'
  | 'spread'
  | 'shield';

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export interface GameState {
  status: GameStatus;
  player: Player;
  enemies: Enemy[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  particles: Particle[];
  powerUps: PowerUp[];
  stars: Star[];
  wave: number;
  waveTimer: number;
  waveDelay: number;
  enemiesSpawned: number;
  enemiesPerWave: number;
  highScore: number;
}

export type GameStatus =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'gameOver'
  | 'victory';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  pause: boolean;
}

export interface GameConfig {
  width: number;
  height: number;
  playerSpeed: number;
  playerFireRate: number;
  bulletSpeed: number;
  enemyBulletSpeed: number;
  starCount: number;
  maxWaves: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 400,
  height: 600,
  playerSpeed: 5,
  playerFireRate: 150,
  bulletSpeed: 8,
  enemyBulletSpeed: 4,
  starCount: 100,
  maxWaves: 10
};
