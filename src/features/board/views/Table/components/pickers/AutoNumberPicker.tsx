import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Hash, Info } from 'phosphor-react';

// =============================================================================
// AUTO NUMBER PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface AutoNumberConfig {
    prefix?: string;      // e.g., "TASK-"
    suffix?: string;      // e.g., "-2024"
    startFrom: number;
    increment: number;
    padLength?: number;   // e.g., 4 for "0001"
}

interface AutoNumberPickerProps {
    value: number | null;
    config?: AutoNumberConfig;
    onConfigChange?: (config: AutoNumberConfig) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    isConfigMode?: boolean; // True when configuring the column, false when viewing a cell
}

// Format auto number with config
export const formatAutoNumber = (num: number | null, config?: AutoNumberConfig): string => {
    if (num === null) return '-';

    const cfg = config || { startFrom: 1, increment: 1 };
    const padded = cfg.padLength
        ? num.toString().padStart(cfg.padLength, '0')
        : num.toString();

    return `${cfg.prefix || ''}${padded}${cfg.suffix || ''}`;
};

export const AutoNumberPicker: React.FC<AutoNumberPickerProps> = ({
    value,
    config,
    onConfigChange,
    onClose,
    triggerRect,
    isConfigMode = false,
}) => {
    const [localConfig, setLocalConfig] = React.useState<AutoNumberConfig>(
        config || { startFrom: 1, increment: 1, padLength: 4 }
    );

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = isConfigMode ? 350 : 150;
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
    }, [triggerRect, isConfigMode]);

    const handleSaveConfig = () => {
        onConfigChange?.(localConfig);
        onClose();
    };

    const previewNumber = value ?? localConfig.startFrom;

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
                        <Hash size={14} />
                        Auto Number
                    </span>
                </div>

                {/* Value Display (non-config mode) */}
                {!isConfigMode && (
                    <div className="p-4">
                        <div className="text-center">
                            <div className="text-2xl font-mono font-bold text-stone-700 dark:text-stone-200">
                                {formatAutoNumber(value, config)}
                            </div>
                            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-stone-400">
                                <Info size={12} />
                                <span>Auto-generated (read-only)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Config Mode */}
                {isConfigMode && (
                    <div className="p-3 space-y-3">
                        {/* Prefix */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Prefix
                            </label>
                            <input
                                type="text"
                                value={localConfig.prefix || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, prefix: e.target.value })}
                                placeholder="e.g., TASK-"
                                className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                            />
                        </div>

                        {/* Suffix */}
                        <div>
                            <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                Suffix
                            </label>
                            <input
                                type="text"
                                value={localConfig.suffix || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, suffix: e.target.value })}
                                placeholder="e.g., -2024"
                                className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {/* Start From */}
                            <div>
                                <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                    Start
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.startFrom}
                                    onChange={(e) => setLocalConfig({ ...localConfig, startFrom: parseInt(e.target.value) || 1 })}
                                    min="0"
                                    className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                                />
                            </div>

                            {/* Increment */}
                            <div>
                                <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                    Increment
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.increment}
                                    onChange={(e) => setLocalConfig({ ...localConfig, increment: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                                />
                            </div>

                            {/* Padding */}
                            <div>
                                <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                                    Pad
                                </label>
                                <input
                                    type="number"
                                    value={localConfig.padLength || 0}
                                    onChange={(e) => setLocalConfig({ ...localConfig, padLength: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    max="10"
                                    className="w-full px-2 py-1.5 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                            <div className="text-[10px] text-stone-500 uppercase mb-1">Preview</div>
                            <div className="font-mono text-lg text-stone-700 dark:text-stone-200">
                                {formatAutoNumber(previewNumber, localConfig)}
                            </div>
                            <div className="text-[10px] text-stone-400 mt-1">
                                Next: {formatAutoNumber(previewNumber + localConfig.increment, localConfig)}
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveConfig}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                            Save Configuration
                        </button>
                    </div>
                )}

                {/* Close Button */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={onClose}
                        className="w-full py-1.5 text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

// Inline display for table cells
export const AutoNumberDisplay: React.FC<{
    value: number | null;
    config?: AutoNumberConfig;
}> = ({ value, config }) => {
    return (
        <span className="font-mono text-sm text-stone-600 dark:text-stone-400">
            {formatAutoNumber(value, config)}
        </span>
    );
};

export default AutoNumberPicker;
