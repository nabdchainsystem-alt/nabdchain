/**
 * Space Invaders Game - Classic alien shooter
 * Destroy waves of descending aliens before they reach you!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface SpaceInvadersGameProps {
  onBack: () => void;
}

interface Alien {
  x: number;
  y: number;
  type: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  isPlayer: boolean;
}

interface Barrier {
  x: number;
  y: number;
  health: number;
}

const ALIEN_ROWS = 5;
const ALIEN_COLS = 11;
const ALIEN_SIZE = 30;
const ALIEN_GAP = 10;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 20;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = 8;
const ALIEN_BULLET_SPEED = 4;

export const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 500 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('spaceInvadersHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs
  const playerRef = useRef({ x: 0 });
  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const barriersRef = useRef<Barrier[]>([]);
  const alienDirectionRef = useRef(1);
  const alienSpeedRef = useRef(1);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);

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

  const initGame = useCallback((newLevel = 1) => {
    const { width, height } = canvasSize;

    // Initialize player
    playerRef.current = { x: width / 2 - PLAYER_WIDTH / 2 };

    // Initialize aliens
    const aliens: Alien[] = [];
    const startX = (width - (ALIEN_COLS * (ALIEN_SIZE + ALIEN_GAP))) / 2;
    const startY = 50;

    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        aliens.push({
          x: startX + col * (ALIEN_SIZE + ALIEN_GAP),
          y: startY + row * (ALIEN_SIZE + ALIEN_GAP),
          type: Math.min(row, 2), // 0, 1, or 2 type
          alive: true,
        });
      }
    }
    aliensRef.current = aliens;

    // Initialize barriers
    const barriers: Barrier[] = [];
    const barrierCount = 4;
    const barrierWidth = 60;
    const barrierSpacing = (width - barrierCount * barrierWidth) / (barrierCount + 1);
    for (let i = 0; i < barrierCount; i++) {
      barriers.push({
        x: barrierSpacing + i * (barrierWidth + barrierSpacing),
        y: height - 120,
        health: 10,
      });
    }
    barriersRef.current = barriers;

    // Reset game state
    bulletsRef.current = [];
    alienDirectionRef.current = 1;
    alienSpeedRef.current = 1 + (newLevel - 1) * 0.3;
    frameRef.current = 0;
    levelRef.current = newLevel;

    if (newLevel === 1) {
      scoreRef.current = 0;
      livesRef.current = 3;
      setScore(0);
      setLives(3);
    }

    setLevel(newLevel);
    setGameOver(false);
    setWon(false);
  }, [canvasSize]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const shoot = useCallback(() => {
    const player = playerRef.current;
    bulletsRef.current.push({
      x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
      y: canvasSize.height - 60,
      isPlayer: true,
    });
    getGameAudio().play('invaderShoot');
  }, [canvasSize]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const player = playerRef.current;
    const aliens = aliensRef.current;
    const bullets = bulletsRef.current;
    const barriers = barriersRef.current;

    frameRef.current++;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + frameRef.current * 0.1) % width;
      const y = (i * 89) % height;
      ctx.fillRect(x, y, 1, 1);
    }

    // Move aliens
    if (frameRef.current % Math.max(1, Math.floor(30 / alienSpeedRef.current)) === 0) {
      let shouldMoveDown = false;
      let minX = width, maxX = 0;

      aliens.forEach(alien => {
        if (alien.alive) {
          minX = Math.min(minX, alien.x);
          maxX = Math.max(maxX, alien.x + ALIEN_SIZE);
        }
      });

      if ((alienDirectionRef.current > 0 && maxX >= width - 10) ||
          (alienDirectionRef.current < 0 && minX <= 10)) {
        shouldMoveDown = true;
        alienDirectionRef.current *= -1;
      }

      aliens.forEach(alien => {
        if (alien.alive) {
          if (shouldMoveDown) {
            alien.y += 15;
          } else {
            alien.x += alienDirectionRef.current * 10;
          }
        }
      });
    }

    // Alien shooting
    const aliveAliens = aliens.filter(a => a.alive);
    if (frameRef.current % 60 === 0 && aliveAliens.length > 0) {
      const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
      bullets.push({
        x: shooter.x + ALIEN_SIZE / 2 - BULLET_WIDTH / 2,
        y: shooter.y + ALIEN_SIZE,
        isPlayer: false,
      });
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.y += bullet.isPlayer ? -BULLET_SPEED : ALIEN_BULLET_SPEED;

      // Remove off-screen bullets
      if (bullet.y < 0 || bullet.y > height) {
        bullets.splice(i, 1);
        continue;
      }

      // Check barrier collision
      for (const barrier of barriers) {
        if (barrier.health > 0 &&
            bullet.x > barrier.x && bullet.x < barrier.x + 60 &&
            bullet.y > barrier.y && bullet.y < barrier.y + 30) {
          barrier.health--;
          bullets.splice(i, 1);
          break;
        }
      }
    }

    // Check player bullet vs alien collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.isPlayer) continue;

      for (const alien of aliens) {
        if (alien.alive &&
            bullet.x > alien.x && bullet.x < alien.x + ALIEN_SIZE &&
            bullet.y > alien.y && bullet.y < alien.y + ALIEN_SIZE) {
          alien.alive = false;
          bullets.splice(i, 1);
          scoreRef.current += (3 - alien.type) * 10;
          setScore(scoreRef.current);
          getGameAudio().play('invaderHit');
          break;
        }
      }
    }

    // Check alien bullet vs player collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (bullet.isPlayer) continue;

      if (bullet.x > player.x && bullet.x < player.x + PLAYER_WIDTH &&
          bullet.y > height - 50 && bullet.y < height - 30) {
        bullets.splice(i, 1);
        livesRef.current--;
        setLives(livesRef.current);
        getGameAudio().play('invaderDie');

        if (livesRef.current <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          getGameAudio().play('gameOver');
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('spaceInvadersHighScore', scoreRef.current.toString());
          }
          return;
        }
      }
    }

    // Check if aliens reached bottom
    for (const alien of aliens) {
      if (alien.alive && alien.y + ALIEN_SIZE > height - 80) {
        setGameOver(true);
        setIsPlaying(false);
        getGameAudio().play('gameOver');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('spaceInvadersHighScore', scoreRef.current.toString());
        }
        return;
      }
    }

    // Check win condition
    if (aliveAliens.length === 0) {
      setIsPlaying(false);
      getGameAudio().play('win');
      // Next level after delay
      setTimeout(() => {
        initGame(levelRef.current + 1);
        setIsPlaying(true);
      }, 2000);
      return;
    }

    // Draw aliens
    aliens.forEach(alien => {
      if (!alien.alive) return;

      const colors = ['#00ff00', '#ffff00', '#ff00ff'];
      ctx.fillStyle = colors[alien.type];

      // Simple alien shape
      ctx.fillRect(alien.x + 5, alien.y, ALIEN_SIZE - 10, 8);
      ctx.fillRect(alien.x, alien.y + 8, ALIEN_SIZE, 10);
      ctx.fillRect(alien.x + 3, alien.y + 18, 8, 8);
      ctx.fillRect(alien.x + ALIEN_SIZE - 11, alien.y + 18, 8, 8);
    });

    // Draw barriers
    barriers.forEach(barrier => {
      if (barrier.health <= 0) return;
      const alpha = barrier.health / 10;
      ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.fillRect(barrier.x, barrier.y, 60, 30);
    });

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, height - 50, PLAYER_WIDTH, PLAYER_HEIGHT);
    ctx.fillRect(player.x + PLAYER_WIDTH / 2 - 3, height - 60, 6, 10);

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.isPlayer ? '#00ff00' : '#ff0000';
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    });

    // Draw lives
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px Arial';
    ctx.fillText(`Lives: ${livesRef.current}`, 10, 25);

    // Draw level
    ctx.fillText(`Level: ${levelRef.current}`, width - 80, 25);

    if (isPlaying && !gameOver && !won) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver, won, highScore, initGame]);

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
      const player = playerRef.current;
      const moveSpeed = 15;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        player.x = Math.max(0, player.x - moveSpeed);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        player.x = Math.min(canvasSize.width - PLAYER_WIDTH, player.x + moveSpeed);
      } else if (e.key === ' ') {
        e.preventDefault();
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasSize, isPlaying, gameOver, shoot, initGame]);

  // Mouse/touch controls
  useEffect(() => {
    const handleMove = (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      playerRef.current.x = Math.max(0, Math.min(canvasSize.width - PLAYER_WIDTH, x - PLAYER_WIDTH / 2));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleClick = () => {
      if (isPlaying && !gameOver) {
        shoot();
      } else if (!isPlaying && !gameOver) {
        setIsPlaying(true);
      } else if (gameOver) {
        initGame();
        setIsPlaying(true);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleClick);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleClick);
      }
    };
  }, [canvasSize, isPlaying, gameOver, shoot, initGame]);

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
            className="rounded-lg cursor-crosshair"
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
                  <div className="text-3xl font-bold text-green-500 mb-4">SPACE INVADERS</div>
                  <button onClick={() => setIsPlaying(true)} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center gap-2">
                    <Play size={20} weight="fill" /> Start
                  </button>
                  <div className="mt-4 text-gray-400 text-xs text-center">
                    <p>Move: Arrow keys or Mouse</p>
                    <p>Shoot: Space or Click</p>
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

export default SpaceInvadersGame;
