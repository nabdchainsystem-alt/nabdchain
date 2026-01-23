/**
 * Space Shooter Game - React Component
 * Wraps the canvas-based game engine in a React component
 * Supports fullscreen mode
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GameEngine } from './engine/GameEngine';
import { GameState, DEFAULT_CONFIG } from './types';
import { ArrowsOut, ArrowsIn, SpeakerHigh, SpeakerSlash, X } from 'phosphor-react';
import { getAudioManager } from './engine/AudioManager';
import { appLogger } from '../../../utils/logger';

interface SpaceShooterGameProps {
  onBack?: () => void;
  fullscreen?: boolean;
}

export const SpaceShooterGame: React.FC<SpaceShooterGameProps> = ({
  onBack,
  fullscreen: initialFullscreen = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_CONFIG.width, height: DEFAULT_CONFIG.height });
  const [soundEnabled, setSoundEnabled] = useState(() => getAudioManager().isEnabled());

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate canvas size based on container
  const calculateCanvasSize = useCallback((fullscreen: boolean) => {
    if (!fullscreen) {
      return { width: DEFAULT_CONFIG.width, height: DEFAULT_CONFIG.height };
    }

    // For fullscreen, calculate based on window size
    const maxWidth = window.innerWidth - 64;
    const maxHeight = window.innerHeight - 160; // Leave room for controls

    // Maintain aspect ratio (2:3 for vertical shooter)
    const aspectRatio = DEFAULT_CONFIG.width / DEFAULT_CONFIG.height;
    let width = maxWidth;
    let height = width / aspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    // Clamp to reasonable bounds
    width = Math.max(320, Math.min(800, width));
    height = Math.max(480, Math.min(1200, height));

    return { width: Math.floor(width), height: Math.floor(height) };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateCanvasSize(isFullscreen);
      setCanvasSize(newSize);
      engineRef.current?.resize(newSize.width, newSize.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, calculateCanvasSize]);

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height
    });
    engineRef.current = engine;

    engine.setCallbacks(
      (state) => setGameState({ ...state }),
      (score, highScore) => {
        appLogger.info(`Game Over! Score: ${score}, High Score: ${highScore}`);
      }
    );

    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update engine size when canvas size changes
  useEffect(() => {
    if (engineRef.current && canvasRef.current) {
      engineRef.current.resize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Exit fullscreen and go back
  const exitFullscreenAndBack = useCallback(() => {
    setIsFullscreen(false);
    onBack?.();
  }, [onBack]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const audio = getAudioManager();
    const enabled = audio.toggle();
    setSoundEnabled(enabled);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    engineRef.current?.handleTouchMove(touch.clientX, touch.clientY);
    engineRef.current?.setTouchFiring(true);

    if (gameState?.status === 'menu' || gameState?.status === 'gameOver') {
      engineRef.current?.startGame();
    }
  }, [gameState?.status]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    engineRef.current?.handleTouchMove(touch.clientX, touch.clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    engineRef.current?.setTouchFiring(false);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (gameState?.status === 'menu' || gameState?.status === 'gameOver') {
      engineRef.current?.startGame();
    }
  }, [gameState?.status]);

  // ESC to exit fullscreen (when not playing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && gameState?.status !== 'playing') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, gameState?.status]);

  // Game content that will be rendered either inline or in portal
  const gameContent = (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center select-none ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm'
          : 'gap-4 p-4'
      }`}
      style={isFullscreen ? { padding: '20px' } : undefined}
    >
      {/* Top bar with controls */}
      <div
        className="flex items-center justify-between mb-4"
        style={{ width: canvasSize.width }}
      >
        {/* Back/Exit button */}
        <button
          onClick={isFullscreen ? exitFullscreenAndBack : onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm border border-gray-600"
        >
          {isFullscreen ? <X size={18} /> : null}
          <span>{isFullscreen ? 'Exit' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          boxShadow: '0 0 60px rgba(0, 150, 255, 0.4), 0 0 120px rgba(0, 100, 255, 0.2)',
          border: '2px solid rgba(0, 200, 255, 0.3)'
        }}
      >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="block cursor-crosshair"
          style={{
            touchAction: 'none',
            width: canvasSize.width,
            height: canvasSize.height
          }}
        />
      </div>

      {/* Controls info */}
      <div className="text-center mt-4">
        {!isMobile ? (
          <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
            <span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-600">Arrow Keys</kbd> or{' '}
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-600">WASD</kbd> move
            </span>
            <span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-600">Space</kbd> shoot
            </span>
            <span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-600">ESC</kbd> pause
            </span>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Touch and drag to move - Auto-fire enabled
          </p>
        )}
      </div>
    </div>
  );

  // Render in portal when fullscreen, otherwise inline
  if (isFullscreen) {
    return createPortal(gameContent, document.body);
  }

  return gameContent;
};

export default SpaceShooterGame;
