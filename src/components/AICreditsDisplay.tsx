import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../contexts/AIContext';
import { Sparkle, Lightning, Brain, CircleNotch, CaretDown } from 'phosphor-react';
import { useAppContext } from '../contexts/AppContext';

interface AICreditsDisplayProps {
    showMode?: boolean;
    compact?: boolean;
}

/**
 * Displays user's AI credit balance and mode toggle in a single dropdown.
 * Placed in the TopBar for persistent visibility.
 */
export function AICreditsDisplay({ showMode = true, compact = false }: AICreditsDisplayProps) {
    const { credits, creditsLoading, deepModeEnabled, toggleDeepMode, isProcessing } = useAI();
    const { theme } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';

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

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 text-sm">
                {isProcessing ? (
                    <CircleNotch size={14} className="animate-spin text-blue-500" />
                ) : (
                    <Sparkle size={14} className="text-blue-500" weight="fill" />
                )}
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {creditsLoading ? '...' : credits}
                </span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Single Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    text-gray-500 dark:text-monday-dark-text-secondary 
                    hover:text-[#323338] dark:hover:text-monday-dark-text 
                    transition-colors p-1.5 rounded 
                    hover:bg-gray-100 dark:hover:bg-monday-dark-hover 
                    w-8 h-8 flex items-center justify-center
                    ${isOpen ? 'bg-gray-100 dark:bg-monday-dark-hover text-[#323338] dark:text-monday-dark-text' : ''}
                `}
                title={`AI Assistant - ${credits} credits`}
            >
                {isProcessing ? (
                    <CircleNotch size={21} className="animate-spin text-blue-500" />
                ) : (
                    <Sparkle size={21} weight="light" className={isOpen ? "text-gray-900 dark:text-gray-100" : ""} />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`
                    absolute top-full right-0 mt-2 w-32 rounded-lg shadow-xl border z-50 overflow-hidden
                    ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-100'}
                `}>
                    {/* Compact Credits Display */}
                    <div className="px-2 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Credits</span>
                        <span className="text-[11px] font-black text-blue-500">{creditsLoading ? '...' : credits}</span>
                    </div>

                    <div className="p-1 flex flex-col gap-1">
                        {/* Fast Mode */}
                        <button
                            onClick={() => { if (deepModeEnabled) toggleDeepMode(); setIsOpen(false); }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${!deepModeEnabled ? (isDark ? 'bg-white text-black' : 'bg-[#323338]/50 text-white') : (isDark ? 'hover:bg-gray-900 text-gray-400' : 'hover:bg-gray-50 text-gray-500')}`}
                        >
                            <Lightning size={12} weight={!deepModeEnabled ? 'fill' : 'regular'} />
                            <span className="text-[10px] font-bold">Fast</span>
                        </button>

                        {/* Deep Mode */}
                        <button
                            onClick={() => { if (!deepModeEnabled) toggleDeepMode(); setIsOpen(false); }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all ${deepModeEnabled ? (isDark ? 'bg-white text-black' : 'bg-[#323338]/50 text-white') : (isDark ? 'hover:bg-gray-900 text-gray-400' : 'hover:bg-gray-50 text-gray-500')}`}
                        >
                            <Brain size={12} weight={deepModeEnabled ? 'fill' : 'regular'} />
                            <span className="text-[10px] font-bold">Deep</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AICreditsDisplay;

