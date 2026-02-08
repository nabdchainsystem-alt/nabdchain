import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import {
  Sparkle,
  Lightning,
  Brain,
  CircleNotch,
  Robot,
  Power,
  ChartLineUp,
  ChatCircle,
  CaretDown,
} from 'phosphor-react';
import { useAppContext } from '../contexts/AppContext';
import AIChat from './AIChat';

interface AICreditsDisplayProps {
  showMode?: boolean;
  compact?: boolean;
}

/**
 * Displays user's AI credit balance and mode toggle in a single dropdown.
 * Placed in the TopBar for persistent visibility.
 *
 * NABD Brain 5-Tier System:
 * - Cleaner (Tier 1): Gemini 2.5 Flash - File processing & data cleaning
 * - Assistant (Tier 2): Gemini 3 Flash - Simple Q&A, basic tasks
 * - Worker (Tier 3): Gemini 3 Flash - Charts, tables, reports
 * - Analyst (Tier 4): Gemini 2.5 Flash - Analysis, insights, patterns
 * - Thinker (Tier 5): Gemini 3 Pro - Strategic, forecasting, complex reasoning
 *
 * Modes:
 * - Auto (Smart Routing): AI analyzes complexity and chooses the right tier
 * - Deep Mode: Forces Thinker (Tier 5) for all requests
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AICreditsDisplay({ showMode = true, compact = false }: AICreditsDisplayProps) {
  const { credits, creditsLoading, deepModeEnabled, toggleDeepMode, isProcessing, currentTier, aiEnabled, toggleAI } =
    useAI();
  const { theme, t, dir } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const isRTL = dir === 'rtl';

  // Keyboard shortcut (Cmd/Ctrl + J) to toggle AI chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        if (aiEnabled) {
          setIsAIChatOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape' && isAIChatOpen) {
        setIsAIChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAIChatOpen, aiEnabled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current tier indicator - 5-Tier System
  const getTierIndicator = () => {
    if (!isProcessing || !currentTier) return null;

    switch (currentTier) {
      case 'cleaner':
        return <Sparkle size={10} weight="fill" className="text-gray-400" />;
      case 'assistant':
        return <ChatCircle size={10} weight="fill" className="text-green-500" />;
      case 'worker':
        return <Lightning size={10} weight="fill" className="text-blue-500" />;
      case 'analyst':
        return <ChartLineUp size={10} weight="fill" className="text-orange-500" />;
      case 'thinker':
        return <Brain size={10} weight="fill" className="text-purple-500" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm rtl:flex-row-reverse">
        {isProcessing ? (
          <div className="relative">
            <CircleNotch size={14} className="animate-spin text-blue-500" />
            <div className="absolute inset-0 flex items-center justify-center">{getTierIndicator()}</div>
          </div>
        ) : (
          <Brain size={14} className={deepModeEnabled ? 'text-purple-500' : 'text-blue-500'} weight="fill" />
        )}
        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {creditsLoading ? '...' : credits}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Single Combined Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleAI();
        }}
        className={`
                    relative flex items-center gap-1.5 rtl:flex-row-reverse
                    transition-colors px-2 py-1.5 rounded-lg
                    hover:bg-gray-100 dark:hover:bg-monday-dark-hover
                    h-8
                    ${isOpen ? 'bg-gray-100 dark:bg-monday-dark-hover' : ''}
                    ${aiEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}
                `}
        title={
          aiEnabled ? `${t('nabd_brain')} (⌘J) - ${credits} ${t('credit')}` : `${t('nabd_brain')} - ${t('ai_disabled')}`
        }
      >
        {!aiEnabled ? (
          <Power size={18} className="text-gray-400" />
        ) : isProcessing ? (
          <CircleNotch size={18} className="animate-spin" />
        ) : (
          <Brain size={18} weight={deepModeEnabled ? 'fill' : 'duotone'} />
        )}

        {/* Credits badge - only show when enabled */}
        {aiEnabled && (
          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {creditsLoading ? '...' : credits}
          </span>
        )}

        {/* OFF indicator when disabled */}
        {!aiEnabled && <span className="text-xs font-medium text-gray-400">OFF</span>}

        {/* Dropdown arrow */}
        <CaretDown size={10} weight="bold" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />

        {/* Active indicator */}
        {aiEnabled && (
          <span className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-monday-dark-surface" />
        )}
      </button>

      {/* Dropdown Menu - Clean & Minimal */}
      {isOpen && (
        <div
          className={`
                    absolute top-full mt-2 w-56 rounded-2xl shadow-lg z-50 overflow-hidden
                    ${isRTL ? 'left-0' : 'right-0'}
                    ${isDark ? 'bg-gray-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}
                `}
        >
          <div className="p-3 space-y-3">
            {/* Toggle Row */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('nabd_brain')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAI();
                }}
                className={`
                                    relative w-11 h-6 rounded-full transition-all duration-200
                                    ${aiEnabled ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}
                                `}
              >
                <div
                  className={`
                                    absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
                                    ${aiEnabled ? 'ltr:left-6 rtl:right-6' : 'ltr:left-1 rtl:right-1'}
                                `}
                />
              </button>
            </div>

            {aiEnabled && (
              <>
                {/* Chat Button */}
                <button
                  onClick={() => {
                    setIsAIChatOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChatCircle size={16} weight="fill" />
                    <span className="text-sm font-medium">{t('open_chat')}</span>
                  </div>
                  <kbd className="text-xs opacity-70 font-mono">⌘J</kbd>
                </button>

                {/* Mode Toggle */}
                <div className={`flex p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => {
                      if (deepModeEnabled) toggleDeepMode();
                    }}
                    className={`
                                            flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                                            ${
                                              !deepModeEnabled
                                                ? isDark
                                                  ? 'bg-gray-700 text-white shadow-sm'
                                                  : 'bg-white text-gray-900 shadow-sm'
                                                : isDark
                                                  ? 'text-gray-500 hover:text-gray-300'
                                                  : 'text-gray-500 hover:text-gray-700'
                                            }
                                        `}
                  >
                    <Robot size={14} weight={!deepModeEnabled ? 'fill' : 'regular'} />
                    {t('auto_mode')}
                  </button>
                  <button
                    onClick={() => {
                      if (!deepModeEnabled) toggleDeepMode();
                    }}
                    className={`
                                            flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                                            ${
                                              deepModeEnabled
                                                ? isDark
                                                  ? 'bg-gray-700 text-white shadow-sm'
                                                  : 'bg-white text-gray-900 shadow-sm'
                                                : isDark
                                                  ? 'text-gray-500 hover:text-gray-300'
                                                  : 'text-gray-500 hover:text-gray-700'
                                            }
                                        `}
                  >
                    <Brain size={14} weight={deepModeEnabled ? 'fill' : 'regular'} />
                    {t('deep_mode')}
                  </button>
                </div>

                {/* Credits */}
                <div className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {creditsLoading ? '...' : `${credits} credits`}
                </div>
              </>
            )}

            {!aiEnabled && (
              <div className={`text-center text-xs py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('ai_features_disabled')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {aiEnabled && <AIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />}
    </div>
  );
}

export default AICreditsDisplay;
