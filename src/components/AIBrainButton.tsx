import React, { useState, useEffect } from 'react';
import { Sparkle } from 'phosphor-react';
import { useAI } from '../contexts/AIContext';
import AIChat from './AIChat';

/**
 * NABD Brain - 3D Circle AI Button
 */
export function AIBrainButton() {
    const { credits, isProcessing } = useAI();
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

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
                    w-[48px] h-[48px] rounded-full
                    flex items-center justify-center
                    transition-all duration-200
                    ${isPressed ? 'scale-95' : 'hover:scale-110'}
                `}
                style={{
                    boxShadow: `
                        0 0 12px rgba(192, 192, 192, 0.5),
                        0 0 24px rgba(192, 192, 192, 0.25)
                    `,
                }}
            >
                {/* Gradient ring border */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'conic-gradient(from 0deg, #c0c0c0, #e8e8e8, #808080, #d0d0d0, #a0a0a0, #f0f0f0, #909090, #c0c0c0)',
                        WebkitMask: 'radial-gradient(circle, transparent 58%, black 60%)',
                        mask: 'radial-gradient(circle, transparent 58%, black 60%)',
                    }}
                />
                {/* AI Icon */}
                <Sparkle
                    size={20}
                    weight="fill"
                    className={`relative z-10 ${isProcessing ? 'animate-spin' : ''}`}
                    style={{
                        color: '#c0c0c0',
                        filter: 'drop-shadow(0 0 4px rgba(192, 192, 192, 0.6))',
                    }}
                />
            </button>

            {/* Chat Modal */}
            <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

export default AIBrainButton;
