/**
 * Sudoku Game - Classic number puzzle
 * Fill the 9x9 grid so every row, column, and 3x3 box contains 1-9
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Timer, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash, Lightbulb, Eraser } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface SudokuGameProps {
  onBack: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, number> = {
  easy: 38,    // 38 cells revealed
  medium: 30,  // 30 cells revealed
  hard: 24,    // 24 cells revealed
};

// Generate a valid solved Sudoku grid
const generateSolvedGrid = (): number[][] => {
  const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  const isValid = (grid: number[][], row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  };

  const solve = (grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  solve(grid);
  return grid;
};

// Create puzzle by removing numbers from solved grid
const createPuzzle = (solved: number[][], revealCount: number): number[][] => {
  const puzzle = solved.map(row => [...row]);
  const positions: [number, number][] = [];

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  // Shuffle positions
  positions.sort(() => Math.random() - 0.5);

  // Remove numbers to leave only revealCount cells
  const toRemove = 81 - revealCount;
  for (let i = 0; i < toRemove; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = 0;
  }

  return puzzle;
};

export const SudokuGame: React.FC<SudokuGameProps> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [solvedGrid, setSolvedGrid] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [currentGrid, setCurrentGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [hints, setHints] = useState(3);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number>>(() => {
    const saved = localStorage.getItem('sudokuBestTimes');
    return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0 };
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  const initGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty || difficulty;
    setDifficulty(diff);

    const solved = generateSolvedGrid();
    const puzzle = createPuzzle(solved, DIFFICULTY_CONFIG[diff]);

    setSolvedGrid(solved);
    setInitialGrid(puzzle.map(row => [...row]));
    setCurrentGrid(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setErrors(new Set());
    setTimer(0);
    setIsPlaying(false);
    setGameWon(false);
    setHints(3);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameWon) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameWon]);

  const checkErrors = useCallback((grid: number[][]): Set<string> => {
    const errorSet = new Set<string>();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = grid[row][col];
        if (num === 0) continue;

        // Check row
        for (let x = 0; x < 9; x++) {
          if (x !== col && grid[row][x] === num) {
            errorSet.add(`${row}-${col}`);
            errorSet.add(`${row}-${x}`);
          }
        }

        // Check column
        for (let x = 0; x < 9; x++) {
          if (x !== row && grid[x][col] === num) {
            errorSet.add(`${row}-${col}`);
            errorSet.add(`${x}-${col}`);
          }
        }

        // Check 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = startRow + i;
            const c = startCol + j;
            if ((r !== row || c !== col) && grid[r][c] === num) {
              errorSet.add(`${row}-${col}`);
              errorSet.add(`${r}-${c}`);
            }
          }
        }
      }
    }

    return errorSet;
  }, []);

  const checkWin = useCallback((grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false;
      }
    }
    return checkErrors(grid).size === 0;
  }, [checkErrors]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameWon) return;
    if (initialGrid[row][col] !== 0) return; // Can't select initial cells

    if (!isPlaying) setIsPlaying(true);
    setSelectedCell([row, col]);
    getGameAudio().play('click');
  }, [initialGrid, gameWon, isPlaying]);

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || gameWon) return;
    const [row, col] = selectedCell;
    if (initialGrid[row][col] !== 0) return;

    const newGrid = currentGrid.map(r => [...r]);
    newGrid[row][col] = num;
    setCurrentGrid(newGrid);

    const newErrors = checkErrors(newGrid);
    setErrors(newErrors);

    if (num !== 0 && newErrors.has(`${row}-${col}`)) {
      getGameAudio().play('sudokuError');
    } else if (num !== 0) {
      getGameAudio().play('sudokuPlace');
    }

    if (checkWin(newGrid)) {
      setGameWon(true);
      setIsPlaying(false);
      getGameAudio().play('win');

      const currentBest = bestTimes[difficulty];
      if (currentBest === 0 || timer < currentBest) {
        const newBestTimes = { ...bestTimes, [difficulty]: timer };
        setBestTimes(newBestTimes);
        localStorage.setItem('sudokuBestTimes', JSON.stringify(newBestTimes));
      }
    }
  }, [selectedCell, currentGrid, initialGrid, gameWon, checkErrors, checkWin, difficulty, timer, bestTimes]);

  const handleHint = useCallback(() => {
    if (hints <= 0 || gameWon || !selectedCell) return;
    const [row, col] = selectedCell;
    if (initialGrid[row][col] !== 0) return;

    const newGrid = currentGrid.map(r => [...r]);
    newGrid[row][col] = solvedGrid[row][col];
    setCurrentGrid(newGrid);
    setHints(h => h - 1);
    getGameAudio().play('sudokuHint');

    const newErrors = checkErrors(newGrid);
    setErrors(newErrors);

    if (checkWin(newGrid)) {
      setGameWon(true);
      setIsPlaying(false);
      getGameAudio().play('win');
    }
  }, [hints, selectedCell, currentGrid, initialGrid, solvedGrid, gameWon, checkErrors, checkWin]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleNumberInput(0);
      } else if (e.key === 'h' && hints > 0 && selectedCell) {
        handleHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, handleHint, hints, selectedCell]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const gameContent = (
    <div className={`h-full w-full flex flex-col bg-[#FCFCFD] dark:bg-gray-900 overflow-auto ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <button onClick={isFullscreen ? () => setIsFullscreen(false) : onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
            {isFullscreen ? <X size={20} /> : <ArrowLeft size={20} />}
            <span>{isFullscreen ? 'Exit' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Timer size={18} />
              <span className="font-mono font-bold">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Lightbulb size={18} weight="fill" />
              <span className="font-bold">{hints}</span>
            </div>
            {bestTimes[difficulty] > 0 && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <Trophy size={16} weight="fill" />
                <span className="font-bold text-sm">{formatTime(bestTimes[difficulty])}</span>
              </div>
            )}
            <button onClick={() => initGame()} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowsClockwise size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {isFullscreen ? <ArrowsIn size={20} className="text-gray-600 dark:text-gray-400" /> : <ArrowsOut size={20} className="text-gray-600 dark:text-gray-400" />}
            </button>
            <button onClick={toggleSound} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {soundEnabled ? <SpeakerHigh size={20} className="text-gray-600 dark:text-gray-400" /> : <SpeakerSlash size={20} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex justify-center gap-2 mt-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => initGame(diff)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                difficulty === diff
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <div className="relative">
          {/* Sudoku Grid */}
          <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800">
            {currentGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                const isInitial = initialGrid[rowIndex][colIndex] !== 0;
                const hasError = errors.has(`${rowIndex}-${colIndex}`);
                const isHighlighted = selectedCell && (
                  selectedCell[0] === rowIndex ||
                  selectedCell[1] === colIndex ||
                  (Math.floor(selectedCell[0] / 3) === Math.floor(rowIndex / 3) &&
                   Math.floor(selectedCell[1] / 3) === Math.floor(colIndex / 3))
                );

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center
                      text-lg sm:text-xl font-bold transition-colors
                      ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-gray-800 dark:border-gray-300' : 'border-r border-gray-300 dark:border-gray-600'}
                      ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-gray-800 dark:border-gray-300' : 'border-b border-gray-300 dark:border-gray-600'}
                      ${isSelected ? 'bg-blue-200 dark:bg-blue-900' : isHighlighted ? 'bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-gray-800'}
                      ${hasError ? 'text-red-500' : isInitial ? 'text-gray-800 dark:text-gray-200' : 'text-blue-600 dark:text-blue-400'}
                      ${!isInitial ? 'hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    {cell !== 0 ? cell : ''}
                  </button>
                );
              })
            )}
          </div>

          {/* Win Overlay */}
          {gameWon && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-2">Completed!</div>
              <div className="text-white mb-4">Time: {formatTime(timer)}</div>
              <button
                onClick={() => initGame()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                New Game
              </button>
            </div>
          )}
        </div>

        {/* Number Pad */}
        <div className="flex gap-2 flex-wrap justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              disabled={!selectedCell || gameWon}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-lg transition-colors disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleNumberInput(0)}
            disabled={!selectedCell || gameWon}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={handleHint}
            disabled={hints <= 0 || !selectedCell || gameWon}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center"
            title={`Hint (${hints} left)`}
          >
            <Lightbulb size={20} weight="fill" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 p-3 text-center text-gray-500 dark:text-gray-400 text-xs border-t border-gray-200 dark:border-gray-700/50">
        Click a cell, then enter a number (1-9) • Press H for hint
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default SudokuGame;
