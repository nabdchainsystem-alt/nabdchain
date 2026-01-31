import React, { useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

// =============================================================================
// CHECKBOX PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface CheckboxPickerProps {
    value: boolean | null;
    onSelect: (value: boolean | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    label?: string;
}

export const CheckboxPicker: React.FC<CheckboxPickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerRect,
    label = 'Checkbox',
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const MENU_WIDTH = 180;
    const MENU_HEIGHT = 150;
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
            return {
                ...baseStyle,
                bottom: windowHeight - triggerRect.top + 4,
                ...(isRtl ? (right !== undefined ? { right: PADDING } : { left: PADDING }) : (left !== undefined ? { left } : { right }))
            };
        }
        return {
            ...baseStyle,
            top: triggerRect.bottom + 4,
            ...(isRtl ? (right !== undefined ? { right: PADDING } : { left: PADDING }) : (left !== undefined ? { left } : { right }))
        };
    }, [triggerRect, isRtl]);

    const handleSelect = (newValue: boolean) => {
        onSelect(newValue);
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
                    <span className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <CheckSquare size={14} />
                        {t(label.toLowerCase()) || label}
                    </span>
                </div>

                {/* Options */}
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => handleSelect(true)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${value === true
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${value === true
                            ? 'bg-green-500 text-white'
                            : 'border-2 border-stone-300 dark:border-stone-600'
                            }`}>
                            {value === true && <Check size={14} weight="bold" />}
                        </div>
                        <span className="text-sm text-stone-700 dark:text-stone-300">{t('checked')}</span>
                    </button>

                    <button
                        onClick={() => handleSelect(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${value === false
                            ? 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${value === false
                            ? 'border-stone-400 dark:border-stone-500'
                            : 'border-stone-300 dark:border-stone-600'
                            }`}>
                        </div>
                        <span className="text-sm text-stone-700 dark:text-stone-300">{t('unchecked')}</span>
                    </button>
                </div>

                {/* Clear Button */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear')}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

// Simple inline checkbox component for table cells
export const InlineCheckbox: React.FC<{
    checked: boolean | null;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}> = memo(({ checked, onChange, disabled }) => {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${checked
                ? 'bg-green-500 text-white'
                : 'border-2 border-stone-300 dark:border-stone-600 hover:border-green-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {checked && <Check size={14} weight="bold" />}
        </button>
    );
});

export default CheckboxPicker;
