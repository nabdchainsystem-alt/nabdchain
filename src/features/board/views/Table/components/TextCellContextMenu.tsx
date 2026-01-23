import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette } from 'phosphor-react';
import { useClickOutside } from '../../../../../hooks/useClickOutside';
import { useAppContext } from '../../../../../contexts/AppContext';

interface TextCellContextMenuProps {
    onClose: () => void;
    onColorSelect: (color: string) => void;
    onColumnColorSelect?: (color: string) => void;
    currentColor?: string;
    currentColumnColor?: string;
    position: { x: number; y: number };
}

// Rich text colors (using Tailwind text-500/600 shades for visibility)
const TEXT_COLORS = [
    { label: 'Default', value: '' },
    { label: 'Dark', value: '#1c1917' }, // stone-900
    { label: 'Gray', value: '#57534e' }, // stone-600
    { label: 'Red', value: '#ef4444' }, // red-500
    { label: 'Orange', value: '#f97316' }, // orange-500
    { label: 'Amber', value: '#f59e0b' }, // amber-500
    { label: 'Yellow', value: '#eab308' }, // yellow-500
    { label: 'Lime', value: '#84cc16' }, // lime-500
    { label: 'Green', value: '#22c55e' }, // green-500
    { label: 'Emerald', value: '#10b981' }, // emerald-500
    { label: 'Teal', value: '#14b8a6' }, // teal-500
    { label: 'Cyan', value: '#06b6d4' }, // cyan-500
    { label: 'Sky', value: '#0ea5e9' }, // sky-500
    { label: 'Blue', value: '#3b82f6' }, // blue-500
    { label: 'Indigo', value: '#6366f1' }, // indigo-500
    { label: 'Violet', value: '#8b5cf6' }, // violet-500
    { label: 'Purple', value: '#a855f7' }, // purple-500
    { label: 'Fuchsia', value: '#d946ef' }, // fuchsia-500
    { label: 'Pink', value: '#ec4899' }, // pink-500
    { label: 'Rose', value: '#f43f5e' }, // rose-500
];

export const TextCellContextMenu: React.FC<TextCellContextMenuProps> = ({ onClose, onColorSelect, onColumnColorSelect, currentColor, currentColumnColor, position }) => {
    const { t } = useAppContext();
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, onClose);

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
        top: position.y,
        left: position.x,
        opacity: 0
    });

    useLayoutEffect(() => {
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - position.y;
            const menuHeight = menuRect.height || 400;

            let top = position.y;
            let left = position.x;

            if (spaceBelow < menuHeight) {
                top = Math.max(10, position.y - menuHeight);
            }

            if (left + menuRect.width > window.innerWidth - 20) {
                // Anchor the right side of the menu to the cursor position
                left = position.x - menuRect.width;
                if (left < 10) left = 10;
            }

            setMenuStyle({
                top,
                left,
                opacity: 1
            });
        }
    }, [position.x, position.y]);

    const renderColorGrid = (current: string | undefined, onSelect: (c: string) => void, isText: boolean = false) => (
        <div className="grid grid-cols-7 gap-1.5 p-2">
            {TEXT_COLORS.map((color) => (
                <button
                    key={color.label}
                    onClick={() => {
                        onSelect(color.value);
                        onClose();
                    }}
                    title={color.label}
                    className={`
                        w-6 h-6 rounded-md flex items-center justify-center transition-all border shadow-sm
                        ${color.value ? '' : 'bg-white dark:bg-stone-800'}
                        ${(current === color.value || (!current && !color.value))
                            ? 'border-blue-500 ring-2 ring-blue-500/20 z-10 scale-110'
                            : 'border-stone-200 dark:border-stone-700 hover:scale-105 hover:border-stone-400'}
                    `}
                    style={{ backgroundColor: isText ? undefined : (color.value || undefined) }}
                >
                    {isText && color.value && (
                        <span className="text-xs font-bold" style={{ color: color.value }}>A</span>
                    )}
                    {!color.value && <div className="w-full h-[1px] bg-red-400 rotate-45" />}
                </button>
            ))}
            {/* Native Color Picker trigger */}
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
                <div className={`
                    w-full h-full rounded-md flex items-center justify-center transition-all border shadow-sm bg-stone-100 dark:bg-stone-800
                    hover:scale-105 hover:border-stone-400 border-stone-200 dark:border-stone-700
                `}>
                    <Palette size={12} className="text-stone-500" />
                </div>
            </div>
        </div>
    );

    return createPortal(
        <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[9999] w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1"
            style={menuStyle}
        >
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 mb-1">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{t('text_color')}</span>
            </div>
            {renderColorGrid(currentColor, onColorSelect, true)}

            {onColumnColorSelect && (
                <>
                    <div className="px-3 py-2 bg-stone-50 dark:bg-stone-800/50 border-y border-stone-100 dark:border-stone-800 my-1 mt-2">
                        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{t('column_bg_color')}</span>
                    </div>
                    {/* For column background, we reuse the same colors but apply as background */}
                    {renderColorGrid(currentColumnColor, onColumnColorSelect, false)}
                </>
            )}
        </div>,
        document.body
    );
};
