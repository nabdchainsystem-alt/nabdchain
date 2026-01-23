import React, { useState, useEffect } from 'react';
import { Sparkle } from 'phosphor-react';
import { useAI } from '../contexts/AIContext';
import { useAppContext } from '../contexts/AppContext';
import AIChat from './AIChat';

/**
 * NABD Brain - 3D Circle AI Button
 */
export function AIBrainButton() {
    const { credits, isProcessing } = useAI();
    const { theme } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const isDark = theme === 'dark';

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* 3D Circle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                className={`
                    fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-[10000]
                    w-[44px] h-[44px] rounded-full
                    flex flex-col items-center justify-center
                    transition-all duration-150
                    ${isPressed ? 'scale-95' : 'hover:scale-105'}
                `}
                style={{
                    background: isDark
                        ? 'linear-gradient(145deg, #505050, #404040)'
                        : 'linear-gradient(145deg, #6a6a6a, #505050)',
                    boxShadow: isDark
                        ? '4px 4px 8px #2a2a2a, -2px -2px 6px #606060'
                        : '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 6px rgba(120,120,120,0.2)',
                    padding: '3px',
                }}
            >
                {/* Inner white/light circle */}
                <div
                    className={`
                        w-full h-full rounded-full
                        flex flex-col items-center justify-center
                        ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                    `}
                    style={{
                        background: isDark
                            ? 'linear-gradient(145deg, #606060, #4a4a4a)'
                            : 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                        boxShadow: isDark
                            ? 'inset 2px 2px 4px #3a3a3a, inset -2px -2px 4px #707070'
                            : 'inset 2px 2px 4px #d0d0d0, inset -2px -2px 4px #ffffff',
                    }}
                >
                    {/* NABD Brain Icon */}
                    <Sparkle
                        size={18}
                        weight="fill"
                        className={`
                            ${isDark ? 'text-white' : 'text-gray-700'}
                            ${isProcessing ? 'animate-spin' : ''}
                        `}
                    />
                </div>
            </button>

            {/* Chat Modal */}
            <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

export default AIBrainButton;
