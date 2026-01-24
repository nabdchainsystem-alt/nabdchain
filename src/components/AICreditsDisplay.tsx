import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import { Sparkle, Lightning, Brain, CircleNotch, Robot, Database, Power } from 'phosphor-react';
import { useAppContext } from '../contexts/AppContext';

interface AICreditsDisplayProps {
    showMode?: boolean;
    compact?: boolean;
}

/**
 * Displays user's AI credit balance and mode toggle in a single dropdown.
 * Placed in the TopBar for persistent visibility.
 *
 * NABD Brain Modes:
 * - Auto (Smart Routing): AI analyzes complexity and chooses the right model
 * - Deep Mode: Always uses Thinker (Gemini 3 Pro) for complex analysis
 */
export function AICreditsDisplay({ showMode = true, compact = false }: AICreditsDisplayProps) {
    const {
        credits,
        creditsLoading,
        deepModeEnabled,
        toggleDeepMode,
        isProcessing,
        currentTier,
        currentBoardContext,
        currentRoomContext,
        aiEnabled,
        toggleAI,
    } = useAI();
    const { theme, t, dir } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';
    const isRTL = dir === 'rtl';
    const hasContext = currentBoardContext || currentRoomContext;

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

    // Get current tier indicator
    const getTierIndicator = () => {
        if (!isProcessing || !currentTier) return null;

        switch (currentTier) {
            case 'cleaner':
                return <Sparkle size={10} weight="fill" className="text-green-500" />;
            case 'worker':
                return <Lightning size={10} weight="fill" className="text-blue-500" />;
            case 'thinker':
                return <Brain size={10} weight="fill" className="text-purple-500" />;
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 text-sm">
                {isProcessing ? (
                    <div className="relative">
                        <CircleNotch size={14} className="animate-spin text-blue-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {getTierIndicator()}
                        </div>
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
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative flex items-center gap-1
                    text-gray-500 dark:text-monday-dark-text-secondary
                    hover:text-[#323338] dark:hover:text-monday-dark-text
                    transition-colors p-1.5 rounded
                    hover:bg-gray-100 dark:hover:bg-monday-dark-hover
                    h-8 flex items-center justify-center
                    ${isOpen ? 'bg-gray-100 dark:bg-monday-dark-hover text-[#323338] dark:text-monday-dark-text' : ''}
                    ${!aiEnabled ? 'opacity-50' : ''}
                `}
                title={aiEnabled
                    ? `${t('nabd_brain')} - ${credits} ${t('credit')} • ${deepModeEnabled ? t('deep_mode') : t('auto_mode')}${hasContext ? ` • ${t('current_context')}` : ''}`
                    : `${t('nabd_brain')} - ${t('ai_disabled')} (${t('click_to_enable_ai')})`
                }
            >
                {!aiEnabled ? (
                    <Power size={18} className="text-gray-400" />
                ) : isProcessing ? (
                    <CircleNotch size={18} className="animate-spin" />
                ) : (
                    <Sparkle
                        size={18}
                        weight={deepModeEnabled ? 'fill' : 'regular'}
                    />
                )}

                {/* Credits badge - only show when enabled */}
                {aiEnabled && (
                    <span className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {creditsLoading ? '...' : credits}
                    </span>
                )}

                {/* OFF indicator when disabled */}
                {!aiEnabled && (
                    <span className="text-[10px] font-medium text-gray-400">OFF</span>
                )}

                {/* Context indicator */}
                {hasContext && aiEnabled && (
                    <div className={`absolute -top-0.5 w-2 h-2 rounded-full bg-green-500 ${isRTL ? '-left-0.5' : '-right-0.5'}`} />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`
                    absolute top-full mt-2 w-48 rounded-xl shadow-xl border z-50 overflow-hidden
                    ${isRTL ? 'left-0' : 'right-0'}
                    ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}
                `}>
                    {/* Header with ON/OFF Toggle */}
                    <div className={`px-3 py-2.5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkle size={14} weight="fill" className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {t('nabd_brain')}
                                </span>
                            </div>
                            {/* ON/OFF Toggle Switch */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleAI(); }}
                                className={`
                                    relative w-10 h-5 rounded-full transition-colors duration-200
                                    ${aiEnabled
                                        ? 'bg-blue-500'
                                        : isDark ? 'bg-gray-700' : 'bg-gray-300'
                                    }
                                `}
                                title={aiEnabled ? t('click_to_disable_ai') : t('click_to_enable_ai')}
                            >
                                <div className={`
                                    absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                                    ${aiEnabled
                                        ? isRTL ? 'translate-x-0.5' : 'translate-x-5'
                                        : isRTL ? 'translate-x-5' : 'translate-x-0.5'
                                    }
                                `} />
                            </button>
                        </div>
                        {aiEnabled && (
                            <div className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {creditsLoading ? '...' : `${credits} ${t('credits_available')}`}
                            </div>
                        )}
                        {!aiEnabled && (
                            <div className="text-[10px] mt-1 text-orange-500">
                                {t('ai_features_disabled')}
                            </div>
                        )}
                    </div>

                    {/* Mode Selection - Only show when AI is enabled */}
                    {aiEnabled && (
                        <div className="p-2 space-y-1">
                            {/* Auto Mode (Smart Routing) */}
                            <button
                                onClick={() => { if (deepModeEnabled) toggleDeepMode(); setIsOpen(false); }}
                                className={`
                                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all
                                    ${!deepModeEnabled
                                        ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                                        : isDark ? 'hover:bg-gray-800/50 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
                                    }
                                `}
                            >
                                <Robot size={15} weight={!deepModeEnabled ? 'fill' : 'regular'} />
                                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <div className="text-xs font-medium">{t('auto_mode')}</div>
                                    <div className={`text-[9px] opacity-60`}>
                                        {t('smart_routing')} • 1-5 cr
                                    </div>
                                </div>
                                {!deepModeEnabled && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`} />
                                )}
                            </button>

                            {/* Deep Mode */}
                            <button
                                onClick={() => { if (!deepModeEnabled) toggleDeepMode(); setIsOpen(false); }}
                                className={`
                                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all
                                    ${deepModeEnabled
                                        ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                                        : isDark ? 'hover:bg-gray-800/50 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
                                    }
                                `}
                            >
                                <Brain size={15} weight={deepModeEnabled ? 'fill' : 'regular'} />
                                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <div className="text-xs font-medium">{t('deep_mode')}</div>
                                    <div className={`text-[9px] opacity-60`}>
                                        {t('thinker_only')} • 5 cr
                                    </div>
                                </div>
                                {deepModeEnabled && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`} />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Context Status - Only show when AI is enabled */}
                    {aiEnabled && hasContext && (
                        <div className={`px-3 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                                <Database size={11} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                <span className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {currentBoardContext?.name || currentRoomContext?.name}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Keyboard Shortcut Hint - Only show when AI is enabled */}
                    {aiEnabled && (
                        <div className={`px-3 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-center gap-1.5">
                                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <kbd className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>⌘J</kbd> {t('to_chat')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AICreditsDisplay;
