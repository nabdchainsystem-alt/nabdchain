import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Trophy, Sparkle, X } from 'phosphor-react';
import { useAppContext } from '../../../../../../contexts/AppContext';

// =============================================================================
// PROGRESS PICKER - Enhanced Visual Component with RTL Support
// =============================================================================

interface ProgressPickerProps {
    value: number | null; // 0-100
    onSelect: (value: number | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    autoMode?: boolean;
    autoSource?: string;
}

const PRESET_VALUES = [0, 10, 25, 50, 75, 100];

export const ProgressPicker: React.FC<ProgressPickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect,
    autoMode = false,
}) => {
    const { t, dir } = useAppContext();
    const [inputValue, setInputValue] = useState(value?.toString() || '0');
    const [isDragging, setIsDragging] = useState(false);

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = 420;
    const PADDING = 12;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const spaceRight = windowWidth - triggerRect.left;
        const spaceLeft = triggerRect.right;

        // Determine horizontal position
        let left: number | undefined;
        let right: number | undefined;

        if (spaceRight >= MENU_WIDTH + PADDING) {
            // Enough space on the right
            left = Math.max(PADDING, triggerRect.left);
        } else if (spaceLeft >= MENU_WIDTH + PADDING) {
            // Use right positioning
            right = Math.max(PADDING, windowWidth - triggerRect.right);
        } else {
            // Center it horizontally
            left = Math.max(PADDING, (windowWidth - MENU_WIDTH) / 2);
        }

        // Determine vertical position - prefer below, but go above if not enough space
        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
            maxHeight: `calc(100vh - ${PADDING * 2}px)`,
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
        };

        if (openUp) {
            const bottomPos = windowHeight - triggerRect.top + 4;
            return {
                ...baseStyle,
                bottom: Math.max(PADDING, bottomPos),
                maxHeight: Math.min(MENU_HEIGHT, spaceAbove - PADDING),
                ...(left !== undefined ? { left } : { right })
            };
        }

        const topPos = triggerRect.bottom + 4;
        return {
            ...baseStyle,
            top: Math.min(topPos, windowHeight - MENU_HEIGHT - PADDING),
            maxHeight: Math.min(MENU_HEIGHT, spaceBelow - PADDING),
            ...(left !== undefined ? { left } : { right })
        };
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

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    const handleSliderMouseUp = useCallback(() => {
        setIsDragging(false);
        onSelect(clampedValue);
    }, [clampedValue, onSelect]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSelect(clampedValue);
            onClose();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Dynamic color based on progress
    const getProgressColor = (percent: number) => {
        if (percent >= 100) return { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500/20', gradient: 'from-emerald-400 to-emerald-600' };
        if (percent >= 75) return { bg: 'bg-teal-500', text: 'text-teal-500', ring: 'ring-teal-500/20', gradient: 'from-teal-400 to-teal-600' };
        if (percent >= 50) return { bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500/20', gradient: 'from-blue-400 to-blue-600' };
        if (percent >= 25) return { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500/20', gradient: 'from-amber-400 to-amber-600' };
        if (percent > 0) return { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/20', gradient: 'from-orange-400 to-orange-600' };
        return { bg: 'bg-stone-400', text: 'text-stone-400', ring: 'ring-stone-400/20', gradient: 'from-stone-300 to-stone-500' };
    };

    const colors = getProgressColor(clampedValue);

    // Status message based on progress
    const getStatusMessage = (percent: number) => {
        if (percent >= 100) return { icon: Trophy, text: t('progress_complete') || 'Complete!', color: 'text-emerald-600 dark:text-emerald-400' };
        if (percent >= 75) return { icon: Sparkle, text: t('progress_almost') || 'Almost there!', color: 'text-teal-600 dark:text-teal-400' };
        if (percent >= 50) return { icon: CheckCircle, text: t('progress_halfway') || 'Halfway done', color: 'text-blue-600 dark:text-blue-400' };
        if (percent >= 25) return { icon: CheckCircle, text: t('progress_good_start') || 'Good start', color: 'text-amber-600 dark:text-amber-400' };
        if (percent > 0) return { icon: CheckCircle, text: t('progress_just_started') || 'Just started', color: 'text-orange-600 dark:text-orange-400' };
        return { icon: CheckCircle, text: t('progress_not_started') || 'Not started', color: 'text-stone-500 dark:text-stone-400' };
    };

    const status = getStatusMessage(clampedValue);
    const StatusIcon = status.icon;

    // Calculate circle progress
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                dir={dir}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 [&::-webkit-scrollbar]:hidden"
                style={positionStyle}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                        {t('set_progress') || 'Set Progress'}
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-stone-400" />
                    </button>
                </div>

                {/* Circular Progress Display */}
                <div className="flex flex-col items-center py-5 px-4">
                    <div className="relative">
                        {/* Background circle */}
                        <svg width="140" height="140" className="transform -rotate-90">
                            <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                className="text-stone-100 dark:text-stone-800"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-300 ease-out"
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" className={clampedValue >= 100 ? 'text-emerald-400' : clampedValue >= 50 ? 'text-blue-400' : 'text-amber-400'} stopColor="currentColor" />
                                    <stop offset="100%" className={clampedValue >= 100 ? 'text-emerald-600' : clampedValue >= 50 ? 'text-teal-500' : 'text-orange-500'} stopColor="currentColor" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${colors.text} transition-colors`}>
                                {clampedValue}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">{t('percent') || 'percent'}</span>
                        </div>
                    </div>

                    {/* Status message */}
                    <div className={`flex items-center gap-1.5 mt-3 ${status.color}`}>
                        <StatusIcon size={14} weight={clampedValue >= 100 ? 'fill' : 'regular'} />
                        <span className="text-xs font-medium">{status.text}</span>
                    </div>
                </div>

                {/* Slider Section */}
                {!autoMode && (
                    <div className="px-4 pb-4">
                        <div className="relative">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={clampedValue}
                                onChange={handleSliderChange}
                                onMouseDown={() => setIsDragging(true)}
                                onMouseUp={handleSliderMouseUp}
                                onTouchStart={() => setIsDragging(true)}
                                onTouchEnd={handleSliderMouseUp}
                                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-5
                                    [&::-webkit-slider-thumb]:h-5
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:shadow-lg
                                    [&::-webkit-slider-thumb]:border-2
                                    [&::-webkit-slider-thumb]:border-blue-500
                                    [&::-webkit-slider-thumb]:cursor-grab
                                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                                    [&::-webkit-slider-thumb]:transition-transform
                                    [&::-webkit-slider-thumb]:hover:scale-110
                                    [&::-moz-range-thumb]:w-5
                                    [&::-moz-range-thumb]:h-5
                                    [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:bg-white
                                    [&::-moz-range-thumb]:border-2
                                    [&::-moz-range-thumb]:border-blue-500
                                    [&::-moz-range-thumb]:cursor-grab"
                                style={{
                                    background: `linear-gradient(to right, ${clampedValue >= 100 ? '#10b981' : clampedValue >= 50 ? '#3b82f6' : '#f59e0b'} 0%, ${clampedValue >= 100 ? '#10b981' : clampedValue >= 50 ? '#3b82f6' : '#f59e0b'} ${clampedValue}%, #e5e7eb ${clampedValue}%, #e5e7eb 100%)`
                                }}
                            />
                        </div>

                        {/* Manual input */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className="w-16 px-2 py-1.5 text-center text-sm font-semibold border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                maxLength={3}
                            />
                            <span className="text-sm text-stone-400 font-medium">%</span>
                        </div>
                    </div>
                )}

                {/* Quick Select Grid */}
                {!autoMode && (
                    <div className="px-4 pb-4">
                        <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_VALUES.map((preset) => {
                                const presetColors = getProgressColor(preset);
                                const isSelected = clampedValue === preset;
                                return (
                                    <button
                                        key={preset}
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                                            isSelected
                                                ? `bg-gradient-to-br ${presetColors.gradient} text-white shadow-md scale-105`
                                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:scale-102'
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <button
                        onClick={() => { onSelect(0); onClose(); }}
                        className="flex-1 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                    >
                        {t('reset') || 'Reset'}
                    </button>
                    <button
                        onClick={() => { onSelect(clampedValue); onClose(); }}
                        className={`flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r ${colors.gradient} hover:opacity-90 rounded-lg transition-all shadow-sm`}
                    >
                        {t('apply') || 'Apply'}
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
        if (p >= 100) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
        if (p >= 75) return 'bg-gradient-to-r from-teal-400 to-teal-500';
        if (p >= 50) return 'bg-gradient-to-r from-blue-400 to-blue-500';
        if (p >= 25) return 'bg-gradient-to-r from-amber-400 to-amber-500';
        if (p > 0) return 'bg-gradient-to-r from-orange-400 to-orange-500';
        return 'bg-stone-300 dark:bg-stone-600';
    };

    const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

    return (
        <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onClick}
        >
            <div className={`flex-1 ${heights[size]} bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden min-w-[60px]`}>
                <div
                    className={`h-full transition-all duration-300 ${getColor(percent)} group-hover:opacity-80`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400 min-w-[32px] text-right">
                    {percent}%
                </span>
            )}
        </div>
    );
};

export default ProgressPicker;
