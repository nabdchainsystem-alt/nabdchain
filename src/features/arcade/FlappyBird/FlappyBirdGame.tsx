/**
 * Flappy Bird Game - Tap to fly through pipes
 * Simple but addictive arcade game
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface FlappyBirdGameProps {
  onBack: () => void;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -9;
const PIPE_SPEED = 3;

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('flappyBirdHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs
  const birdRef = useRef({ y: 0, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);

  // Calculate canvas size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32;
      const maxHeight = container.clientHeight - 32;
      const aspectRatio = 0.65;

      let height = maxHeight;
      let width = height * aspectRatio;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const initGame = useCallback(() => {
    birdRef.current = {
      y: canvasSize.height / 2,
      velocity: 0,
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, [canvasSize]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const jump = useCallback(() => {
    if (!isPlaying && !gameOver) {
      setIsPlaying(true);
      birdRef.current.velocity = JUMP_FORCE;
      getGameAudio().play('flap');
    } else if (gameOver) {
      initGame();
      setIsPlaying(true);
      birdRef.current.velocity = JUMP_FORCE;
      getGameAudio().play('flap');
    } else if (isPlaying) {
      birdRef.current.velocity = JUMP_FORCE;
      getGameAudio().play('flap');
    }
  }, [isPlaying, gameOver, initGame]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const bird = birdRef.current;
    const pipes = pipesRef.current;

    frameRef.current++;

    // Clear and draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const cloudX = ((frameRef.current * 0.5 + i * 150) % (width + 100)) - 50;
      ctx.beginPath();
      ctx.arc(cloudX, 60 + i * 40, 30, 0, Math.PI * 2);
      ctx.arc(cloudX + 25, 55 + i * 40, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 50, 60 + i * 40, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Draw bird
    const birdX = 80;
    ctx.save();
    ctx.translate(birdX, bird.y);
    ctx.rotate(Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5));

    // Body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-5, 5, BIRD_SIZE / 4, BIRD_SIZE / 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 3);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Spawn pipes
    if (frameRef.current % 100 === 0) {
      const gapY = Math.random() * (height - PIPE_GAP - 100) + 50;
      pipes.push({ x: width, gapY, passed: false });
    }

    // Update and draw pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= PIPE_SPEED;

      // Draw pipe
      ctx.fillStyle = '#2ECC71';
      ctx.strokeStyle = '#27AE60';
      ctx.lineWidth = 3;

      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      ctx.fillRect(pipe.x - 5, pipe.gapY - 25, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.gapY - 25, PIPE_WIDTH + 10, 25);

      // Bottom pipe
      const bottomY = pipe.gapY + PIPE_GAP;
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, height - bottomY);
      ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, height - bottomY);
      ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 25);

      // Check collision
      const birdLeft = birdX - BIRD_SIZE / 2 + 5;
      const birdRight = birdX + BIRD_SIZE / 2 - 5;
      const birdTop = bird.y - BIRD_SIZE / 2.5 + 5;
      const birdBottom = bird.y + BIRD_SIZE / 2.5 - 5;

      if (
        birdRight > pipe.x &&
        birdLeft < pipe.x + PIPE_WIDTH &&
        (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP)
      ) {
        endGame();
        return;
      }

      // Score
      if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
        pipe.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        getGameAudio().play('flappyScore');
      }

      // Remove off-screen pipes
      if (pipe.x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
      }
    }

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height - 20, width, 20);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, height - 25, width, 5);

    // Check bounds
    if (bird.y + BIRD_SIZE / 2 > height - 20 || bird.y - BIRD_SIZE / 2 < 0) {
      endGame();
      return;
    }

    // Draw score
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(scoreRef.current.toString(), width / 2, 60);
    ctx.fillText(scoreRef.current.toString(), width / 2, 60);

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver]);

  const endGame = useCallback(() => {
    setGameOver(true);
    setIsPlaying(false);
    getGameAudio().play('flappyDie');
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('flappyBirdHighScore', scoreRef.current.toString());
    }
  }, [highScore]);

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

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => jump();
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleTouch, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleTouch);
      }
    };
  }, [jump]);

  // Draw initial state
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasSize;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F7FA');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, height - 20, width, 20);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, height - 25, width, 5);

      // Bird at center
      const birdX = 80;
      const birdY = height / 2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(birdX, birdY, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(birdX + 8, birdY - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(birdX + 10, birdY - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.moveTo(birdX + 15, birdY);
      ctx.lineTo(birdX + 25, birdY + 3);
      ctx.lineTo(birdX + 15, birdY + 6);
      ctx.closePath();
      ctx.fill();
    }
  }, [canvasSize, isPlaying, gameOver]);

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

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-lg font-bold text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy size={16} weight="fill" />
            <span className="font-bold">{highScore}</span>
          </div>
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
            className="rounded-lg shadow-2xl cursor-pointer"
          />

          {/* Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
              {gameOver ? (
                <>
                  <div className="text-3xl font-bold text-white mb-2">Game Over!</div>
                  <div className="text-xl text-gray-300 mb-6">Score: {score}</div>
                  <button onClick={jump} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-lg">
                    Tap to Retry
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-yellow-400 mb-4">FLAPPY BIRD</div>
                  <button onClick={jump} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-xl flex items-center gap-3">
                    <Play size={24} weight="fill" />
                    Tap to Start
                  </button>
                  <p className="text-white/70 mt-4 text-sm">
                    Tap or press Space to fly
                  </p>
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

export default FlappyBirdGame;
