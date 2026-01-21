/**
 * Snake Game - Classic arcade game with Power-ups
 * Eat food to grow, collect power-ups for special abilities!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface SnakeGameProps {
  onBack: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Segment {
  x: number;
  y: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
}

type PowerUpType = 'speed' | 'slow' | 'ghost' | 'shield' | 'shrink' | 'double';

const SEGMENT_SIZE = 18;
const INITIAL_SPEED = 4;
const FOOD_SIZE = 14;
const POWERUP_SIZE = 20;
const POWERUP_SPAWN_CHANCE = 0.02; // 2% chance per frame when no powerup exists
const POWERUP_DURATION = 8000; // 8 seconds

const POWERUP_COLORS: Record<PowerUpType, string> = {
  speed: '#f97316', // orange - speed boost
  slow: '#06b6d4', // cyan - slow motion
  ghost: '#8b5cf6', // purple - pass through walls
  shield: '#3b82f6', // blue - pass through self
  shrink: '#ec4899', // pink - shrink snake
  double: '#eab308', // yellow - double points
};

const POWERUP_ICONS: Record<PowerUpType, string> = {
  speed: '⚡',
  slow: '◷',
  ghost: '👻',
  shield: '🛡️',
  shrink: '✂️',
  double: '×2',
};

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs for smooth animation
  const snakeRef = useRef<Segment[]>([]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Segment>({ x: 0, y: 0 });
  const powerUpRef = useRef<PowerUp | null>(null);
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const baseSpeedRef = useRef(INITIAL_SPEED);
  const segmentSpacingRef = useRef(SEGMENT_SIZE + 2);
  const scoreMultiplierRef = useRef(1);
  const activePowerUpsRef = useRef<Map<PowerUpType, number>>(new Map());

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate canvas size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const width = container.clientWidth - 32;
      const height = container.clientHeight - 32;
      setCanvasSize({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const generateFood = useCallback((): Segment => {
    const margin = 30;
    return {
      x: margin + Math.random() * (canvasSize.width - margin * 2),
      y: margin + Math.random() * (canvasSize.height - margin * 2),
    };
  }, [canvasSize]);

  const generatePowerUp = useCallback((): PowerUp => {
    const margin = 40;
    const types: PowerUpType[] = ['speed', 'slow', 'ghost', 'shield', 'shrink', 'double'];
    return {
      x: margin + Math.random() * (canvasSize.width - margin * 2),
      y: margin + Math.random() * (canvasSize.height - margin * 2),
      type: types[Math.floor(Math.random() * types.length)],
    };
  }, [canvasSize]);

  const initGame = useCallback(() => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const spacing = segmentSpacingRef.current;

    snakeRef.current = [
      { x: centerX, y: centerY },
      { x: centerX - spacing, y: centerY },
      { x: centerX - spacing * 2, y: centerY },
    ];

    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = generateFood();
    powerUpRef.current = null;
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    baseSpeedRef.current = INITIAL_SPEED;
    scoreMultiplierRef.current = 1;
    activePowerUpsRef.current = new Map();
    setScore(0);
    setGameOver(false);
    setActivePowerUps([]);
  }, [canvasSize, generateFood]);

  useEffect(() => {
    if (canvasSize.width > 0) {
      initGame();
    }
  }, [canvasSize, initGame]);

  const applyPowerUp = useCallback((type: PowerUpType) => {
    const now = Date.now();
    const expireTime = now + POWERUP_DURATION;

    switch (type) {
      case 'speed':
        speedRef.current = baseSpeedRef.current * 1.5;
        activePowerUpsRef.current.set('speed', expireTime);
        break;
      case 'slow':
        speedRef.current = baseSpeedRef.current * 0.5;
        activePowerUpsRef.current.set('slow', expireTime);
        break;
      case 'ghost':
        activePowerUpsRef.current.set('ghost', expireTime);
        break;
      case 'shield':
        activePowerUpsRef.current.set('shield', expireTime);
        break;
      case 'shrink':
        // Instantly shrink snake by 3 segments (min 3 segments)
        const snake = snakeRef.current;
        if (snake.length > 3) {
          const removeCount = Math.min(3, snake.length - 3);
          for (let i = 0; i < removeCount; i++) {
            snake.pop();
          }
        }
        break;
      case 'double':
        scoreMultiplierRef.current = 2;
        activePowerUpsRef.current.set('double', expireTime);
        break;
    }

    // Update active power-ups display
    const activeList: string[] = [];
    activePowerUpsRef.current.forEach((_, key) => activeList.push(key));
    setActivePowerUps(activeList);
  }, []);

  const checkCollision = useCallback((head: Segment): boolean => {
    const margin = SEGMENT_SIZE / 2;
    const hasGhost = activePowerUpsRef.current.has('ghost');
    const hasShield = activePowerUpsRef.current.has('shield');

    // Wall collision (skip if ghost mode)
    if (!hasGhost) {
      if (
        head.x < margin ||
        head.x > canvasSize.width - margin ||
        head.y < margin ||
        head.y > canvasSize.height - margin
      ) {
        return true;
      }
    }

    // Self collision (skip if shield mode)
    if (!hasShield) {
      const snake = snakeRef.current;
      for (let i = 4; i < snake.length; i++) {
        const segment = snake[i];
        const dx = head.x - segment.x;
        const dy = head.y - segment.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < SEGMENT_SIZE * 0.8) {
          return true;
        }
      }
    }

    return false;
  }, [canvasSize]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const snake = snakeRef.current;
    const food = foodRef.current;
    const speed = speedRef.current;
    const powerUp = powerUpRef.current;

    // Check and expire power-ups
    const now = Date.now();
    let powerUpsChanged = false;
    activePowerUpsRef.current.forEach((expireTime, type) => {
      if (now > expireTime) {
        activePowerUpsRef.current.delete(type);
        powerUpsChanged = true;
        if (type === 'speed' || type === 'slow') {
          speedRef.current = baseSpeedRef.current;
        }
        if (type === 'double') {
          scoreMultiplierRef.current = 1;
        }
      }
    });

    if (powerUpsChanged) {
      const activeList: string[] = [];
      activePowerUpsRef.current.forEach((_, key) => activeList.push(key));
      setActivePowerUps(activeList);
    }

    // Spawn power-up randomly
    if (!powerUp && Math.random() < POWERUP_SPAWN_CHANCE) {
      powerUpRef.current = generatePowerUp();
    }

    // Update direction
    directionRef.current = nextDirectionRef.current;

    // Move head
    const head = { ...snake[0] };
    switch (directionRef.current) {
      case 'UP': head.y -= speed; break;
      case 'DOWN': head.y += speed; break;
      case 'LEFT': head.x -= speed; break;
      case 'RIGHT': head.x += speed; break;
    }

    // Wrap around if ghost mode
    if (activePowerUpsRef.current.has('ghost')) {
      if (head.x < 0) head.x = width;
      if (head.x > width) head.x = 0;
      if (head.y < 0) head.y = height;
      if (head.y > height) head.y = 0;
    }

    // Check collision
    if (checkCollision(head)) {
      getGameAudio().play('snakeDie');
      setGameOver(true);
      setIsPlaying(false);
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        localStorage.setItem('snakeHighScore', scoreRef.current.toString());
      }
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    const dx = head.x - food.x;
    const dy = head.y - food.y;
    const distToFood = Math.sqrt(dx * dx + dy * dy);

    if (distToFood < SEGMENT_SIZE / 2 + FOOD_SIZE / 2) {
      getGameAudio().play('snakeEat');
      scoreRef.current += 10 * scoreMultiplierRef.current;
      setScore(scoreRef.current);
      foodRef.current = generateFood();

      if (scoreRef.current % 50 === 0) {
        baseSpeedRef.current = Math.min(baseSpeedRef.current + 0.5, 10);
        if (!activePowerUpsRef.current.has('speed') && !activePowerUpsRef.current.has('slow')) {
          speedRef.current = baseSpeedRef.current;
        }
      }
    } else {
      snake.pop();
    }

    // Check power-up collision
    if (powerUp) {
      const pdx = head.x - powerUp.x;
      const pdy = head.y - powerUp.y;
      const distToPowerUp = Math.sqrt(pdx * pdx + pdy * pdy);

      if (distToPowerUp < SEGMENT_SIZE / 2 + POWERUP_SIZE / 2) {
        getGameAudio().play('snakePowerup');
        applyPowerUp(powerUp.type);
        powerUpRef.current = null;
      }
    }

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw border (with glow if ghost mode)
    const hasGhost = activePowerUpsRef.current.has('ghost');
    if (hasGhost) {
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 15;
    }
    ctx.strokeStyle = hasGhost ? '#8b5cf6' : '#1e3a5f';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.shadowBlur = 0;

    // Draw grid pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw power-up
    if (powerUp) {
      const puPulse = 1 + Math.sin(now / 200) * 0.2;
      const puRadius = (POWERUP_SIZE / 2) * puPulse;

      ctx.shadowColor = POWERUP_COLORS[powerUp.type];
      ctx.shadowBlur = 20;
      ctx.fillStyle = POWERUP_COLORS[powerUp.type];
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, puRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWERUP_ICONS[powerUp.type], powerUp.x, powerUp.y);
    }

    // Draw food with pulse effect
    const pulseScale = 1 + Math.sin(now / 150) * 0.15;
    const foodRadius = (FOOD_SIZE / 2) * pulseScale;

    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x, food.y, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(food.x - 2, food.y - 2, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Determine snake color based on active power-ups
    let snakeColor = '#22c55e'; // default green
    let snakeGlow = '#22c55e';
    const hasShield = activePowerUpsRef.current.has('shield');
    const hasSpeed = activePowerUpsRef.current.has('speed');
    const hasSlow = activePowerUpsRef.current.has('slow');
    const hasDouble = activePowerUpsRef.current.has('double');

    if (hasGhost) {
      snakeColor = '#8b5cf6';
      snakeGlow = '#8b5cf6';
    } else if (hasShield) {
      snakeColor = '#3b82f6';
      snakeGlow = '#3b82f6';
    } else if (hasSpeed) {
      snakeColor = '#f97316';
      snakeGlow = '#f97316';
    } else if (hasSlow) {
      snakeColor = '#06b6d4';
      snakeGlow = '#06b6d4';
    } else if (hasDouble) {
      snakeColor = '#eab308';
      snakeGlow = '#eab308';
    }

    // Draw snake
    ctx.shadowColor = snakeGlow;
    ctx.shadowBlur = 15;

    for (let i = snake.length - 1; i >= 0; i--) {
      const segment = snake[i];
      const progress = i / snake.length;
      const size = SEGMENT_SIZE * (0.6 + 0.4 * (1 - progress));

      // Parse the base color and adjust brightness
      const alpha = hasGhost ? 0.7 : 1;
      if (snakeColor.startsWith('#')) {
        const r = parseInt(snakeColor.slice(1, 3), 16);
        const g = parseInt(snakeColor.slice(3, 5), 16);
        const b = parseInt(snakeColor.slice(5, 7), 16);
        const darken = 1 - progress * 0.4;
        ctx.fillStyle = `rgba(${Math.floor(r * darken)}, ${Math.floor(g * darken)}, ${Math.floor(b * darken)}, ${alpha})`;
      }

      if (i === 0) {
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, size / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        const eyeOffset = size / 4;
        let eye1X, eye1Y, eye2X, eye2Y;

        switch (directionRef.current) {
          case 'RIGHT':
            eye1X = segment.x + 4; eye1Y = segment.y - eyeOffset;
            eye2X = segment.x + 4; eye2Y = segment.y + eyeOffset;
            break;
          case 'LEFT':
            eye1X = segment.x - 4; eye1Y = segment.y - eyeOffset;
            eye2X = segment.x - 4; eye2Y = segment.y + eyeOffset;
            break;
          case 'UP':
            eye1X = segment.x - eyeOffset; eye1Y = segment.y - 4;
            eye2X = segment.x + eyeOffset; eye2Y = segment.y - 4;
            break;
          default:
            eye1X = segment.x - eyeOffset; eye1Y = segment.y + 4;
            eye2X = segment.x + eyeOffset; eye2Y = segment.y + 4;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, 4, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(eye1X + 1, eye1Y, 2, 0, Math.PI * 2);
        ctx.arc(eye2X + 1, eye2Y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowBlur = i < 3 ? 10 : 0;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver, checkCollision, generateFood, generatePowerUp, applyPowerUp, highScore]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) {
          initGame();
          setIsPlaying(true);
        } else {
          setIsPlaying(p => !p);
        }
        return;
      }

      if (!isPlaying) return;

      const currentDir = directionRef.current;
      let newDirection: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp': if (currentDir !== 'DOWN') newDirection = 'UP'; break;
        case 'ArrowDown': if (currentDir !== 'UP') newDirection = 'DOWN'; break;
        case 'ArrowLeft': if (currentDir !== 'RIGHT') newDirection = 'LEFT'; break;
        case 'ArrowRight': if (currentDir !== 'LEFT') newDirection = 'RIGHT'; break;
      }

      if (newDirection) {
        nextDirectionRef.current = newDirection;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, initGame]);

  // Touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) {
        if (!isPlaying && !gameOver) {
          setIsPlaying(true);
        } else if (gameOver) {
          initGame();
          setIsPlaying(true);
        }
        touchStartRef.current = null;
        return;
      }

      if (!isPlaying) {
        touchStartRef.current = null;
        return;
      }

      const currentDir = directionRef.current;
      let newDirection: Direction | null = null;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipe && currentDir !== 'LEFT') newDirection = 'RIGHT';
        else if (deltaX < -minSwipe && currentDir !== 'RIGHT') newDirection = 'LEFT';
      } else {
        if (deltaY > minSwipe && currentDir !== 'UP') newDirection = 'DOWN';
        else if (deltaY < -minSwipe && currentDir !== 'DOWN') newDirection = 'UP';
      }

      if (newDirection) {
        nextDirectionRef.current = newDirection;
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPlaying, gameOver, initGame]);

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

  // Draw initial state
  useEffect(() => {
    if (!isPlaying && !gameOver && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasSize;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      const snake = snakeRef.current;
      snake.forEach((segment, i) => {
        const progress = i / snake.length;
        const size = SEGMENT_SIZE * (0.6 + 0.4 * (1 - progress));
        const green = Math.floor(200 - progress * 80);
        ctx.fillStyle = `rgb(34, ${green}, 80)`;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      const food = foodRef.current;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(food.x, food.y, FOOD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [canvasSize, isPlaying, gameOver]);

  const gameContent = (
    <div className={`h-full w-full flex flex-col bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <button
          onClick={isFullscreen ? () => setIsFullscreen(false) : onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
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

          <div className="flex items-center gap-2 text-white">
            <span className="text-gray-400 text-sm">Score:</span>
            <span className="font-bold text-lg">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy size={16} weight="fill" />
            <span className="font-bold">{highScore}</span>
          </div>
          <button
            onClick={() => gameOver ? resetGame() : setIsPlaying(p => !p)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowsClockwise size={18} className="text-gray-400" />
          </button>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <SpeakerHigh size={18} className="text-white" /> : <SpeakerSlash size={18} className="text-gray-400" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <ArrowsIn size={18} className="text-white" /> : <ArrowsOut size={18} className="text-white" />}
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
          />

          {/* Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              {gameOver ? (
                <>
                  <div className="text-3xl font-bold text-white mb-2">Game Over!</div>
                  <div className="text-xl text-gray-300 mb-6">Score: {score}</div>
                  <button
                    onClick={() => { initGame(); setIsPlaying(true); }}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors"
                  >
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-green-500 mb-4">SNAKE</div>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl transition-colors flex items-center gap-3"
                  >
                    <Play size={24} weight="fill" />
                    Start Game
                  </button>
                  <p className="text-gray-400 mt-4 text-sm">
                    Swipe or use arrow keys to move
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-xs">
                    {Object.entries(POWERUP_ICONS).map(([type, icon]) => (
                      <div key={type} className="flex items-center gap-1">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white"
                          style={{ backgroundColor: POWERUP_COLORS[type as PowerUpType] }}
                        >
                          {icon}
                        </span>
                        <span className="text-[10px] text-gray-500">{type}</span>
                      </div>
                    ))}
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

export default SnakeGame;
