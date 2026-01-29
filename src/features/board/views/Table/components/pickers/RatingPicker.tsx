import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Star } from 'phosphor-react';

interface RatingPickerProps {
    value: number | null;
    maxRating?: number;
    onSelect: (rating: number | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

export const RatingPicker: React.FC<RatingPickerProps> = ({
    value,
    maxRating = 5,
    onSelect,
    onClose,
    triggerRect
}) => {
    const MENU_WIDTH = 200;
    const MENU_HEIGHT = 180;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceRight = windowWidth - triggerRect.left;
        const spaceLeft = triggerRect.right;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        let left: number | undefined;
        let right: number | undefined;

        if (spaceRight >= MENU_WIDTH + PADDING) {
            left = Math.max(PADDING, triggerRect.left);
        } else if (spaceLeft >= MENU_WIDTH + PADDING) {
            right = Math.max(PADDING, windowWidth - triggerRect.right);
        } else {
            left = Math.max(PADDING, (windowWidth - MENU_WIDTH) / 2);
        }

        if (left !== undefined && left + MENU_WIDTH > windowWidth - PADDING) {
            left = windowWidth - MENU_WIDTH - PADDING;
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

    const handleSelectRating = (rating: number) => {
        onSelect(rating);
        onClose();
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

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
                        Select Rating
                    </span>
                </div>

                {/* Star Rating Display */}
                <div className="p-4 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1">
                        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
                            <button
                                key={rating}
                                onClick={() => handleSelectRating(rating)}
                                className="p-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors group"
                            >
                                <Star
                                    size={28}
                                    weight={value && rating <= value ? 'fill' : 'regular'}
                                    className={`transition-all ${
                                        value && rating <= value
                                            ? 'text-yellow-400'
                                            : 'text-stone-300 dark:text-stone-600 group-hover:text-yellow-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Current Value Display */}
                    <div className="text-center">
                        <span className="text-2xl font-bold text-stone-700 dark:text-stone-300">
                            {value || 0}
                        </span>
                        <span className="text-sm text-stone-400 dark:text-stone-500">
                            {' / '}{maxRating}
                        </span>
                    </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="px-3 pb-2">
                    <div className="flex gap-1">
                        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
                            <button
                                key={rating}
                                onClick={() => handleSelectRating(rating)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    value === rating
                                        ? 'bg-yellow-400 text-yellow-900'
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                }`}
                            >
                                {rating}
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
                        Clear rating
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
