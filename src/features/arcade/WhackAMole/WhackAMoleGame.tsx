/**
 * Whack-a-Mole Game - Classic reaction game
 * Hit the moles as they pop up!
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Play, Timer, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface WhackAMoleGameProps {
  onBack: () => void;
}

interface Mole {
  id: number;
  isUp: boolean;
  isHit: boolean;
  isGolden: boolean;
}

const GRID_SIZE = 9;
const GAME_DURATION = 30;

export const WhackAMoleGame: React.FC<WhackAMoleGameProps> = ({ onBack }) => {
  const [moles, setMoles] = useState<Mole[]>(() =>
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isUp: false,
      isHit: false,
      isGolden: false,
    }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('whackAMoleHighScore') || '0', 10);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());
  const [combo, setCombo] = useState(0);

  const moleIntervalRef = useRef<NodeJS.Timeout>();
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const scoreRef = useRef(0);

  const resetMoles = useCallback(() => {
    setMoles(
      Array.from({ length: GRID_SIZE }, (_, i) => ({
        id: i,
        isUp: false,
        isHit: false,
        isGolden: false,
      }))
    );
  }, []);

  const startGame = useCallback(() => {
    resetMoles();
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setIsPlaying(true);
    setCombo(0);
  }, [resetMoles]);

  // Mole spawning
  useEffect(() => {
    if (!isPlaying) return;

    const spawnMole = () => {
      setMoles(prev => {
        const upCount = prev.filter(m => m.isUp && !m.isHit).length;
        if (upCount >= 3) return prev;

        const availableMoles = prev.filter(m => !m.isUp && !m.isHit);
        if (availableMoles.length === 0) return prev;

        const randomMole = availableMoles[Math.floor(Math.random() * availableMoles.length)];
        const isGolden = Math.random() < 0.1; // 10% chance for golden mole

        return prev.map(m =>
          m.id === randomMole.id
            ? { ...m, isUp: true, isHit: false, isGolden }
            : m
        );
      });
    };

    // Spawn interval decreases as time goes on
    const baseInterval = 1000;
    const minInterval = 400;
    const progress = (GAME_DURATION - timeLeft) / GAME_DURATION;
    const interval = Math.max(minInterval, baseInterval - progress * 500);

    moleIntervalRef.current = setInterval(spawnMole, interval);

    return () => {
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
      }
    };
  }, [isPlaying, timeLeft]);

  // Auto-hide moles
  useEffect(() => {
    if (!isPlaying) return;

    const hideMoles = () => {
      setMoles(prev =>
        prev.map(m => {
          if (m.isUp && !m.isHit && Math.random() < 0.3) {
            return { ...m, isUp: false };
          }
          return m;
        })
      );
    };

    const interval = setInterval(hideMoles, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setGameOver(true);

          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('whackAMoleHighScore', scoreRef.current.toString());
          }

          getGameAudio().play('gameOver');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isPlaying, highScore]);

  const whackMole = useCallback((id: number) => {
    if (!isPlaying) return;

    setMoles(prev => {
      const mole = prev.find(m => m.id === id);
      if (!mole || !mole.isUp || mole.isHit) return prev;

      // Hit!
      const points = mole.isGolden ? 50 : 10;
      const newScore = scoreRef.current + points;
      scoreRef.current = newScore;
      setScore(newScore);
      setCombo(c => c + 1);

      getGameAudio().play(mole.isGolden ? 'moleGolden' : 'moleHit');

      // Hide mole after hit animation
      setTimeout(() => {
        setMoles(p => p.map(m => (m.id === id ? { ...m, isUp: false, isHit: false } : m)));
      }, 200);

      return prev.map(m => (m.id === id ? { ...m, isHit: true } : m));
    });
  }, [isPlaying]);

  // Reset combo when missing
  useEffect(() => {
    if (!isPlaying) return;

    const checkMiss = () => {
      const hasUpMole = moles.some(m => m.isUp && !m.isHit);
      if (!hasUpMole) {
        setCombo(0);
      }
    };

    const interval = setInterval(checkMiss, 500);
    return () => clearInterval(interval);
  }, [isPlaying, moles]);

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
    <div className={`h-full w-full flex flex-col bg-gradient-to-b from-green-800 to-green-900 ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-green-700">
        <button onClick={isFullscreen ? () => setIsFullscreen(false) : onBack} className="flex items-center gap-2 text-green-200 hover:text-white transition-colors text-sm">
          {isFullscreen ? <X size={18} /> : <ArrowLeft size={18} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Timer size={20} />
            <span className={`font-bold text-xl ${timeLeft <= 10 ? 'text-red-400' : ''}`}>{timeLeft}s</span>
          </div>
          <div className="text-center">
            <div className="text-xs text-green-300">Score</div>
            <div className="text-xl font-bold text-white">{score}</div>
          </div>
          {combo >= 3 && (
            <div className="text-yellow-400 font-bold text-sm animate-pulse">
              {combo}x Combo!
            </div>
          )}
          <div className="flex items-center gap-1 text-yellow-400">
            <Trophy size={18} weight="fill" />
            <span className="font-bold">{highScore}</span>
          </div>
          <button onClick={startGame} className="p-2 rounded-lg bg-green-700 hover:bg-green-600">
            <ArrowsClockwise size={20} className="text-green-200" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-green-700 hover:bg-green-600">
            {isFullscreen ? <ArrowsIn size={20} className="text-white" /> : <ArrowsOut size={20} className="text-white" />}
          </button>
          <button onClick={toggleSound} className="p-2 rounded-lg bg-green-700 hover:bg-green-600">
            {soundEnabled ? <SpeakerHigh size={20} className="text-white" /> : <SpeakerSlash size={20} className="text-green-400" />}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          {/* Mole Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {moles.map(mole => (
              <button
                key={mole.id}
                onClick={() => whackMole(mole.id)}
                disabled={!isPlaying || !mole.isUp}
                className={`
                  relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
                  bg-amber-900 rounded-full overflow-hidden
                  border-4 border-amber-800
                  transition-transform
                  ${mole.isUp && !mole.isHit ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                `}
              >
                {/* Hole */}
                <div className="absolute inset-2 bg-black/50 rounded-full" />

                {/* Mole */}
                <div
                  className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2
                    w-14 sm:w-16 md:w-20 h-16 sm:h-20 md:h-24
                    transition-all duration-150
                    ${mole.isUp ? 'translate-y-1/4' : 'translate-y-full'}
                    ${mole.isHit ? 'scale-90' : ''}
                  `}
                >
                  {/* Mole body */}
                  <div className={`
                    w-full h-full rounded-t-full
                    ${mole.isGolden ? 'bg-yellow-400' : 'bg-amber-700'}
                    relative
                  `}>
                    {/* Eyes */}
                    <div className="absolute top-4 left-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full">
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full" />
                    </div>
                    <div className="absolute top-4 right-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full">
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full" />
                    </div>
                    {/* Nose */}
                    <div className={`absolute top-7 sm:top-8 left-1/2 -translate-x-1/2 w-3 h-2 sm:w-4 sm:h-3 rounded-full ${mole.isGolden ? 'bg-amber-600' : 'bg-pink-400'}`} />
                    {/* Hit indicator */}
                    {mole.isHit && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">💥</span>
                      </div>
                    )}
                    {/* Golden sparkle */}
                    {mole.isGolden && !mole.isHit && (
                      <div className="absolute -top-1 -right-1 text-xl animate-pulse">✨</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Start / Game Over Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center">
              {gameOver ? (
                <>
                  <div className="text-3xl font-bold text-white mb-2">Time's Up!</div>
                  <div className="text-2xl text-yellow-400 mb-4">Score: {score}</div>
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold flex items-center gap-2"
                  >
                    <Play size={20} weight="fill" /> Play Again
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-4">WHACK-A-MOLE</div>
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold flex items-center gap-2"
                  >
                    <Play size={20} weight="fill" /> Start Game
                  </button>
                  <div className="mt-4 text-green-200 text-sm text-center">
                    <p>Tap the moles as they pop up!</p>
                    <p className="text-yellow-400">⭐ Golden moles = 50 points!</p>
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

export default WhackAMoleGame;
