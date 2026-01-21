/**
 * Pong Game - Classic paddle game
 * Play against AI and try to score more points!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface PongGameProps {
  onBack: () => void;
}

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const BALL_SPEED = 5;
const PADDLE_SPEED = 8;
const AI_SPEED = 4;
const WIN_SCORE = 7;

export const PongGame: React.FC<PongGameProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('pongHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Game state refs
  const playerRef = useRef({ y: 0 });
  const aiRef = useRef({ y: 0 });
  const ballRef = useRef({ x: 0, y: 0, dx: 0, dy: 0 });
  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  // Calculate canvas size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 32;
      const maxHeight = container.clientHeight - 32;
      const aspectRatio = 1.5;

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

  const resetBall = useCallback((direction: number = 1) => {
    const { width, height } = canvasSize;
    ballRef.current = {
      x: width / 2,
      y: height / 2,
      dx: BALL_SPEED * direction,
      dy: (Math.random() - 0.5) * BALL_SPEED,
    };
  }, [canvasSize]);

  const initGame = useCallback(() => {
    const { height } = canvasSize;

    playerRef.current = { y: height / 2 - PADDLE_HEIGHT / 2 };
    aiRef.current = { y: height / 2 - PADDLE_HEIGHT / 2 };
    resetBall(Math.random() > 0.5 ? 1 : -1);

    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setWinner(null);
  }, [canvasSize, resetBall]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const player = playerRef.current;
    const ai = aiRef.current;
    const ball = ballRef.current;
    const keys = keysRef.current;

    // Player input
    if (keys.has('ArrowUp') || keys.has('w')) {
      player.y = Math.max(0, player.y - PADDLE_SPEED);
    }
    if (keys.has('ArrowDown') || keys.has('s')) {
      player.y = Math.min(height - PADDLE_HEIGHT, player.y + PADDLE_SPEED);
    }

    // AI movement
    const aiCenter = ai.y + PADDLE_HEIGHT / 2;
    const ballY = ball.y;
    if (aiCenter < ballY - 10) {
      ai.y = Math.min(height - PADDLE_HEIGHT, ai.y + AI_SPEED);
    } else if (aiCenter > ballY + 10) {
      ai.y = Math.max(0, ai.y - AI_SPEED);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom wall collision
    if (ball.y <= 0 || ball.y >= height - BALL_SIZE) {
      ball.dy = -ball.dy;
      ball.y = Math.max(0, Math.min(height - BALL_SIZE, ball.y));
      getGameAudio().play('pongWall');
    }

    // Player paddle collision
    if (
      ball.x <= 30 + PADDLE_WIDTH &&
      ball.x >= 30 &&
      ball.y + BALL_SIZE >= player.y &&
      ball.y <= player.y + PADDLE_HEIGHT
    ) {
      ball.dx = Math.abs(ball.dx) * 1.05;
      const hitPos = (ball.y + BALL_SIZE / 2 - player.y) / PADDLE_HEIGHT - 0.5;
      ball.dy = hitPos * BALL_SPEED * 2;
      ball.x = 30 + PADDLE_WIDTH + 1;
      getGameAudio().play('pongPaddle');
    }

    // AI paddle collision
    if (
      ball.x + BALL_SIZE >= width - 30 - PADDLE_WIDTH &&
      ball.x + BALL_SIZE <= width - 30 &&
      ball.y + BALL_SIZE >= ai.y &&
      ball.y <= ai.y + PADDLE_HEIGHT
    ) {
      ball.dx = -Math.abs(ball.dx) * 1.05;
      const hitPos = (ball.y + BALL_SIZE / 2 - ai.y) / PADDLE_HEIGHT - 0.5;
      ball.dy = hitPos * BALL_SPEED * 2;
      ball.x = width - 30 - PADDLE_WIDTH - BALL_SIZE - 1;
      getGameAudio().play('pongPaddle');
    }

    // Scoring
    if (ball.x < 0) {
      aiScoreRef.current++;
      setAiScore(aiScoreRef.current);
      getGameAudio().play('pongScore');
      if (aiScoreRef.current >= WIN_SCORE) {
        setWinner('ai');
        setGameOver(true);
        setIsPlaying(false);
        getGameAudio().play('gameOver');
        return;
      }
      resetBall(-1);
    } else if (ball.x > width) {
      playerScoreRef.current++;
      setPlayerScore(playerScoreRef.current);
      getGameAudio().play('pongScore');
      if (playerScoreRef.current >= WIN_SCORE) {
        setWinner('player');
        setGameOver(true);
        setIsPlaying(false);
        getGameAudio().play('win');
        if (playerScoreRef.current > highScore) {
          setHighScore(playerScoreRef.current);
          localStorage.setItem('pongHighScore', playerScoreRef.current.toString());
        }
        return;
      }
      resetBall(1);
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(30, player.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.fillRect(width - 30 - PADDLE_WIDTH, ai.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x + BALL_SIZE / 2, ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.fillStyle = '#444';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScoreRef.current.toString(), width / 4, 70);
    ctx.fillText(aiScoreRef.current.toString(), (3 * width) / 4, 70);

    if (isPlaying && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasSize, isPlaying, gameOver, highScore, resetBall]);

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
      if (['ArrowUp', 'ArrowDown', ' ', 'w', 's'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);

      if (e.key === ' ') {
        if (!isPlaying && !gameOver) {
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
  }, [isPlaying, gameOver, initGame]);

  // Touch controls
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      playerRef.current.y = Math.max(0, Math.min(canvasSize.height - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [canvasSize]);

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
            <div className="text-xs text-gray-500">You</div>
            <div className="text-lg font-bold text-green-500">{playerScore}</div>
          </div>
          <div className="text-gray-500">vs</div>
          <div className="text-center">
            <div className="text-xs text-gray-500">AI</div>
            <div className="text-lg font-bold text-red-500">{aiScore}</div>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 ml-2">
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
                  <div className={`text-3xl font-bold ${winner === 'player' ? 'text-green-500' : 'text-red-500'} mb-2`}>
                    {winner === 'player' ? 'You Win!' : 'AI Wins!'}
                  </div>
                  <div className="text-gray-300 mb-4">{playerScore} - {aiScore}</div>
                  <button onClick={() => { initGame(); setIsPlaying(true); }} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold">
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-4">PONG</div>
                  <button onClick={() => setIsPlaying(true)} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center gap-2">
                    <Play size={20} weight="fill" /> Start
                  </button>
                  <div className="mt-4 text-gray-400 text-xs text-center">
                    <p>Move: ↑↓ or W/S or Touch</p>
                    <p>First to {WIN_SCORE} wins!</p>
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

export default PongGame;
