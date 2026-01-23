/**
 * Arcade Page - Game Selection Hub
 * Lists available games and provides navigation
 */

import React, { useState, Suspense } from 'react';
import {
  GameController,
  Rocket,
  ArrowLeft,
  Trophy,
  Brain,
  Path,
  Cube,
  CirclesFour,
  Bird,
  Skull,
  Globe,
  Rows,
  MusicNote,
  Target,
  GridFour,
} from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';

// Lazy load game components to avoid loading game code until needed
const SpaceShooterGame = React.lazy(() => import('./SpaceShooter/SpaceShooterGame'));
const MemoryMatch = React.lazy(() => import('./MemoryMatch'));
const SnakeGame = React.lazy(() => import('./Snake'));
const TetrisGame = React.lazy(() => import('./Tetris'));
const BreakoutGame = React.lazy(() => import('./Breakout'));
const FlappyBirdGame = React.lazy(() => import('./FlappyBird'));
const SpaceInvadersGame = React.lazy(() => import('./SpaceInvaders'));
const AsteroidsGame = React.lazy(() => import('./Asteroids'));
const PongGame = React.lazy(() => import('./Pong'));
const SudokuGame = React.lazy(() => import('./Sudoku'));
const SimonSaysGame = React.lazy(() => import('./SimonSays'));
const WhackAMoleGame = React.lazy(() => import('./WhackAMole'));

type GameId = 'menu' | 'space-shooter' | 'memory-match' | 'snake' | 'tetris' | 'breakout' | 'flappy-bird' | 'space-invaders' | 'asteroids' | 'pong' | 'sudoku' | 'simon-says' | 'whack-a-mole';

interface GameInfo {
  id: GameId;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
  category: 'space' | 'classic' | 'puzzle' | 'action';
}

const GAMES: GameInfo[] = [
  // Space games
  {
    id: 'space-shooter',
    title: 'Space Shooter',
    description: 'Classic vertical scrolling shooter. Destroy enemies, collect power-ups, survive waves!',
    icon: <Rocket size={32} weight="fill" />,
    color: 'from-blue-500 to-cyan-500',
    available: true,
    category: 'space',
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    description: 'Defend Earth from descending alien invaders. Classic arcade action!',
    icon: <Skull size={32} weight="fill" />,
    color: 'from-green-500 to-lime-500',
    available: true,
    category: 'space',
  },
  {
    id: 'asteroids',
    title: 'Asteroids',
    description: 'Navigate your ship through space and destroy asteroids to survive!',
    icon: <Globe size={32} weight="fill" />,
    color: 'from-gray-500 to-slate-600',
    available: true,
    category: 'space',
  },
  // Classic games
  {
    id: 'snake',
    title: 'Snake',
    description: 'Classic snake game with power-ups. Eat food to grow, collect abilities!',
    icon: <Path size={32} weight="fill" />,
    color: 'from-green-500 to-emerald-500',
    available: true,
    category: 'classic',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack falling blocks to clear lines. How long can you survive?',
    icon: <Cube size={32} weight="fill" />,
    color: 'from-purple-500 to-indigo-500',
    available: true,
    category: 'classic',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: 'Bounce the ball and break all the bricks. Collect power-ups!',
    icon: <CirclesFour size={32} weight="fill" />,
    color: 'from-red-500 to-orange-500',
    available: true,
    category: 'classic',
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'Classic paddle game against AI. First to 7 points wins!',
    icon: <Rows size={32} weight="fill" />,
    color: 'from-teal-500 to-cyan-600',
    available: true,
    category: 'classic',
  },
  // Action games
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    description: 'Tap to fly through pipes. Simple but addictive!',
    icon: <Bird size={32} weight="fill" />,
    color: 'from-yellow-400 to-green-500',
    available: true,
    category: 'action',
  },
  {
    id: 'whack-a-mole',
    title: 'Whack-a-Mole',
    description: 'Hit the moles as they pop up! Golden moles worth more points!',
    icon: <Target size={32} weight="fill" />,
    color: 'from-amber-600 to-yellow-500',
    available: true,
    category: 'action',
  },

  // Puzzle games
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Find matching pairs. Test your memory skills!',
    icon: <Brain size={32} weight="fill" />,
    color: 'from-pink-500 to-rose-500',
    available: true,
    category: 'puzzle',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Fill the grid so every row, column, and 3x3 box has 1-9!',
    icon: <GridFour size={32} weight="fill" />,
    color: 'from-indigo-500 to-blue-600',
    available: true,
    category: 'puzzle',
  },
  {
    id: 'simon-says',
    title: 'Simon Says',
    description: 'Remember and repeat the color sequence. Test your memory!',
    icon: <MusicNote size={32} weight="fill" />,
    color: 'from-violet-500 to-purple-600',
    available: true,
    category: 'puzzle',
  },
];

