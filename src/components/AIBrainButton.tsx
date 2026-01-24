import React, { useState, useEffect, useRef } from 'react';
import { Sparkle, Power } from 'phosphor-react';
import { useAI } from '../contexts/AIContext';
import { useAppContext } from '../contexts/AppContext';
import AIChat from './AIChat';

/**
 * NABD Brain - 3D Circle AI Button
 * - Click to open AI chat (when enabled)
 * - Right-click or long-press to toggle AI on/off
 */
export function AIBrainButton() {
    const { isProcessing, aiEnabled, toggleAI } = useAI();
    const { t, dir } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [showToggleHint, setShowToggleHint] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isRTL = dir === 'rtl';

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                if (aiEnabled) {
                    setIsOpen(prev => !prev);
                } else {
                    // Show hint that AI is disabled
                    setShowToggleHint(true);
                    setTimeout(() => setShowToggleHint(false), 2000);
                }
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, aiEnabled]);

    const handleClick = () => {
        if (aiEnabled) {
            setIsOpen(!isOpen);
        } else {
            setShowToggleHint(true);
            setTimeout(() => setShowToggleHint(false), 2000);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleAI();
    };

    const handleMouseDown = () => {
        setIsPressed(true);
        // Long press to toggle
        longPressTimer.current = setTimeout(() => {
            toggleAI();
            setIsPressed(false);
        }, 800);
    };

    const handleMouseUp = () => {
        setIsPressed(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMouseLeave = () => {
        setIsPressed(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <>
            {/* Toggle hint tooltip */}
            {showToggleHint && (
                <div className={`fixed bottom-20 z-50 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg ${isRTL ? 'left-6' : 'right-6'}`}>
                    {t('ai_disabled_hint')}
                </div>
            )}

            {/* 3D Circle Button */}
            <button
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                title={aiEnabled ? `${t('open_ai_chat')} (⌘J) • ${t('right_click_disable')}` : `${t('ai_disabled')} • ${t('right_click_enable')}`}
                className={`
                    fixed bottom-6 z-50
                    w-[48px] h-[48px] rounded-full
                    flex items-center justify-center
                    transition-all duration-200
                    ${isRTL ? 'left-6' : 'right-6'}
                    ${isPressed ? 'scale-95' : 'hover:scale-110'}
                    ${!aiEnabled ? 'opacity-50' : ''}
                `}
                style={{
                    boxShadow: aiEnabled ? `
                        0 0 12px rgba(192, 192, 192, 0.5),
                        0 0 24px rgba(192, 192, 192, 0.25)
                    ` : `
                        0 0 8px rgba(100, 100, 100, 0.3)
                    `,
                }}
            >
                {/* Gradient ring border */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: aiEnabled
                            ? 'conic-gradient(from 0deg, #c0c0c0, #e8e8e8, #808080, #d0d0d0, #a0a0a0, #f0f0f0, #909090, #c0c0c0)'
                            : 'conic-gradient(from 0deg, #666, #888, #555, #777, #666)',
                        WebkitMask: 'radial-gradient(circle, transparent 58%, black 60%)',
                        mask: 'radial-gradient(circle, transparent 58%, black 60%)',
                    }}
                />
                {/* AI Icon or Power Off icon */}
                {aiEnabled ? (
                    <Sparkle
                        size={20}
                        weight="fill"
                        className={`relative z-10 ${isProcessing ? 'animate-spin' : ''}`}
                        style={{
                            color: '#c0c0c0',
                            filter: 'drop-shadow(0 0 4px rgba(192, 192, 192, 0.6))',
                        }}
                    />
                ) : (
                    <Power
                        size={20}
                        weight="bold"
                        className="relative z-10"
                        style={{
                            color: '#888',
                        }}
                    />
                )}
            </button>

            {/* Chat Modal - only render when AI is enabled */}
            {aiEnabled && <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />}
        </>
    );
}

export default AIBrainButton;
