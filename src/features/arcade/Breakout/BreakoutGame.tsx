/**
 * Breakout Game - Classic brick breaker with Power-ups
 * Bounce the ball and break all bricks, collect power-ups!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface BreakoutGameProps {
  onBack: () => void;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
  hasPowerUp?: PowerUpType;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  fireball?: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  width: number;
  height: number;
}

type PowerUpType = 'multiball' | 'wide' | 'slow' | 'life' | 'fireball' | 'laser';

const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const PADDLE_WIDTH_RATIO = 0.12;
const PADDLE_HEIGHT = 14;
const BALL_RADIUS = 8;
const INITIAL_BALL_SPEED = 5;
const POWERUP_SIZE = 24;
const POWERUP_FALL_SPEED = 2;

const POWERUP_COLORS: Record<PowerUpType, string> = {
  multiball: '#8b5cf6', // purple
  wide: '#3b82f6', // blue
  slow: '#06b6d4', // cyan
  life: '#ef4444', // red
  fireball: '#f97316', // orange
  laser: '#22c55e', // green
};

const POWERUP_ICONS: Record<PowerUpType, string> = {
  multiball: '×3',
  wide: '↔',
  slow: '◷',
  life: '♥',
  fireball: '🔥',
  laser: '⚡',
};

export const BreakoutGame: React.FC<BreakoutGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 450 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('breakoutHighScore') || '0', 10);
  });
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs
  const paddleRef = useRef({ x: 0, width: 0, baseWidth: 0 });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const activePowerUpsRef = useRef<Map<PowerUpType, number>>(new Map());

  // Calculate canvas size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32;
      const maxHeight = container.clientHeight - 32;
      const aspectRatio = 1.4;

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

  const initGame = useCallback(() => {
    const { width, height } = canvasSize;
    const paddleWidth = width * PADDLE_WIDTH_RATIO;

    // Initialize paddle
    paddleRef.current = {
      x: (width - paddleWidth) / 2,
      width: paddleWidth,
      baseWidth: paddleWidth,
    };

    // Initialize ball
    ballsRef.current = [{
      x: width / 2,
      y: height - 60,
      dx: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      dy: -INITIAL_BALL_SPEED,
      radius: BALL_RADIUS,
    }];

    // Initialize bricks with power-ups
    const brickWidth = (width - 40) / BRICK_COLS;
    const brickHeight = 22;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    const bricks: Brick[] = [];

    const powerUpTypes: PowerUpType[] = ['multiball', 'wide', 'slow', 'life', 'fireball', 'laser'];

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        // ~15% chance for power-up
        const hasPowerUp = Math.random() < 0.15;
        bricks.push({
          x: 20 + col * brickWidth,
          y: 50 + row * (brickHeight + 4),
          width: brickWidth - 4,
          height: brickHeight,
          color: colors[row],
          active: true,
          hasPowerUp: hasPowerUp ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] : undefined,
        });
      }
    }
    bricksRef.current = bricks;
    powerUpsRef.current = [];
    activePowerUpsRef.current = new Map();

    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setActivePowerUps([]);
  }, [canvasSize]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const applyPowerUp = useCallback((type: PowerUpType) => {
    const duration = 10000; // 10 seconds for timed power-ups
    const paddle = paddleRef.current;

    switch (type) {
      case 'multiball':
        // Add 2 more balls
        const currentBalls = ballsRef.current;
        if (currentBalls.length > 0) {
          const mainBall = currentBalls[0];
          for (let i = 0; i < 2; i++) {
            const angle = (Math.random() - 0.5) * Math.PI / 2;
            const speed = Math.sqrt(mainBall.dx * mainBall.dx + mainBall.dy * mainBall.dy);
            ballsRef.current.push({
              x: mainBall.x,
              y: mainBall.y,
              dx: Math.sin(angle) * speed,
              dy: -Math.abs(Math.cos(angle) * speed),
              radius: BALL_RADIUS,
            });
          }
        }
        break;

      case 'wide':
        paddle.width = paddle.baseWidth * 1.5;
        activePowerUpsRef.current.set('wide', Date.now() + duration);
        break;

      case 'slow':
        ballsRef.current.forEach(ball => {
          ball.dx *= 0.6;
          ball.dy *= 0.6;
        });
        activePowerUpsRef.current.set('slow', Date.now() + duration);
        break;

      case 'life':
        livesRef.current = Math.min(livesRef.current + 1, 5);
        setLives(livesRef.current);
        break;

      case 'fireball':
        ballsRef.current.forEach(ball => {
          ball.fireball = true;
        });
        activePowerUpsRef.current.set('fireball', Date.now() + duration);
        break;

      case 'laser':
        // Instant laser that destroys a column
        const balls = ballsRef.current;
        if (balls.length > 0) {
          const laserX = paddle.x + paddle.width / 2;
          bricksRef.current.forEach(brick => {
            if (brick.active && laserX > brick.x && laserX < brick.x + brick.width) {
              brick.active = false;
              scoreRef.current += 10;
            }
          });
          setScore(scoreRef.current);
        }
        break;
    }

    // Update active power-ups display
    const activeList: string[] = [];
    activePowerUpsRef.current.forEach((_, key) => activeList.push(key));
    setActivePowerUps(activeList);
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const paddle = paddleRef.current;
    const balls = ballsRef.current;
    const bricks = bricksRef.current;
    const powerUps = powerUpsRef.current;

    // Check and expire power-ups
    const now = Date.now();
    activePowerUpsRef.current.forEach((expireTime, type) => {
      if (now > expireTime) {
        activePowerUpsRef.current.delete(type);
        if (type === 'wide') {
          paddle.width = paddle.baseWidth;
        }
        if (type === 'fireball') {
          balls.forEach(ball => ball.fireball = false);
        }
        if (type === 'slow') {
          balls.forEach(ball => {
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const targetSpeed = INITIAL_BALL_SPEED;
            if (speed < targetSpeed * 0.9) {
              const factor = targetSpeed / speed;
              ball.dx *= factor;
              ball.dy *= factor;
            }
          });
        }
      }
    });

    // Update active power-ups display
    const activeList: string[] = [];
    activePowerUpsRef.current.forEach((_, key) => activeList.push(key));
    setActivePowerUps(activeList);

    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.active) {
        // Brick shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(brick.x + 3, brick.y + 3, brick.width, brick.height);

        // Brick
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(brick.x, brick.y, brick.width, 4);

        // Power-up indicator
        if (brick.hasPowerUp) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw and update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      pu.y += POWERUP_FALL_SPEED;

      // Draw power-up
      ctx.fillStyle = POWERUP_COLORS[pu.type];
      ctx.shadowColor = POWERUP_COLORS[pu.type];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(pu.x - pu.width / 2, pu.y - pu.height / 2, pu.width, pu.height, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Icon
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWERUP_ICONS[pu.type], pu.x, pu.y);

      // Check paddle collision
      if (
        pu.y + pu.height / 2 > height - 30 &&
        pu.y - pu.height / 2 < height - 30 + PADDLE_HEIGHT &&
        pu.x > paddle.x &&
        pu.x < paddle.x + paddle.width
      ) {
        applyPowerUp(pu.type);
        getGameAudio().play('breakoutPowerup');
        powerUps.splice(i, 1);
        continue;
      }

      // Remove if off screen
      if (pu.y > height + pu.height) {
        powerUps.splice(i, 1);
      }
    }

    // Draw paddle with gradient
    const paddleGradient = ctx.createLinearGradient(paddle.x, height - 30, paddle.x, height - 30 + PADDLE_HEIGHT);
    paddleGradient.addColorStop(0, '#60a5fa');
    paddleGradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = paddleGradient;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(paddle.x, height - 30, paddle.width, PADDLE_HEIGHT, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Update and draw balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall collisions
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
        ball.dx = -ball.dx;
        ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
        getGameAudio().play('breakoutWall');
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        ball.y = ball.radius;
        getGameAudio().play('breakoutWall');
      }

      // Paddle collision
      if (
        ball.y + ball.radius > height - 30 &&
        ball.y - ball.radius < height - 30 + PADDLE_HEIGHT &&
        ball.x > paddle.x - ball.radius &&
        ball.x < paddle.x + paddle.width + ball.radius
      ) {
        ball.dy = -Math.abs(ball.dy);
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * 1.5 * (hitPos - 0.5);
        ball.y = height - 30 - ball.radius;
        getGameAudio().play('breakoutPaddle');
      }

      // Brick collisions
      for (const brick of bricks) {
        if (!brick.active) continue;

        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          brick.active = false;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          getGameAudio().play('breakoutBrick');

          // Spawn power-up
          if (brick.hasPowerUp) {
            powerUps.push({
              x: brick.x + brick.width / 2,
              y: brick.y + brick.height / 2,
              type: brick.hasPowerUp,
              width: POWERUP_SIZE,
              height: POWERUP_SIZE,
            });
          }

          // Fireball goes through, otherwise bounce
          if (!ball.fireball) {
            ball.dy = -ball.dy;
          }

          // Check win
          if (bricks.every(b => !b.active)) {
            setWon(true);
            setIsPlaying(false);
            getGameAudio().play('win');
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
              localStorage.setItem('breakoutHighScore', scoreRef.current.toString());
            }
            return;
          }

          break;
        }
      }

      // Ball out of bounds
      if (ball.y > height + ball.radius) {
        balls.splice(i, 1);
        continue;
      }

      // Draw ball
      ctx.shadowColor = ball.fireball ? '#f97316' : '#ffffff';
      ctx.shadowBlur = ball.fireball ? 20 : 15;
      ctx.fillStyle = ball.fireball ? '#f97316' : '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      if (ball.fireball) {
        // Fire trail
        ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.dx, ball.y - ball.dy, ball.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    // Check if all balls lost
    if (balls.length === 0) {
      livesRef.current--;
      setLives(livesRef.current);
      getGameAudio().play('breakoutLoseLife');

      if (livesRef.current <= 0) {
        setGameOver(true);
        setIsPlaying(false);
        getGameAudio().play('gameOver');
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          localStorage.setItem('breakoutHighScore', scoreRef.current.toString());
        }
        return;
      } else {
        // Reset ball
        balls.push({
          x: width / 2,
          y: height - 60,
          dx: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
          dy: -INITIAL_BALL_SPEED,
          radius: BALL_RADIUS,
        });
        // Reset power-ups
        activePowerUpsRef.current.clear();
        paddle.width = paddle.baseWidth;
        setActivePowerUps([]);
      }
    }

    // Draw lives (hearts)
    ctx.fillStyle = '#ef4444';
    ctx.font = '18px Arial';
    for (let i = 0; i < livesRef.current; i++) {
      ctx.fillText('♥', width - 25 - i * 22, 25);
    }

    if (isPlaying && !gameOver && !won) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver, won, applyPowerUp, highScore]);

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

  // Mouse/Touch controls
  useEffect(() => {
    const handleMove = (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const paddle = paddleRef.current;
      paddle.x = Math.max(0, Math.min(canvasSize.width - paddle.width, x - paddle.width / 2));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleClick = () => {
      if (!isPlaying && !gameOver && !won) {
        setIsPlaying(true);
      } else if (gameOver || won) {
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
  }, [canvasSize, isPlaying, gameOver, won, initGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const paddle = paddleRef.current;
      const moveSpeed = 25;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paddle.x = Math.max(0, paddle.x - moveSpeed);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        paddle.x = Math.min(canvasSize.width - paddle.width, paddle.x + moveSpeed);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!isPlaying && !gameOver && !won) setIsPlaying(true);
        else if (gameOver || won) { initGame(); setIsPlaying(true); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasSize, isPlaying, gameOver, won, initGame]);

  const resetGame = () => {
    initGame();
    setIsPlaying(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Sound toggle
  const toggleSound = useCallback(() => {
    const enabled = getGameAudio().toggle();
    setSoundEnabled(enabled);
  }, []);

  // ESC to exit fullscreen
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
          {/* Active power-ups */}
          {activePowerUps.length > 0 && (
            <div className="flex items-center gap-1">
              {activePowerUps.map(type => (
                <div
                  key={type}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: POWERUP_COLORS[type as PowerUpType] }}
                  title={type}
                >
                  {POWERUP_ICONS[type as PowerUpType]}
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-lg font-bold text-white">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Lives</div>
            <div className="text-lg font-bold text-red-500">{lives}</div>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy size={16} weight="fill" />
            <span className="font-bold">{highScore}</span>
          </div>
          <button onClick={() => gameOver || won ? resetGame() : setIsPlaying(p => !p)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
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
            className="rounded-lg cursor-pointer"
            style={{ touchAction: 'none' }}
          />

          {/* Overlay */}
          {(!isPlaying || gameOver || won) && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              {won ? (
                <>
                  <div className="text-3xl font-bold text-green-500 mb-2">You Win!</div>
                  <div className="text-gray-300 mb-4">Score: {score}</div>
                  <button onClick={() => { initGame(); setIsPlaying(true); }} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold">
                    Play Again
                  </button>
                </>
              ) : gameOver ? (
                <>
                  <div className="text-3xl font-bold text-red-500 mb-2">Game Over!</div>
                  <div className="text-gray-300 mb-4">Score: {score}</div>
                  <button onClick={() => { initGame(); setIsPlaying(true); }} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold">
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-500 mb-4">BREAKOUT</div>
                  <button onClick={() => setIsPlaying(true)} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-2">
                    <Play size={20} weight="fill" /> Start
                  </button>
                  <div className="mt-4 text-gray-400 text-xs text-center">
                    <p className="mb-2">Move mouse/finger or use arrow keys</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {Object.entries(POWERUP_ICONS).map(([type, icon]) => (
                        <div key={type} className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: POWERUP_COLORS[type as PowerUpType] }}>{icon}</span>
                          <span className="text-[10px]">{type}</span>
                        </div>
                      ))}
                    </div>
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

export default BreakoutGame;
