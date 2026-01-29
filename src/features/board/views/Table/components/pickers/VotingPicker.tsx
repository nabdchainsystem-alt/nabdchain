import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThumbsUp, ThumbsDown, Minus } from 'phosphor-react';

interface VotingPickerProps {
    value: number | null;
    onSelect: (vote: number | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

export const VotingPicker: React.FC<VotingPickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect
}) => {
    const MENU_WIDTH = 220;
    const MENU_HEIGHT = 200;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        // Calculate if menu would overflow on the right
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        if (openUp) {
            return {
                ...baseStyle,
                bottom: windowHeight - triggerRect.top + 4,
                ...(left !== undefined ? { left } : { right }),
            };
        }

        return {
            ...baseStyle,
            top: triggerRect.bottom + 4,
            ...(left !== undefined ? { left } : { right }),
        };
    }, [triggerRect]);

    const handleVote = (delta: number) => {
        const currentValue = value || 0;
        onSelect(currentValue + delta);
        onClose();
    };

    const handleSetValue = (newValue: number) => {
        onSelect(newValue);
        onClose();
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

    const currentValue = value || 0;

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                        Vote
                    </span>
                </div>

                {/* Current Vote Display */}
                <div className="p-4 flex flex-col items-center gap-3">
                    <div className={`text-4xl font-bold ${
                        currentValue > 0
                            ? 'text-emerald-500'
                            : currentValue < 0
                                ? 'text-red-500'
                                : 'text-stone-400'
                    }`}>
                        {currentValue > 0 ? '+' : ''}{currentValue}
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleVote(-1)}
                            className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition-colors group"
                            title="Downvote"
                        >
                            <ThumbsDown size={24} weight="fill" className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => handleSetValue(0)}
                            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"
                            title="Reset to zero"
                        >
                            <Minus size={16} weight="bold" />
                        </button>
                        <button
                            onClick={() => handleVote(1)}
                            className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-500 transition-colors group"
                            title="Upvote"
                        >
                            <ThumbsUp size={24} weight="fill" className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Quick Set Values */}
                <div className="px-3 pb-2">
                    <div className="text-[10px] text-stone-400 dark:text-stone-500 mb-1.5 text-center">Quick set</div>
                    <div className="flex gap-1 justify-center">
                        {[-5, -1, 0, 1, 5, 10].map((val) => (
                            <button
                                key={val}
                                onClick={() => handleSetValue(val)}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                    currentValue === val
                                        ? val > 0
                                            ? 'bg-emerald-500 text-white'
                                            : val < 0
                                                ? 'bg-red-500 text-white'
                                                : 'bg-stone-500 text-white'
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                }`}
                            >
                                {val > 0 ? `+${val}` : val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clear Button */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={handleClear}
                        className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        Clear vote
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
