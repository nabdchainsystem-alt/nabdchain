/**
 * Core Game Engine - Handles the main game loop at 60fps
 * Uses requestAnimationFrame for smooth performance
 */

import {
  GameState,
  GameConfig,
  InputState,
  Player,
  Enemy,
  Bullet,
  Particle,
  Star,
  DEFAULT_CONFIG,
  EnemyType,
  MovementPattern,
  PowerUp,
  PowerUpType
} from '../types';
import { getAudioManager, AudioManager } from './AudioManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private state: GameState;
  private input: InputState;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP: number = 1000 / 60; // 60fps
  private audio: AudioManager;

  // Callbacks
  private onStateChange?: (state: GameState) => void;
  private onGameOver?: (score: number, highScore: number) => void;

  constructor(canvas: HTMLCanvasElement, config: Partial<GameConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    this.input = this.createInitialInput();
    this.state = this.createInitialState();
    this.audio = getAudioManager();

    this.setupInputListeners();
  }

  // Resize canvas for fullscreen support
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // Recreate starfield for new size
    this.state.stars = this.createStarfield();

    // Adjust player position if needed
    if (this.state.player.position.x > width - this.state.player.width) {
      this.state.player.position.x = width - this.state.player.width;
    }
    if (this.state.player.position.y > height - this.state.player.height) {
      this.state.player.position.y = height - this.state.player.height;
    }
  }

  private createInitialInput(): InputState {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      pause: false
    };
  }

  private createInitialState(): GameState {
    const highScore = parseInt(localStorage.getItem('spaceShooterHighScore') || '0', 10);

    return {
      status: 'menu',
      player: this.createPlayer(),
      enemies: [],
      playerBullets: [],
      enemyBullets: [],
      particles: [],
      powerUps: [],
      stars: this.createStarfield(),
      wave: 1,
      waveTimer: 0,
      waveDelay: 3000,
      enemiesSpawned: 0,
      enemiesPerWave: 5,
      highScore
    };
  }

  private createPlayer(): Player {
    return {
      id: 'player',
      position: {
        x: this.config.width / 2 - 20,
        y: this.config.height - 80
      },
      velocity: { x: 0, y: 0 },
      width: 40,
      height: 40,
      active: true,
      lives: 3,
      score: 0,
      invincible: false,
      invincibleTimer: 0,
      powerUpLevel: 0,
      fireRate: this.config.playerFireRate,
      lastFireTime: 0
    };
  }

  private createStarfield(): Star[] {
    const stars: Star[] = [];
    for (let i = 0; i < this.config.starCount; i++) {
      stars.push({
        x: Math.random() * this.config.width,
        y: Math.random() * this.config.height,
        speed: 0.5 + Math.random() * 2,
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7
      });
    }
    return stars;
  }

  private setupInputListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.handleKey(e.code, true);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.handleKey(e.code, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Store cleanup function
    (this as any)._cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }

  private handleKey(code: string, pressed: boolean): void {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = pressed;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = pressed;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.input.up = pressed;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.down = pressed;
        break;
      case 'Space':
        this.input.fire = pressed;
        break;
      case 'Escape':
      case 'KeyP':
        if (pressed) this.togglePause();
        break;
      case 'Enter':
        if (pressed && (this.state.status === 'menu' || this.state.status === 'gameOver')) {
          this.startGame();
        }
        break;
    }
  }

  // Touch controls for mobile
  public handleTouchMove(x: number, y: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (x - rect.left) * (this.config.width / rect.width);
    const canvasY = (y - rect.top) * (this.config.height / rect.height);

    // Move player towards touch position
    this.state.player.position.x = canvasX - this.state.player.width / 2;
    this.state.player.position.y = canvasY - this.state.player.height / 2;

    // Clamp to bounds
    this.state.player.position.x = Math.max(0, Math.min(this.config.width - this.state.player.width, this.state.player.position.x));
    this.state.player.position.y = Math.max(0, Math.min(this.config.height - this.state.player.height, this.state.player.position.y));
  }

  public setTouchFiring(firing: boolean): void {
    this.input.fire = firing;
  }

  public startGame(): void {
    // Initialize audio on user interaction (required by browser autoplay policy)
    this.audio.init();

    this.state = this.createInitialState();
    this.state.status = 'playing';
    this.state.player = this.createPlayer();
    this.state.wave = 1;
    this.state.waveTimer = 0;
    this.onStateChange?.(this.state);
  }

  public togglePause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
    } else if (this.state.status === 'paused') {
      this.state.status = 'playing';
    }
    this.onStateChange?.(this.state);
  }

  public start(): void {
    if (this.animationId) return;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if ((this as any)._cleanup) {
      (this as any)._cleanup();
    }
  }

  public setCallbacks(
    onStateChange: (state: GameState) => void,
    onGameOver: (score: number, highScore: number) => void
  ): void {
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
  }

  private gameLoop = (currentTime: number): void => {
    this.animationId = requestAnimationFrame(this.gameLoop);

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed timestep updates for consistent physics
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      if (this.state.status === 'playing') {
        this.update(this.FIXED_TIMESTEP);
      }
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // Render every frame for smooth visuals
    this.render();
  };

  private update(dt: number): void {
    this.updateStars(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateParticles(dt);
    this.updatePowerUps(dt);
    this.checkCollisions();
    this.updateWaveSystem(dt);
    this.cleanup();
  }

  private updateStars(dt: number): void {
    for (const star of this.state.stars) {
      star.y += star.speed * (dt / 16);
      if (star.y > this.config.height) {
        star.y = 0;
        star.x = Math.random() * this.config.width;
      }
    }
  }

  private updatePlayer(dt: number): void {
    const player = this.state.player;

    // Movement
    let dx = 0;
    let dy = 0;

    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    player.position.x += dx * this.config.playerSpeed * (dt / 16);
    player.position.y += dy * this.config.playerSpeed * (dt / 16);

    // Clamp to bounds
    player.position.x = Math.max(0, Math.min(this.config.width - player.width, player.position.x));
    player.position.y = Math.max(0, Math.min(this.config.height - player.height, player.position.y));

    // Firing
    const now = performance.now();
    if (this.input.fire && now - player.lastFireTime > player.fireRate) {
      this.firePlayerBullet();
      player.lastFireTime = now;
    }

    // Invincibility timer
    if (player.invincible) {
      player.invincibleTimer -= dt;
      if (player.invincibleTimer <= 0) {
        player.invincible = false;
      }
    }
  }

  private firePlayerBullet(): void {
    const player = this.state.player;
    const centerX = player.position.x + player.width / 2;
    const bulletY = player.position.y;

    // Play shoot sound
    this.audio.play('shoot');

    // Base bullet
    this.createBullet(centerX - 2, bulletY, true);

    // Power-up spread shots
    if (player.powerUpLevel >= 1) {
      this.createBullet(centerX - 15, bulletY + 10, true, -0.3);
      this.createBullet(centerX + 11, bulletY + 10, true, 0.3);
    }
    if (player.powerUpLevel >= 2) {
      this.createBullet(centerX - 25, bulletY + 20, true, -0.5);
      this.createBullet(centerX + 21, bulletY + 20, true, 0.5);
    }
  }

  private createBullet(x: number, y: number, isPlayer: boolean, angleOffset: number = 0): void {
    const speed = isPlayer ? this.config.bulletSpeed : this.config.enemyBulletSpeed;
    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      position: { x, y },
      velocity: {
        x: angleOffset * speed,
        y: isPlayer ? -speed : speed
      },
      width: isPlayer ? 4 : 6,
      height: isPlayer ? 12 : 8,
      active: true,
      damage: isPlayer ? 1 : 1,
      isPlayerBullet: isPlayer,
      color: isPlayer ? '#00ffff' : '#ff6600'
    };

    if (isPlayer) {
      this.state.playerBullets.push(bullet);
    } else {
      this.state.enemyBullets.push(bullet);
    }
  }

  private updateEnemies(dt: number): void {
    const now = performance.now();

    for (const enemy of this.state.enemies) {
      if (!enemy.active) continue;

      enemy.patternTime += dt;

      // Movement patterns
      switch (enemy.pattern) {
        case 'straight':
          enemy.position.y += enemy.velocity.y * (dt / 16);
          break;
        case 'zigzag':
          enemy.position.y += enemy.velocity.y * (dt / 16);
          enemy.position.x += Math.sin(enemy.patternTime / 300) * 3;
          break;
        case 'sine':
          enemy.position.y += enemy.velocity.y * (dt / 16);
          enemy.position.x += Math.sin(enemy.patternTime / 500) * 2;
          break;
        case 'dive':
          enemy.position.y += enemy.velocity.y * (dt / 16);
          if (enemy.patternTime > 1000) {
            enemy.velocity.y = 4;
          }
          break;
        case 'circle':
          const radius = 50;
          const speed = enemy.patternTime / 500;
          enemy.position.x += Math.cos(speed) * 2;
          enemy.position.y += Math.sin(speed) * 1 + 0.5;
          break;
      }

      // Clamp X position
      enemy.position.x = Math.max(0, Math.min(this.config.width - enemy.width, enemy.position.x));

      // Enemy firing
      if (now - enemy.lastFireTime > enemy.fireRate && enemy.position.y > 50) {
        this.createBullet(
          enemy.position.x + enemy.width / 2 - 3,
          enemy.position.y + enemy.height,
          false
        );
        enemy.lastFireTime = now;
      }

      // Mark inactive if off screen
      if (enemy.position.y > this.config.height + 50) {
        enemy.active = false;
      }
    }
  }

  private updateBullets(dt: number): void {
    const allBullets = [...this.state.playerBullets, ...this.state.enemyBullets];

    for (const bullet of allBullets) {
      bullet.position.x += bullet.velocity.x * (dt / 16);
      bullet.position.y += bullet.velocity.y * (dt / 16);

      // Mark inactive if off screen
      if (
        bullet.position.y < -20 ||
        bullet.position.y > this.config.height + 20 ||
        bullet.position.x < -20 ||
        bullet.position.x > this.config.width + 20
      ) {
        bullet.active = false;
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const particle of this.state.particles) {
      particle.position.x += particle.velocity.x * (dt / 16);
      particle.position.y += particle.velocity.y * (dt / 16);
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
      particle.life -= particle.decay * (dt / 16);
      particle.size *= 0.99;
      particle.rotation += particle.rotationSpeed * (dt / 16);

      if (particle.life <= 0) {
        particle.active = false;
      }
    }
  }

  private updatePowerUps(dt: number): void {
    for (const powerUp of this.state.powerUps) {
      powerUp.position.y += 1.5 * (dt / 16);
      powerUp.position.x += Math.sin(performance.now() / 300) * 0.5;

      if (powerUp.position.y > this.config.height + 30) {
        powerUp.active = false;
      }
    }
  }

  private checkCollisions(): void {
    const player = this.state.player;

    // Player bullets vs enemies
    for (const bullet of this.state.playerBullets) {
      if (!bullet.active) continue;

      for (const enemy of this.state.enemies) {
        if (!enemy.active) continue;

        if (this.checkAABBCollision(bullet, enemy)) {
          bullet.active = false;
          enemy.health -= bullet.damage;

          this.createHitParticles(bullet.position.x, bullet.position.y, '#ffff00');

          if (enemy.health <= 0) {
            enemy.active = false;
            player.score += enemy.points;
            this.createExplosion(
              enemy.position.x + enemy.width / 2,
              enemy.position.y + enemy.height / 2,
              enemy.type === 'tank' ? 30 : 20
            );

            // Chance to drop power-up
            if (Math.random() < 0.15) {
              this.spawnPowerUp(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2);
            }

            // Update high score
            if (player.score > this.state.highScore) {
              this.state.highScore = player.score;
              localStorage.setItem('spaceShooterHighScore', String(this.state.highScore));
            }
          }
          break;
        }
      }
    }

    // Enemy bullets vs player
    if (!player.invincible) {
      for (const bullet of this.state.enemyBullets) {
        if (!bullet.active) continue;

        if (this.checkAABBCollision(bullet, player)) {
          bullet.active = false;
          this.playerHit();
          break;
        }
      }
    }

    // Enemies vs player
    if (!player.invincible) {
      for (const enemy of this.state.enemies) {
        if (!enemy.active) continue;

        if (this.checkAABBCollision(player, enemy)) {
          enemy.active = false;
          this.createExplosion(
            enemy.position.x + enemy.width / 2,
            enemy.position.y + enemy.height / 2,
            20
          );
          this.playerHit();
          break;
        }
      }
    }

    // Power-ups vs player
    for (const powerUp of this.state.powerUps) {
      if (!powerUp.active) continue;

      if (this.checkAABBCollision(player, powerUp)) {
        powerUp.active = false;
        this.applyPowerUp(powerUp.type);
        this.createHitParticles(
          powerUp.position.x + powerUp.width / 2,
          powerUp.position.y + powerUp.height / 2,
          '#00ff00'
        );
      }
    }
  }

  private checkAABBCollision(a: { position: { x: number; y: number }; width: number; height: number },
                              b: { position: { x: number; y: number }; width: number; height: number }): boolean {
    return (
      a.position.x < b.position.x + b.width &&
      a.position.x + a.width > b.position.x &&
      a.position.y < b.position.y + b.height &&
      a.position.y + a.height > b.position.y
    );
  }

  private playerHit(): void {
    const player = this.state.player;
    player.lives--;

    this.createExplosion(
      player.position.x + player.width / 2,
      player.position.y + player.height / 2,
      15
    );

    if (player.lives <= 0) {
      this.gameOver();
    } else {
      player.invincible = true;
      player.invincibleTimer = 2000;
      player.powerUpLevel = Math.max(0, player.powerUpLevel - 1);
    }
  }

  private gameOver(): void {
    this.state.status = 'gameOver';
    this.audio.play('gameOver');
    this.onGameOver?.(this.state.player.score, this.state.highScore);
    this.onStateChange?.(this.state);
  }

  private createExplosion(x: number, y: number, count: number): void {
    // Play explosion sound based on size
    const size = count > 25 ? 'large' : count > 15 ? 'medium' : 'small';
    this.audio.playExplosion(size);

    const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ffff00', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      const particle: Particle = {
        id: `particle_${Date.now()}_${i}`,
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        width: 4,
        height: 4,
        active: true,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      };

      this.state.particles.push(particle);
    }
  }

  private createHitParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 1 + Math.random() * 2;

      const particle: Particle = {
        id: `hit_${Date.now()}_${i}`,
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        width: 2,
        height: 2,
        active: true,
        life: 1,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 2,
        decay: 0.05,
        rotation: 0,
        rotationSpeed: 0
      };

      this.state.particles.push(particle);
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['health', 'rapidFire', 'spread', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp: PowerUp = {
      id: `powerup_${Date.now()}`,
      position: { x: x - 12, y },
      velocity: { x: 0, y: 1.5 },
      width: 24,
      height: 24,
      active: true,
      type
    };

    this.state.powerUps.push(powerUp);
  }

  private applyPowerUp(type: PowerUpType): void {
    const player = this.state.player;

    // Play powerup sound
    this.audio.play('powerup');

    switch (type) {
      case 'health':
        player.lives = Math.min(player.lives + 1, 5);
        break;
      case 'rapidFire':
        player.fireRate = Math.max(50, player.fireRate - 30);
        break;
      case 'spread':
        player.powerUpLevel = Math.min(player.powerUpLevel + 1, 2);
        break;
      case 'shield':
        player.invincible = true;
        player.invincibleTimer = 5000;
        break;
    }
  }

  private updateWaveSystem(dt: number): void {
    this.state.waveTimer += dt;

    // Spawn enemies for current wave
    const spawnInterval = Math.max(500, 2000 - this.state.wave * 150);

    if (
      this.state.enemiesSpawned < this.state.enemiesPerWave &&
      this.state.waveTimer > spawnInterval
    ) {
      this.spawnEnemy();
      this.state.enemiesSpawned++;
      this.state.waveTimer = 0;
    }

    // Check if wave is complete
    const activeEnemies = this.state.enemies.filter(e => e.active).length;
    if (this.state.enemiesSpawned >= this.state.enemiesPerWave && activeEnemies === 0) {
      // Next wave
      this.state.wave++;
      this.state.enemiesSpawned = 0;
      this.state.enemiesPerWave = 5 + this.state.wave * 2;
      this.state.waveTimer = -this.state.waveDelay; // Delay before next wave

      // Play level up sound
      this.audio.play('levelUp');

      // Victory condition
      if (this.state.wave > this.config.maxWaves) {
        this.state.status = 'victory';
        this.state.player.score += 1000; // Bonus for completing
        if (this.state.player.score > this.state.highScore) {
          this.state.highScore = this.state.player.score;
          localStorage.setItem('spaceShooterHighScore', String(this.state.highScore));
        }
        this.onStateChange?.(this.state);
      }
    }
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['basic', 'basic', 'fast', 'tank'];
    const patterns: MovementPattern[] = ['straight', 'zigzag', 'sine', 'dive'];

    // Higher waves have tougher enemies
    let type: EnemyType = types[Math.floor(Math.random() * Math.min(types.length, 2 + Math.floor(this.state.wave / 3)))];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    let width = 36;
    let height = 36;
    let health = 1;
    let points = 100;
    let speed = 1.5;
    let fireRate = 2000;

    switch (type) {
      case 'fast':
        width = 28;
        height = 28;
        speed = 2.5;
        points = 150;
        fireRate = 1500;
        break;
      case 'tank':
        width = 48;
        height = 48;
        health = 3;
        speed = 1;
        points = 300;
        fireRate = 2500;
        break;
    }

    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      position: {
        x: 20 + Math.random() * (this.config.width - 40 - width),
        y: -height - 20
      },
      velocity: { x: 0, y: speed },
      width,
      height,
      active: true,
      type,
      health,
      points,
      fireRate,
      lastFireTime: performance.now() + Math.random() * 1000,
      pattern,
      patternTime: 0
    };

    this.state.enemies.push(enemy);
  }

  private cleanup(): void {
    this.state.enemies = this.state.enemies.filter(e => e.active);
    this.state.playerBullets = this.state.playerBullets.filter(b => b.active);
    this.state.enemyBullets = this.state.enemyBullets.filter(b => b.active);
    this.state.particles = this.state.particles.filter(p => p.active);
    this.state.powerUps = this.state.powerUps.filter(p => p.active);
  }

  private render(): void {
    const ctx = this.ctx;

    // Clear with dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw starfield
    this.renderStars();

    // Draw game objects
    this.renderPowerUps();
    this.renderEnemies();
    this.renderPlayer();
    this.renderBullets();
    this.renderParticles();

    // Draw UI
    this.renderUI();

    // Draw overlays
    if (this.state.status === 'menu') {
      this.renderMenu();
    } else if (this.state.status === 'paused') {
      this.renderPaused();
    } else if (this.state.status === 'gameOver') {
      this.renderGameOver();
    } else if (this.state.status === 'victory') {
      this.renderVictory();
    }
  }

  private renderStars(): void {
    const ctx = this.ctx;
    for (const star of this.state.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPlayer(): void {
    const ctx = this.ctx;
    const player = this.state.player;

    if (!player.active) return;

    // Blinking when invincible
    if (player.invincible && Math.floor(performance.now() / 100) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(player.position.x + player.width / 2, player.position.y + player.height / 2);

    // Engine glow
    const gradient = ctx.createRadialGradient(0, 20, 0, 0, 30, 20);
    gradient.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 50, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 22, 8 + Math.random() * 2, 12 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ship body
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-18, 18);
    ctx.lineTo(-8, 12);
    ctx.lineTo(0, 18);
    ctx.lineTo(8, 12);
    ctx.lineTo(18, 18);
    ctx.closePath();
    ctx.fill();

    // Ship highlight
    ctx.fillStyle = '#5dade2';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-8, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderEnemies(): void {
    const ctx = this.ctx;

    for (const enemy of this.state.enemies) {
      if (!enemy.active) continue;

      ctx.save();
      ctx.translate(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2);

      // Different enemy styles based on type
      let color = '#e74c3c';
      let secondaryColor = '#c0392b';

      if (enemy.type === 'fast') {
        color = '#9b59b6';
        secondaryColor = '#8e44ad';
      } else if (enemy.type === 'tank') {
        color = '#27ae60';
        secondaryColor = '#1e8449';
      }

      const hw = enemy.width / 2;
      const hh = enemy.height / 2;

      // Enemy body (inverted triangle - pointing down)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, hh);
      ctx.lineTo(-hw, -hh);
      ctx.lineTo(-hw * 0.3, -hh * 0.5);
      ctx.lineTo(hw * 0.3, -hh * 0.5);
      ctx.lineTo(hw, -hh);
      ctx.closePath();
      ctx.fill();

      // Inner detail
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(0, hh * 0.6);
      ctx.lineTo(-hw * 0.5, -hh * 0.5);
      ctx.lineTo(hw * 0.5, -hh * 0.5);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      const glow = ctx.createRadialGradient(0, -hh, 0, 0, -hh - 5, 10);
      glow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
      glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(0, -hh - 3, 6, 8 + Math.random() * 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBullets(): void {
    const ctx = this.ctx;

    // Player bullets
    for (const bullet of this.state.playerBullets) {
      if (!bullet.active) continue;

      // Glow effect
      const gradient = ctx.createRadialGradient(
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        0,
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        bullet.height
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        bullet.width + 4,
        bullet.height + 4,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bullet.position.x, bullet.position.y, bullet.width, bullet.height);
    }

    // Enemy bullets
    for (const bullet of this.state.enemyBullets) {
      if (!bullet.active) continue;

      // Glow
      const gradient = ctx.createRadialGradient(
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        0,
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        bullet.width + 4
      );
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        bullet.width + 2,
        0, Math.PI * 2
      );
      ctx.fill();

      // Core
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(
        bullet.position.x + bullet.width / 2,
        bullet.position.y + bullet.height / 2,
        bullet.width / 2,
        0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  private renderParticles(): void {
    const ctx = this.ctx;

    for (const particle of this.state.particles) {
      if (!particle.active) continue;

      ctx.save();
      ctx.translate(particle.position.x, particle.position.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.life;

      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderPowerUps(): void {
    const ctx = this.ctx;

    for (const powerUp of this.state.powerUps) {
      if (!powerUp.active) continue;

      ctx.save();
      ctx.translate(powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2);

      // Rotating glow
      const time = performance.now() / 500;
      ctx.rotate(time);

      // Outer glow
      let color = '#00ff00';
      if (powerUp.type === 'health') color = '#ff69b4';
      else if (powerUp.type === 'rapidFire') color = '#ffff00';
      else if (powerUp.type === 'spread') color = '#00ffff';
      else if (powerUp.type === 'shield') color = '#9966ff';

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, `${color}88`);
      gradient.addColorStop(1, `${color}00`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let icon = '?';
      if (powerUp.type === 'health') icon = '+';
      else if (powerUp.type === 'rapidFire') icon = 'R';
      else if (powerUp.type === 'spread') icon = 'S';
      else if (powerUp.type === 'shield') icon = 'O';

      ctx.rotate(-time); // Counter-rotate for text
      ctx.fillText(icon, 0, 0);

      ctx.restore();
    }
  }

  private renderUI(): void {
    const ctx = this.ctx;
    const player = this.state.player;

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${player.score.toString().padStart(8, '0')}`, 10, 30);

    // High score
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText(`HI: ${this.state.highScore.toString().padStart(8, '0')}`, 10, 48);

    // Lives
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('LIVES:', this.config.width - 70, 30);

    for (let i = 0; i < player.lives; i++) {
      ctx.fillStyle = i < player.lives ? '#3498db' : '#333333';
      ctx.beginPath();
      ctx.arc(this.config.width - 55 + i * 18, 26, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wave indicator
    if (this.state.status === 'playing') {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WAVE ${this.state.wave}`, this.config.width / 2, 30);
    }

    // Power-up indicator
    if (player.powerUpLevel > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`PWR: ${'*'.repeat(player.powerUpLevel)}`, 10, this.config.height - 10);
    }
  }

  private renderMenu(): void {
    const ctx = this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', this.config.width / 2, this.config.height / 2 - 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SHOOTER', this.config.width / 2, this.config.height / 2 - 20);

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Arrow Keys / WASD to move', this.config.width / 2, this.config.height / 2 + 30);
    ctx.fillText('SPACE to fire', this.config.width / 2, this.config.height / 2 + 50);
    ctx.fillText('ESC / P to pause', this.config.width / 2, this.config.height / 2 + 70);

    // Start prompt
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px Arial';
    const blink = Math.floor(performance.now() / 500) % 2;
    if (blink) {
      ctx.fillText('PRESS ENTER TO START', this.config.width / 2, this.config.height / 2 + 120);
    }

    // High score
    if (this.state.highScore > 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(`High Score: ${this.state.highScore}`, this.config.width / 2, this.config.height - 30);
    }
  }

  private renderPaused(): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.config.width / 2, this.config.height / 2);

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Press ESC or P to resume', this.config.width / 2, this.config.height / 2 + 40);
  }

  private renderGameOver(): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${this.state.player.score}`, this.config.width / 2, this.config.height / 2 + 10);

    if (this.state.player.score >= this.state.highScore && this.state.player.score > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('NEW HIGH SCORE!', this.config.width / 2, this.config.height / 2 + 40);
    }

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    const blink = Math.floor(performance.now() / 500) % 2;
    if (blink) {
      ctx.fillText('Press ENTER to play again', this.config.width / 2, this.config.height / 2 + 80);
    }
  }

  private renderVictory(): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', this.config.width / 2, this.config.height / 2 - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`Final Score: ${this.state.player.score}`, this.config.width / 2, this.config.height / 2 + 10);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('All waves completed!', this.config.width / 2, this.config.height / 2 + 40);

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    const blink = Math.floor(performance.now() / 500) % 2;
    if (blink) {
      ctx.fillText('Press ENTER to play again', this.config.width / 2, this.config.height / 2 + 80);
    }
  }

  public getState(): GameState {
    return this.state;
  }
}
