/**
 * Asteroids Game - Classic space rock destroyer
 * Fly your ship and destroy asteroids to survive!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface AsteroidsGameProps {
  onBack: () => void;
}

interface Ship {
  x: number;
  y: number;
  angle: number;
  dx: number;
  dy: number;
}

interface Asteroid {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  vertices: number[];
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
}

const SHIP_SIZE = 20;
const ROTATION_SPEED = 0.1;
const THRUST = 0.15;
const FRICTION = 0.99;
const BULLET_SPEED = 8;
const BULLET_LIFE = 60;

export const AsteroidsGame: React.FC<AsteroidsGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 500 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('asteroidsHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs
  const shipRef = useRef<Ship>({ x: 0, y: 0, angle: 0, dx: 0, dy: 0 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const invulnerableRef = useRef(0);

  // Calculate canvas size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32;
      const maxHeight = container.clientHeight - 32;
      const aspectRatio = 1.2;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const createAsteroid = useCallback((x: number, y: number, size: number): Asteroid => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (4 - size) * 0.5 + Math.random();
    const vertices: number[] = [];
    const numVertices = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numVertices; i++) {
      vertices.push(0.7 + Math.random() * 0.3);
    }
    return {
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size,
      vertices,
    };
  }, []);

  const initGame = useCallback((newLevel = 1) => {
    const { width, height } = canvasSize;

    // Initialize ship
    shipRef.current = {
      x: width / 2,
      y: height / 2,
      angle: -Math.PI / 2,
      dx: 0,
      dy: 0,
    };

    // Initialize asteroids
    const asteroids: Asteroid[] = [];
    const numAsteroids = 3 + newLevel;
    for (let i = 0; i < numAsteroids; i++) {
      let x, y;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (Math.hypot(x - width / 2, y - height / 2) < 150);
      asteroids.push(createAsteroid(x, y, 3));
    }
    asteroidsRef.current = asteroids;

    bulletsRef.current = [];
    levelRef.current = newLevel;
    invulnerableRef.current = 120;

    if (newLevel === 1) {
      scoreRef.current = 0;
      livesRef.current = 3;
      setScore(0);
      setLives(3);
    }

    setLevel(newLevel);
    setGameOver(false);
  }, [canvasSize, createAsteroid]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const shoot = useCallback(() => {
    const ship = shipRef.current;
    bulletsRef.current.push({
      x: ship.x + Math.cos(ship.angle) * SHIP_SIZE,
      y: ship.y + Math.sin(ship.angle) * SHIP_SIZE,
      dx: Math.cos(ship.angle) * BULLET_SPEED + ship.dx * 0.5,
      dy: Math.sin(ship.angle) * BULLET_SPEED + ship.dy * 0.5,
      life: BULLET_LIFE,
    });
    getGameAudio().play('asteroidShoot');
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const ship = shipRef.current;
    const asteroids = asteroidsRef.current;
    const bullets = bulletsRef.current;
    const keys = keysRef.current;

    // Handle input
    if (keys.has('ArrowLeft') || keys.has('a')) {
      ship.angle -= ROTATION_SPEED;
    }
    if (keys.has('ArrowRight') || keys.has('d')) {
      ship.angle += ROTATION_SPEED;
    }
    if (keys.has('ArrowUp') || keys.has('w')) {
      ship.dx += Math.cos(ship.angle) * THRUST;
      ship.dy += Math.sin(ship.angle) * THRUST;
    }

    // Update ship
    ship.x += ship.dx;
    ship.y += ship.dy;
    ship.dx *= FRICTION;
    ship.dy *= FRICTION;

    // Wrap ship
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Update invulnerability
    if (invulnerableRef.current > 0) {
      invulnerableRef.current--;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;
      bullet.life--;

      // Wrap bullets
      if (bullet.x < 0) bullet.x = width;
      if (bullet.x > width) bullet.x = 0;
      if (bullet.y < 0) bullet.y = height;
      if (bullet.y > height) bullet.y = 0;

      if (bullet.life <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (const asteroid of asteroids) {
      asteroid.x += asteroid.dx;
      asteroid.y += asteroid.dy;

      // Wrap asteroids
      if (asteroid.x < -50) asteroid.x = width + 50;
      if (asteroid.x > width + 50) asteroid.x = -50;
      if (asteroid.y < -50) asteroid.y = height + 50;
      if (asteroid.y > height + 50) asteroid.y = -50;
    }

    // Bullet-asteroid collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const asteroid = asteroids[j];
        const radius = asteroid.size * 15;
        if (Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y) < radius) {
          bullets.splice(i, 1);
          asteroids.splice(j, 1);

          // Split asteroid
          if (asteroid.size > 1) {
            for (let k = 0; k < 2; k++) {
              asteroids.push(createAsteroid(asteroid.x, asteroid.y, asteroid.size - 1));
            }
          }

          scoreRef.current += (4 - asteroid.size) * 20;
          setScore(scoreRef.current);
          getGameAudio().play('asteroidHit');
          break;
        }
      }
    }

    // Ship-asteroid collision
    if (invulnerableRef.current === 0) {
      for (const asteroid of asteroids) {
        const radius = asteroid.size * 15;
        if (Math.hypot(ship.x - asteroid.x, ship.y - asteroid.y) < radius + SHIP_SIZE / 2) {
          livesRef.current--;
          setLives(livesRef.current);
          getGameAudio().play('asteroidDie');

          if (livesRef.current <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            getGameAudio().play('gameOver');
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
              localStorage.setItem('asteroidsHighScore', scoreRef.current.toString());
            }
            return;
          } else {
            // Reset ship position
            ship.x = width / 2;
            ship.y = height / 2;
            ship.dx = 0;
            ship.dy = 0;
            invulnerableRef.current = 120;
          }
          break;
        }
      }
    }

    // Check level complete
    if (asteroids.length === 0) {
      getGameAudio().play('win');
      setTimeout(() => {
        initGame(levelRef.current + 1);
        setIsPlaying(true);
      }, 1500);
      setIsPlaying(false);
      return;
    }

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#444';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137) % width;
      const y = (i * 89) % height;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw ship
    if (invulnerableRef.current === 0 || Math.floor(invulnerableRef.current / 5) % 2 === 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        ship.x + Math.cos(ship.angle) * SHIP_SIZE,
        ship.y + Math.sin(ship.angle) * SHIP_SIZE
      );
      ctx.lineTo(
        ship.x + Math.cos(ship.angle + 2.5) * SHIP_SIZE * 0.7,
        ship.y + Math.sin(ship.angle + 2.5) * SHIP_SIZE * 0.7
      );
      ctx.lineTo(
        ship.x + Math.cos(ship.angle + Math.PI) * SHIP_SIZE * 0.3,
        ship.y + Math.sin(ship.angle + Math.PI) * SHIP_SIZE * 0.3
      );
      ctx.lineTo(
        ship.x + Math.cos(ship.angle - 2.5) * SHIP_SIZE * 0.7,
        ship.y + Math.sin(ship.angle - 2.5) * SHIP_SIZE * 0.7
      );
      ctx.closePath();
      ctx.stroke();

      // Draw thrust
      if (keys.has('ArrowUp') || keys.has('w')) {
        ctx.strokeStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(
          ship.x + Math.cos(ship.angle + 2.7) * SHIP_SIZE * 0.5,
          ship.y + Math.sin(ship.angle + 2.7) * SHIP_SIZE * 0.5
        );
        ctx.lineTo(
          ship.x + Math.cos(ship.angle + Math.PI) * SHIP_SIZE * (0.5 + Math.random() * 0.3),
          ship.y + Math.sin(ship.angle + Math.PI) * SHIP_SIZE * (0.5 + Math.random() * 0.3)
        );
        ctx.lineTo(
          ship.x + Math.cos(ship.angle - 2.7) * SHIP_SIZE * 0.5,
          ship.y + Math.sin(ship.angle - 2.7) * SHIP_SIZE * 0.5
        );
        ctx.stroke();
      }
    }

    // Draw asteroids
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (const asteroid of asteroids) {
      const radius = asteroid.size * 15;
      ctx.beginPath();
      for (let i = 0; i <= asteroid.vertices.length; i++) {
        const angle = (i / asteroid.vertices.length) * Math.PI * 2;
        const r = radius * asteroid.vertices[i % asteroid.vertices.length];
        const px = asteroid.x + Math.cos(angle) * r;
        const py = asteroid.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw bullets
    ctx.fillStyle = '#fff';
    for (const bullet of bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver, highScore, initGame, createAsteroid]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'd', 'w', 's'].includes(e.key)) {
        e.preventDefault();
      }

      keysRef.current.add(e.key);

      if (e.key === ' ') {
        if (isPlaying && !gameOver) {
          shoot();
        } else if (!isPlaying && !gameOver) {
          setIsPlaying(true);
        } else if (gameOver) {
          initGame();
          setIsPlaying(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver, shoot, initGame]);

  const resetGame = () => {
    initGame();
    setIsPlaying(false);
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    const enabled = getGameAudio().toggle();
    setSoundEnabled(enabled);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !isPlaying) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen, isPlaying]);

  const gameContent = (
    <div className={`h-full w-full flex flex-col bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <button onClick={isFullscreen ? () => setIsFullscreen(false) : onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          {isFullscreen ? <X size={18} /> : <ArrowLeft size={18} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-lg font-bold text-white">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Level</div>
            <div className="text-lg font-bold text-green-500">{level}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Lives</div>
            <div className="text-lg font-bold text-red-500">{lives}</div>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy size={16} weight="fill" />
            <span className="font-bold">{highScore}</span>
          </div>
          <button onClick={() => gameOver ? resetGame() : setIsPlaying(p => !p)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
          </button>
          <button onClick={resetGame} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <ArrowsClockwise size={18} className="text-gray-400" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <ArrowsIn size={18} className="text-white" /> : <ArrowsOut size={18} className="text-white" />}
          </button>
          <button onClick={toggleSound} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? <SpeakerHigh size={18} className="text-white" /> : <SpeakerSlash size={18} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="rounded-lg"
            style={{ touchAction: 'none' }}
          />

          {/* Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              {gameOver ? (
                <>
                  <div className="text-3xl font-bold text-red-500 mb-2">Game Over!</div>
                  <div className="text-gray-300 mb-4">Final Score: {score}</div>
                  <button onClick={() => { initGame(); setIsPlaying(true); }} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold">
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-500 mb-4">ASTEROIDS</div>
                  <button onClick={() => setIsPlaying(true)} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center gap-2">
                    <Play size={20} weight="fill" /> Start
                  </button>
                  <div className="mt-4 text-gray-400 text-xs text-center">
                    <p>Rotate: ← → or A D</p>
                    <p>Thrust: ↑ or W</p>
                    <p>Shoot: Space</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default AsteroidsGame;
