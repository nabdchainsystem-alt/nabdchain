import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '../../../../../hooks/useClickOutside';
import { Palette, ArrowUp, ArrowDown, PushPin } from 'phosphor-react';
import { useLanguage } from '../../../../../contexts/LanguageContext';

interface HeaderContextMenuProps {
    onClose: () => void;
    onHeaderColorSelect: (color: string) => void;
    onColumnColorSelect: (color: string) => void;
    onRename?: () => void;
    onSortAsc?: () => void;
    onSortDesc?: () => void;
    onFreezeToggle?: () => void;
    isFrozen?: boolean;
    canFreeze?: boolean;
    currentHeaderColor?: string;
    currentColumnColor?: string;
    position: { x: number; y: number };
}

const COLORS = [
    { label: 'Default', value: '' },
    // Soft / Pastels
    { label: 'White', value: '#ffffff' },
    { label: 'Subtle Grey', value: '#f5f5f4' },
    { label: 'Warm Sand', value: '#fdfbf7' },
    { label: 'Muted Blue', value: '#eff6ff' }, // blue-50
    { label: 'Soft Sage', value: '#ecfdf5' }, // emerald-50
    { label: 'Pale Rose', value: '#fff1f2' }, // rose-50
    { label: 'Lavender', value: '#faf5ff' }, // purple-50
    // Vibrant / Richer
    { label: 'Sky Blue', value: '#bae6fd' }, // sky-200
    { label: 'Mint', value: '#a7f3d0' }, // emerald-200
    { label: 'Peach', value: '#fed7aa' }, // orange-200
    { label: 'Blossom', value: '#fbcfe8' }, // pink-200
    { label: 'Periwinkle', value: '#c7d2fe' }, // indigo-200
    { label: 'Canary', value: '#fef08a' }, // yellow-200
    { label: 'Mist', value: '#e2e8f0' }, // slate-200
];

export const HeaderContextMenu: React.FC<HeaderContextMenuProps> = ({ onClose, onHeaderColorSelect, onColumnColorSelect, onRename, onSortAsc, onSortDesc, onFreezeToggle, isFrozen, canFreeze, currentHeaderColor, currentColumnColor, position }) => {
    const { t } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, onClose);

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
        top: position.y,
        left: position.x,
        opacity: 0
    });

    const [activeTab, setActiveTab] = useState<'header' | 'column'>('header');

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
                // Anchor to the left of the cursor
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

    const renderColorGrid = (current: string | undefined, onSelect: (c: string) => void) => (
        <div className="grid grid-cols-5 gap-1.5 p-2 pt-0">
            {COLORS.map((color) => (
                <button
                    key={color.label}
                    onClick={() => {
                        onSelect(color.value);
                        onClose();
                    }}
                    title={color.label}
                    className={`
                        w-7 h-7 rounded-md flex items-center justify-center transition-all border shadow-sm
                        ${color.value ? '' : 'bg-white dark:bg-stone-800'}
                        ${(current === color.value || (!current && !color.value))
                            ? 'border-blue-500 ring-2 ring-blue-500/20 z-10 scale-110'
                            : 'border-stone-200 dark:border-stone-700 hover:scale-105 hover:border-stone-400'}
                    `}
                    style={{ backgroundColor: color.value || undefined }}
                >
                    {!color.value && <div className="w-full h-[1px] bg-red-400 rotate-45" />}
                </button>
            ))}
            {/* Native Color Picker trigger */}
            <div className="relative w-7 h-7">
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
                    <Palette size={14} className="text-stone-500" />
                </div>
            </div>
        </div>
    );

    return createPortal(
        <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[9999] w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden menu-enter flex flex-col py-1"
            style={menuStyle}
        >
            {/* Sort Options */}
            <div className="p-1 mb-1 space-y-0.5">
                {onSortAsc && (
                    <button
                        onClick={() => {
                            onSortAsc();
                            onClose();
                        }}
                        className="w-full text-start px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded flex items-center gap-2"
                    >
                        <ArrowUp size={16} className="text-stone-400" />
                        <span className="font-medium">{t('sort_ascending')}</span>
                    </button>
                )}
                {onSortDesc && (
                    <button
                        onClick={() => {
                            onSortDesc();
                            onClose();
                        }}
                        className="w-full text-start px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded flex items-center gap-2"
                    >
                        <ArrowDown size={16} className="text-stone-400" />
                        <span className="font-medium">{t('sort_descending')}</span>
                    </button>
                )}
            </div>

            <div className="h-px bg-stone-100 dark:bg-stone-800 mx-2 my-1" />

            {onRename && (
                <div className="p-1 mb-1">
                    <button
                        onClick={() => {
                            onRename();
                            onClose();
                        }}
                        className="w-full text-start px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded flex items-center gap-2"
                    >
                        <span className="font-medium">{t('rename')}</span>
                    </button>
                    <div className="h-px bg-stone-100 dark:bg-stone-800 my-1 mx-2" />
                </div>
            )}

            {canFreeze && onFreezeToggle && (
                <div className="p-1 mb-1">
                    <button
                        onClick={() => {
                            onFreezeToggle();
                            onClose();
                        }}
                        className="w-full text-start px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded flex items-center gap-2"
                    >
                        <PushPin
                            size={16}
                            className={`text-stone-400 ${isFrozen ? 'fill-current text-blue-500' : ''} ${isFrozen ? '-rotate-45' : ''}`}
                            weight={isFrozen ? 'fill' : 'regular'}
                        />
                        <span className="font-medium">
                            {isFrozen ? t('unfreeze_column') : t('freeze_column')}
                        </span>
                    </button>
                    <div className="h-px bg-stone-100 dark:bg-stone-800 my-1 mx-2" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 mx-2 bg-stone-100 dark:bg-stone-800 rounded-lg mb-2">
                <button
                    onClick={() => setActiveTab('header')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'header'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                        }`}
                >
                    {t('header_color')}
                </button>
                <button
                    onClick={() => setActiveTab('column')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'column'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                        }`}
                >
                    {t('column_bg_color')}
                </button>
            </div>

            {/* Content */}
            <div className="px-1">
                {activeTab === 'header' ? (
                    renderColorGrid(currentHeaderColor, onHeaderColorSelect)
                ) : (
                    renderColorGrid(currentColumnColor, onColumnColorSelect)
                )}
            </div>
        </div>,
        document.body
    );
};
