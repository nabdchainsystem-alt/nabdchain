import React, { useRef, useState, useLayoutEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

// Color palette for checkbox/selection colors
const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c', '#1c1917'
];

interface CheckboxColorPickerProps {
    onSelect: (color: string) => void;
    onClose: () => void;
    current?: string;
    triggerRect?: DOMRect;
}

export const CheckboxColorPicker: React.FC<CheckboxColorPickerProps> = memo(({
    onSelect,
    onClose,
    current,
    triggerRect
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const menuRef = useRef<HTMLDivElement>(null);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({ display: 'none' });

    useLayoutEffect(() => {
        if (triggerRect && menuRef.current) {
            const menuWidth = 190;
            const menuHeight = 200;

            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };

            if (openUp) {
                style.bottom = window.innerHeight - triggerRect.top - 4;
            } else {
                style.top = triggerRect.bottom - 4;
            }

            // Default: align left edge of menu with left edge of trigger (unless RTL)
            if (isRtl) {
                style.right = window.innerWidth - triggerRect.right;
                if (window.innerWidth - triggerRect.right + menuWidth > window.innerWidth - 10) {
                    style.right = 10;
                }
            } else {
                style.left = triggerRect.left;
                if (triggerRect.left + menuWidth > window.innerWidth - 10) {
                    style.left = window.innerWidth - menuWidth - 10;
                }
            }

            setPositionStyle(style);
        }
    }, [triggerRect, isRtl]);

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-[190px] overflow-hidden menu-enter flex flex-col p-2"
                style={positionStyle}
            >
                <div className="pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
                    <span className={`text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400 px-1 block ${isRtl ? 'text-right' : ''}`}>
                        {t('checkbox_color')}
                    </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => { onSelect(c); onClose(); }}
                            title={c}
                            className={`
                                w-6 h-6 rounded-md hover:scale-110 transition-transform border border-transparent hover:border-stone-300 dark:hover:border-stone-600 shadow-sm
                                ${current === c ? 'ring-2 ring-stone-900 dark:ring-white ring-offset-1 dark:ring-offset-stone-800 z-10' : ''}
                            `}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    {/* Custom Color Picker */}
                    <div className="relative w-6 h-6">
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => {
                                onSelect(e.target.value);
                                onClose();
                            }}
                            title={t('custom_color')}
                        />
                        <div className="w-full h-full rounded-md flex items-center justify-center transition-all border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:scale-105 hover:border-stone-400 shadow-sm">
                            <span className="text-[10px] text-stone-500 font-bold">+</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

export { COLORS as PICKER_COLORS };