const ArcadePage: React.FC = () => {
  const { t } = useAppContext();
  const [activeGame, setActiveGame] = useState<GameId>('menu');
  const [highScores] = useState(() => {
    return {
      'space-shooter': parseInt(localStorage.getItem('spaceShooterHighScore') || '0', 10),
      'snake': parseInt(localStorage.getItem('snakeHighScore') || '0', 10),
      'tetris': parseInt(localStorage.getItem('tetrisHighScore') || '0', 10),
      'breakout': parseInt(localStorage.getItem('breakoutHighScore') || '0', 10),
      'flappy-bird': parseInt(localStorage.getItem('flappyBirdHighScore') || '0', 10),
      'memory-match': parseInt(localStorage.getItem('memoryMatchBestScores') ? JSON.parse(localStorage.getItem('memoryMatchBestScores') || '{}').medium || '0' : '0', 10),
      'space-invaders': parseInt(localStorage.getItem('spaceInvadersHighScore') || '0', 10),
      'asteroids': parseInt(localStorage.getItem('asteroidsHighScore') || '0', 10),
      'pong': parseInt(localStorage.getItem('pongHighScore') || '0', 10),
      'sudoku': 0, // Sudoku uses best time, not score
      'simon-says': parseInt(localStorage.getItem('simonSaysHighScore') || '0', 10),
      'whack-a-mole': parseInt(localStorage.getItem('whackAMoleHighScore') || '0', 10),
    };
  });

  const renderMenu = () => (
    <div className="h-full w-full flex flex-col bg-[#FCFCFD] dark:bg-monday-dark-bg overflow-auto">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <GameController size={28} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('arcade')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('take_break') || 'Take a break and have some fun'} • {GAMES.length} {t('games_suffix') || 'games'}</p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => game.available && setActiveGame(game.id)}
              disabled={!game.available}
              className={`
                relative group overflow-hidden rounded-2xl
                bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50
                hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800
                shadow-sm hover:shadow-md
                transition-all duration-300 text-left rtl:text-right
                ${!game.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Gradient overlay on hover */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity
                bg-gradient-to-br ${game.color}
              `} />

              <div className="p-5 relative z-10">
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-3
                  bg-gradient-to-br ${game.color} shadow-lg
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  <div className="text-white">{game.icon}</div>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">{t(game.id) || game.title}</h3>

                {/* Description */}
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2">{t(`desc_${game.id}`) || game.description}</p>

                {/* High Score */}
                {highScores[game.id as keyof typeof highScores] > 0 && (
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-xs">
                    <Trophy size={14} weight="fill" />
                    <span>{t('high_score')}: {highScores[game.id as keyof typeof highScores].toLocaleString()}</span>
                  </div>
                )}

                {/* Coming Soon badge */}
                {!game.available && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500 dark:text-gray-400">
                    {t('coming_soon') || 'Coming Soon'}
                  </div>
                )}

                {/* Play indicator */}
                {game.available && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600 dark:text-cyan-400 group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition-colors">
                    <span className="text-xs font-medium">{t('play_now')}</span>
                    <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer tip */}
      <div className="flex-shrink-0 p-4 text-center text-gray-500 text-xs border-t border-gray-200 dark:border-gray-700/50">
        Press ESC while playing to pause the game
      </div>
    </div>
  );

  const renderGame = () => {
    // Games that need dark background
    const needsDarkBg = ['space-shooter', 'snake', 'tetris', 'breakout', 'flappy-bird', 'space-invaders', 'asteroids', 'pong', 'simon-says', 'whack-a-mole'].includes(activeGame);

    return (
      <div className={`h-full w-full flex flex-col overflow-hidden ${needsDarkBg ? 'bg-gray-900' : ''}`}>
        <Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading game...</p>
          </div>
        }>
          {activeGame === 'space-shooter' && (
            <div className="h-full w-full flex flex-col">
              <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
                <button
                  onClick={() => setActiveGame('menu')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Arcade</span>
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                <SpaceShooterGame onBack={() => setActiveGame('menu')} fullscreen={true} />
              </div>
            </div>
          )}
          {activeGame === 'snake' && (
            <SnakeGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'tetris' && (
            <TetrisGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'breakout' && (
            <BreakoutGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'flappy-bird' && (
            <FlappyBirdGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'memory-match' && (
            <MemoryMatch onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'space-invaders' && (
            <SpaceInvadersGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'asteroids' && (
            <AsteroidsGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'pong' && (
            <PongGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'sudoku' && (
            <SudokuGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'simon-says' && (
            <SimonSaysGame onBack={() => setActiveGame('menu')} />
          )}
          {activeGame === 'whack-a-mole' && (
            <WhackAMoleGame onBack={() => setActiveGame('menu')} />
          )}

        </Suspense>
      </div>
    );
  };

  return activeGame === 'menu' ? renderMenu() : renderGame();
};

export default ArcadePage;
