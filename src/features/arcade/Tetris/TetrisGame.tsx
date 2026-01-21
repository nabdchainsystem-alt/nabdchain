/**
 * Tetris Game - Classic block stacking puzzle
 * Stack falling blocks to clear lines
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Pause, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface TetrisGameProps {
  onBack: () => void;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 800;

type Cell = string | null;
type Board = Cell[][];

const TETROMINOES: Record<string, { shape: number[][]; color: string }> = {
  I: { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const getRandomTetromino = () => {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  return { type: key, ...TETROMINOES[key] };
};

const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];
  for (let col = 0; col < cols; col++) {
    const newRow: number[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(matrix[row][col]);
    }
    rotated.push(newRow);
  }
  return rotated;
};

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(() => getRandomTetromino());
  const [nextPiece, setNextPiece] = useState(() => getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('tetrisHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate cell size based on container
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight - 40;
      const maxCellSize = Math.floor(height / BOARD_HEIGHT);
      setCellSize(Math.min(Math.max(maxCellSize, 16), 32));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const checkCollision = useCallback((piece: typeof currentPiece, pos: { x: number; y: number }, brd: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && brd[newY][newX]) return true;
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback((piece: typeof currentPiece, pos: { x: number; y: number }, brd: Board): Board => {
    const newBoard = brd.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = pos.y + y;
          const boardX = pos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((brd: Board): { newBoard: Board; cleared: number } => {
    const newBoard = brd.filter(row => row.some(cell => !cell));
    const cleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { newBoard, cleared };
  }, []);

  const spawnNewPiece = useCallback(() => {
    const newPiece = nextPiece;
    const newNext = getRandomTetromino();
    const startPos = { x: Math.floor((BOARD_WIDTH - newPiece.shape[0].length) / 2), y: 0 };

    if (checkCollision(newPiece, startPos, board)) {
      getGameAudio().play('gameOver');
      setGameOver(true);
      setIsPlaying(false);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('tetrisHighScore', score.toString());
      }
      return;
    }

    setCurrentPiece(newPiece);
    setNextPiece(newNext);
    setPosition(startPos);
  }, [nextPiece, board, checkCollision, score, highScore]);

  const moveDown = useCallback(() => {
    const newPos = { ...position, y: position.y + 1 };
    if (checkCollision(currentPiece, newPos, board)) {
      // Lock piece
      const newBoard = mergePiece(currentPiece, position, board);
      const { newBoard: clearedBoard, cleared } = clearLines(newBoard);

      if (cleared > 0) {
        getGameAudio().play(cleared >= 4 ? 'tetrisMultiLine' : 'tetrisLine');
        const points = [0, 100, 300, 500, 800][cleared] * level;
        setScore(s => s + points);
        setLines(l => {
          const newLines = l + cleared;
          const newLevel = Math.floor(newLines / 10) + 1;
          if (newLevel > level) {
            getGameAudio().play('tetrisLevelUp');
          }
          setLevel(newLevel);
          return newLines;
        });
      } else {
        getGameAudio().play('tetrisDrop');
      }

      setBoard(clearedBoard);
      spawnNewPiece();
    } else {
      setPosition(newPos);
    }
  }, [position, currentPiece, board, checkCollision, mergePiece, clearLines, spawnNewPiece, level]);

  const moveHorizontal = useCallback((dir: number) => {
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentPiece, newPos, board)) {
      getGameAudio().play('tetrisMove');
      setPosition(newPos);
    }
  }, [position, currentPiece, board, checkCollision]);

  const rotate = useCallback(() => {
    const rotated = { ...currentPiece, shape: rotateMatrix(currentPiece.shape) };
    if (!checkCollision(rotated, position, board)) {
      getGameAudio().play('tetrisRotate');
      setCurrentPiece(rotated);
    }
  }, [currentPiece, position, board, checkCollision]);

  const hardDrop = useCallback(() => {
    let newY = position.y;
    while (!checkCollision(currentPiece, { ...position, y: newY + 1 }, board)) {
      newY++;
    }
    getGameAudio().play('tetrisDrop');
    setPosition(prev => ({ ...prev, y: newY }));

    const newBoard = mergePiece(currentPiece, { ...position, y: newY }, board);
    const { newBoard: clearedBoard, cleared } = clearLines(newBoard);

    if (cleared > 0) {
      getGameAudio().play(cleared >= 4 ? 'tetrisMultiLine' : 'tetrisLine');
      const points = [0, 100, 300, 500, 800][cleared] * level;
      setScore(s => s + points);
      setLines(l => {
        const newLines = l + cleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          setTimeout(() => getGameAudio().play('tetrisLevelUp'), 100);
        }
        setLevel(newLevel);
        return newLines;
      });
    }

    setBoard(clearedBoard);
    setTimeout(spawnNewPiece, 50);
  }, [position, currentPiece, board, checkCollision, mergePiece, clearLines, spawnNewPiece, level]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const speed = Math.max(INITIAL_SPEED - (level - 1) * 50, 100);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, moveDown, level]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) {
        if (e.key === ' ') {
          e.preventDefault();
          if (gameOver) resetGame();
          else setIsPlaying(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveHorizontal(-1); break;
        case 'ArrowRight': e.preventDefault(); moveHorizontal(1); break;
        case 'ArrowDown': e.preventDefault(); moveDown(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, moveHorizontal, moveDown, rotate, hardDrop]);

  // Touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) {
        // Tap - rotate or start
        if (!isPlaying && !gameOver) setIsPlaying(true);
        else if (gameOver) { resetGame(); setIsPlaying(true); }
        else rotate();
      } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (isPlaying) moveHorizontal(deltaX > 0 ? 1 : -1);
      } else if (deltaY > minSwipe && isPlaying) {
        hardDrop();
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPlaying, gameOver, moveHorizontal, rotate, hardDrop]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setPosition({ x: 3, y: 0 });
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(false);
  }, []);

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

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // Add current piece to display
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = isPlaying || gameOver ? renderBoard() : board;

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
          <div className="text-center">
            <div className="text-xs text-gray-500">Lines</div>
            <div className="text-lg font-bold text-cyan-400">{lines}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Level</div>
            <div className="text-lg font-bold text-purple-400">{level}</div>
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
          <button onClick={toggleSound} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? <SpeakerHigh size={18} className="text-white" /> : <SpeakerSlash size={18} className="text-gray-400" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <ArrowsIn size={18} className="text-white" /> : <ArrowsOut size={18} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center gap-4 p-4 overflow-hidden">
        <div className="relative">
          {/* Board */}
          <div
            className="grid bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${cellSize}px)`,
            }}
          >
            {displayBoard.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className="border border-gray-700/50"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell || '#1f2937',
                    boxShadow: cell ? 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                />
              ))
            )}
          </div>

          {/* Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              {gameOver ? (
                <>
                  <div className="text-2xl font-bold text-white mb-2">Game Over!</div>
                  <div className="text-gray-300 mb-4">Score: {score}</div>
                  <button onClick={() => { resetGame(); setIsPlaying(true); }} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold">
                    Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-purple-500 mb-4">TETRIS</div>
                  <button onClick={() => setIsPlaying(true)} className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2">
                    <Play size={20} weight="fill" /> Start
                  </button>
                  <p className="text-gray-400 mt-3 text-xs text-center">
                    Arrows to move<br/>Up to rotate, Space to drop
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Next piece preview */}
        <div className="hidden sm:block">
          <div className="text-xs text-gray-500 mb-2 text-center">Next</div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(4, ${cellSize * 0.6}px)` }}>
              {Array(4).fill(null).map((_, y) =>
                Array(4).fill(null).map((_, x) => {
                  const pieceY = y - Math.floor((4 - nextPiece.shape.length) / 2);
                  const pieceX = x - Math.floor((4 - nextPiece.shape[0].length) / 2);
                  const filled = pieceY >= 0 && pieceY < nextPiece.shape.length &&
                                 pieceX >= 0 && pieceX < nextPiece.shape[0].length &&
                                 nextPiece.shape[pieceY][pieceX];
                  return (
                    <div
                      key={`next-${y}-${x}`}
                      style={{
                        width: cellSize * 0.6,
                        height: cellSize * 0.6,
                        backgroundColor: filled ? nextPiece.color : '#374151',
                        borderRadius: 2,
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default TetrisGame;
