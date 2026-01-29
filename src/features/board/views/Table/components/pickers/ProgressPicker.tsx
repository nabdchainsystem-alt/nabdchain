import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Percent, ArrowClockwise } from 'phosphor-react';

// =============================================================================
// PROGRESS PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ProgressPickerProps {
    value: number | null; // 0-100
    onSelect: (value: number | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    autoMode?: boolean;
    autoSource?: string;
}

const PRESET_VALUES = [0, 25, 50, 75, 100];

export const ProgressPicker: React.FC<ProgressPickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect,
    autoMode = false,
    autoSource,
}) => {
    const [inputValue, setInputValue] = useState(value?.toString() || '0');

    const MENU_WIDTH = 240;
    const MENU_HEIGHT = 280;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        if (openUp) {
            return { ...baseStyle, bottom: windowHeight - triggerRect.top + 4, ...(left !== undefined ? { left } : { right }) };
        }
        return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect]);

    const currentValue = parseInt(inputValue) || 0;
    const clampedValue = Math.min(100, Math.max(0, currentValue));

    const handleSelectPreset = (preset: number) => {
        setInputValue(preset.toString());
        onSelect(preset);
        onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            setInputValue(val);
        }
    };

    const handleSave = () => {
        onSelect(clampedValue);
        onClose();
    };

    const getProgressColor = (percent: number): string => {
        if (percent >= 100) return 'bg-green-500';
        if (percent >= 75) return 'bg-emerald-500';
        if (percent >= 50) return 'bg-yellow-500';
        if (percent >= 25) return 'bg-orange-500';
        return 'bg-red-500';
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
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                        <Percent size={14} />
                        Progress
                    </span>
                </div>

                {/* Auto Mode Notice */}
                {autoMode && (
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <ArrowClockwise size={14} />
                            <span>Auto-calculated from {autoSource || 'subtasks'}</span>
                        </div>
                    </div>
                )}

                {/* Progress Visual */}
                <div className="p-4">
                    <div className="text-center mb-3">
                        <span className="text-4xl font-bold text-stone-700 dark:text-stone-200">
                            {clampedValue}
                        </span>
                        <span className="text-xl text-stone-400">%</span>
                    </div>
                    <div className="w-full h-4 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${getProgressColor(clampedValue)}`}
                            style={{ width: `${clampedValue}%` }}
                        />
                    </div>
                </div>

                {/* Manual Input */}
                {!autoMode && (
                    <div className="px-3 pb-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="flex-1 px-3 py-2 text-center text-lg font-medium border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
                                maxLength={3}
                            />
                            <span className="text-stone-400">%</span>
                            <button
                                onClick={handleSave}
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                )}

                {/* Preset Values */}
                {!autoMode && (
                    <div className="px-3 pb-3">
                        <div className="text-[10px] font-medium text-stone-500 uppercase mb-2">Quick Select</div>
                        <div className="flex gap-1">
                            {PRESET_VALUES.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                                        clampedValue === preset
                                            ? `${getProgressColor(preset)} text-white`
                                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                                    }`}
                                >
                                    {preset}%
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Slider */}
                {!autoMode && (
                    <div className="px-3 pb-3">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={clampedValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                            }}
                            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                )}

                {/* Clear Button */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        Clear progress
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

// Inline progress bar component for table cells
export const ProgressBar: React.FC<{
    value: number | null;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}> = ({ value, showLabel = true, size = 'md', onClick }) => {
    const percent = value ?? 0;

    const getColor = (p: number) => {
        if (p >= 100) return 'bg-green-500';
        if (p >= 75) return 'bg-emerald-500';
        if (p >= 50) return 'bg-yellow-500';
        if (p >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

    return (
        <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onClick}
        >
            <div className={`flex-1 ${heights[size]} bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden min-w-[60px]`}>
                <div
                    className={`h-full transition-all ${getColor(percent)} group-hover:opacity-80`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs text-stone-600 dark:text-stone-400 min-w-[32px] text-right">
                    {percent}%
                </span>
            )}
        </div>
    );
};

export default ProgressPicker;
