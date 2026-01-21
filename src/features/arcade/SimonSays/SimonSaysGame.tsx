/**
 * Simon Says Game - Memory pattern game
 * Remember and repeat the color sequence!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface SimonSaysGameProps {
  onBack: () => void;
}

type Color = 'green' | 'red' | 'yellow' | 'blue';

const COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];

const COLOR_CONFIG: Record<Color, { bg: string; active: string; note: string }> = {
  green: { bg: 'bg-green-600', active: 'bg-green-400', note: 'simonGreen' },
  red: { bg: 'bg-red-600', active: 'bg-red-400', note: 'simonRed' },
  yellow: { bg: 'bg-yellow-500', active: 'bg-yellow-300', note: 'simonYellow' },
  blue: { bg: 'bg-blue-600', active: 'bg-blue-400', note: 'simonBlue' },
};

export const SimonSaysGame: React.FC<SimonSaysGameProps> = ({ onBack }) => {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('simonSaysHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  const timeoutRef = useRef<NodeJS.Timeout>();

  const playColor = useCallback((color: Color) => {
    setActiveColor(color);
    getGameAudio().play(COLOR_CONFIG[color].note);
    setTimeout(() => setActiveColor(null), 300);
  }, []);

  const showSequence = useCallback(async (seq: Color[]) => {
    setIsShowingSequence(true);
    setPlayerSequence([]);

    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          playColor(seq[i]);
          resolve(null);
        }, 600);
      });
    }

    await new Promise(resolve => {
      timeoutRef.current = setTimeout(() => {
        setIsShowingSequence(false);
        resolve(null);
      }, 400);
    });
  }, [playColor]);

  const addToSequence = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * 4)];
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    showSequence(newSequence);
  }, [sequence, showSequence]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSequence([]);
    setPlayerSequence([]);

    // Start with first color after delay
    const firstColor = COLORS[Math.floor(Math.random() * 4)];
    const newSequence = [firstColor];
    setSequence(newSequence);
    setTimeout(() => showSequence(newSequence), 500);
  }, [showSequence]);

  const handleColorClick = useCallback((color: Color) => {
    if (isShowingSequence || gameOver || !gameStarted) return;

    playColor(color);
    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    const currentIndex = newPlayerSequence.length - 1;

    // Check if correct
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong!
      setGameOver(true);
      getGameAudio().play('simonWrong');

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('simonSaysHighScore', score.toString());
      }
      return;
    }

    // Check if sequence complete
    if (newPlayerSequence.length === sequence.length) {
      // Correct sequence!
      const newScore = score + 1;
      setScore(newScore);
      getGameAudio().play('simonSuccess');

      // Add next color after delay
      setTimeout(() => {
        addToSequence();
      }, 1000);
    }
  }, [isShowingSequence, gameOver, gameStarted, playerSequence, sequence, score, highScore, playColor, addToSequence]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
    <div className={`h-full w-full flex flex-col bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <button onClick={isFullscreen ? () => setIsFullscreen(false) : onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          {isFullscreen ? <X size={18} /> : <ArrowLeft size={18} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Level</div>
            <div className="text-xl font-bold text-white">{score}</div>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy size={18} weight="fill" />
            <span className="font-bold text-lg">{highScore}</span>
          </div>
          <button onClick={startGame} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <ArrowsClockwise size={20} className="text-gray-400" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            {isFullscreen ? <ArrowsIn size={20} className="text-white" /> : <ArrowsOut size={20} className="text-white" />}
          </button>
          <button onClick={toggleSound} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            {soundEnabled ? <SpeakerHigh size={20} className="text-white" /> : <SpeakerSlash size={20} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Simon Board */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
          {/* Center circle */}
          <div className="absolute inset-1/4 bg-gray-800 rounded-full z-10 flex items-center justify-center">
            {!gameStarted ? (
              <button
                onClick={startGame}
                className="w-20 h-20 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white font-bold transition-colors"
              >
                <Play size={32} weight="fill" />
              </button>
            ) : gameOver ? (
              <div className="text-center">
                <div className="text-red-400 font-bold text-sm">Game Over</div>
                <div className="text-white text-xs mt-1">Level {score}</div>
              </div>
            ) : isShowingSequence ? (
              <div className="text-yellow-400 text-sm font-bold">Watch...</div>
            ) : (
              <div className="text-green-400 text-sm font-bold">Your turn!</div>
            )}
          </div>

          {/* Color buttons */}
          <button
            onClick={() => handleColorClick('green')}
            disabled={isShowingSequence || gameOver || !gameStarted}
            className={`absolute top-0 left-0 w-1/2 h-1/2 rounded-tl-full transition-all duration-100
              ${activeColor === 'green' ? COLOR_CONFIG.green.active : COLOR_CONFIG.green.bg}
              ${!isShowingSequence && gameStarted && !gameOver ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}
            `}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 100%, 50% 50%, 0 50%)' }}
          />

          <button
            onClick={() => handleColorClick('red')}
            disabled={isShowingSequence || gameOver || !gameStarted}
            className={`absolute top-0 right-0 w-1/2 h-1/2 rounded-tr-full transition-all duration-100
              ${activeColor === 'red' ? COLOR_CONFIG.red.active : COLOR_CONFIG.red.bg}
              ${!isShowingSequence && gameStarted && !gameOver ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}
            `}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%)' }}
          />

          <button
            onClick={() => handleColorClick('yellow')}
            disabled={isShowingSequence || gameOver || !gameStarted}
            className={`absolute bottom-0 left-0 w-1/2 h-1/2 rounded-bl-full transition-all duration-100
              ${activeColor === 'yellow' ? COLOR_CONFIG.yellow.active : COLOR_CONFIG.yellow.bg}
              ${!isShowingSequence && gameStarted && !gameOver ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}
            `}
            style={{ clipPath: 'polygon(0 50%, 50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%)' }}
          />

          <button
            onClick={() => handleColorClick('blue')}
            disabled={isShowingSequence || gameOver || !gameStarted}
            className={`absolute bottom-0 right-0 w-1/2 h-1/2 rounded-br-full transition-all duration-100
              ${activeColor === 'blue' ? COLOR_CONFIG.blue.active : COLOR_CONFIG.blue.bg}
              ${!isShowingSequence && gameStarted && !gameOver ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}
            `}
            style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%)' }}
          />
        </div>

        {/* Game Over - Restart prompt */}
        {gameOver && (
          <button
            onClick={startGame}
            className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2"
          >
            <Play size={20} weight="fill" /> Play Again
          </button>
        )}

        {!gameStarted && (
          <div className="mt-6 text-gray-400 text-sm text-center">
            Watch the pattern and repeat it!
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default SimonSaysGame;
