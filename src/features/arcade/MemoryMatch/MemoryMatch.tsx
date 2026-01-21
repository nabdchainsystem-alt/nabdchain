/**
 * Memory Match Game - Card matching puzzle
 * Find all matching pairs with minimum moves
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowsClockwise, Trophy, Timer, ArrowsOut, ArrowsIn, X, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { getGameAudio } from '../utils/GameAudio';

interface MemoryMatchProps {
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹', '🎲', '🎰', '🎳'];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const createCards = (pairCount: number): Card[] => {
  const selectedEmojis = EMOJIS.slice(0, pairCount);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  const shuffled = shuffleArray(pairs);

  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
};

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: string }> = {
  easy: { pairs: 6, cols: 'grid-cols-4' },
  medium: { pairs: 8, cols: 'grid-cols-4' },
  hard: { pairs: 12, cols: 'grid-cols-6' },
};

export const MemoryMatch: React.FC<MemoryMatchProps> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<Card[]>(() => createCards(DIFFICULTY_CONFIG.medium.pairs));
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>(() => {
    const saved = localStorage.getItem('memoryMatchBestScores');
    return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0 };
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => getGameAudio().isEnabled());

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameWon) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameWon]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsProcessing(true);
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        getGameAudio().play('cardMatch');
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(m => m + 1);
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // No match - flip back
        getGameAudio().play('cardNoMatch');
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  // Check for win
  useEffect(() => {
    const pairCount = DIFFICULTY_CONFIG[difficulty].pairs;
    if (matches === pairCount && gameStarted) {
      setGameWon(true);
      getGameAudio().play('memoryWin');

      // Save best score (fewer moves is better)
      const currentBest = bestScores[difficulty];
      if (currentBest === 0 || moves < currentBest) {
        const newBestScores = { ...bestScores, [difficulty]: moves };
        setBestScores(newBestScores);
        localStorage.setItem('memoryMatchBestScores', JSON.stringify(newBestScores));
      }
    }
  }, [matches, difficulty, gameStarted, moves, bestScores]);

  const handleCardClick = useCallback((index: number) => {
    if (isProcessing) return;
    if (flippedCards.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    setCards(prev => prev.map((card, idx) =>
      idx === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
    getGameAudio().play('cardFlip');

    if (flippedCards.length === 1) {
      setMoves(m => m + 1);
    }
  }, [cards, flippedCards, gameStarted, isProcessing]);

  const resetGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty || difficulty;
    setDifficulty(diff);
    setCards(createCards(DIFFICULTY_CONFIG[diff].pairs));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setGameWon(false);
    setTimer(0);
    setIsProcessing(false);
  }, [difficulty]);

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
      if (e.key === 'Escape' && isFullscreen && !gameStarted) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen, gameStarted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const config = DIFFICULTY_CONFIG[difficulty];

  const gameContent = (
    <div className={`h-full w-full flex flex-col bg-[#FCFCFD] dark:bg-gray-900 overflow-auto ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <button
            onClick={isFullscreen ? () => setIsFullscreen(false) : onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            {isFullscreen ? <X size={20} /> : <ArrowLeft size={20} />}
            <span>{isFullscreen ? 'Exit' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Timer size={12} />Time
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">{formatTime(timer)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Moves</div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">{moves}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Trophy size={12} weight="fill" className="text-yellow-500" />Best
              </div>
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {bestScores[difficulty] || '-'}
              </div>
            </div>
            <button
              onClick={() => resetGame()}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="New Game"
            >
              <ArrowsClockwise size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <ArrowsIn size={20} className="text-gray-600 dark:text-gray-400" /> : <ArrowsOut size={20} className="text-gray-600 dark:text-gray-400" />}
            </button>
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <SpeakerHigh size={20} className="text-gray-600 dark:text-gray-400" /> : <SpeakerSlash size={20} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex justify-center gap-2 mt-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => resetGame(diff)}
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

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <div className={`grid ${config.cols} gap-2 sm:gap-3`}>
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                disabled={card.isMatched || card.isFlipped || isProcessing}
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl
                  flex items-center justify-center text-2xl sm:text-3xl
                  transition-all duration-300 transform
                  ${card.isFlipped || card.isMatched
                    ? 'bg-white dark:bg-gray-700 shadow-md rotate-0'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:scale-105 cursor-pointer'
                  }
                  ${card.isMatched ? 'opacity-70 scale-95' : ''}
                `}
                style={{
                  perspective: '1000px',
                }}
              >
                {(card.isFlipped || card.isMatched) ? (
                  <span className="animate-fadeIn">{card.emoji}</span>
                ) : (
                  <span className="text-white text-lg font-bold">?</span>
                )}
              </button>
            ))}
          </div>

          {/* Win Overlay */}
          {gameWon && (
            <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-xl font-bold text-white mb-2">You Won!</div>
              <div className="text-gray-300 mb-4">
                {moves} moves in {formatTime(timer)}
              </div>
              <button
                onClick={() => resetGame()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 p-4 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700/50">
        Find all matching pairs. Fewer moves = better score!
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default MemoryMatch;
