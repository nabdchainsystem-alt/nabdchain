import React, { useEffect, useRef } from 'react';
import { Trash as Trash2, Copy, ArrowLeft, ArrowRight, PencilSimple as Edit3 } from 'phosphor-react';
import { createPortal } from 'react-dom';

interface ColumnContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
}

export const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ x, y, onClose, onAction }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        // Adjust position if it goes off screen
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (rect.right > viewportWidth) {
                menuRef.current.style.left = `${viewportWidth - rect.width - 8}px`;
            }
            if (rect.bottom > viewportHeight) {
                menuRef.current.style.top = `${viewportHeight - rect.height - 8}px`;
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return createPortal(
        <>
        <div className="fixed inset-0 z-[9998]" onClick={onClose} />
        <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 animate-in fade-in zoom-in-95 duration-75"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-2 py-1 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                Column Options
            </div>

            <button
                className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 transition-colors"
                onClick={() => onAction('rename')}
            >
                <Edit3 size={16} />
                <span>Rename</span>
            </button>

            <button
                className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 transition-colors"
                onClick={() => onAction('duplicate')}
            >
                <Copy size={16} />
                <span>Duplicate</span>
            </button>

            <div className="h-px bg-stone-100 dark:bg-stone-700 my-1.5" />

            <div className="flex items-center px-1">
                <button
                    className="flex-1 text-center py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center justify-center gap-1 transition-colors"
                    onClick={() => onAction('move_left')}
                    title="Move Left"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1" />
                <button
                    className="flex-1 text-center py-1.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center justify-center gap-1 transition-colors"
                    onClick={() => onAction('move_right')}
                    title="Move Right"
                >
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="h-px bg-stone-100 dark:bg-stone-700 my-1.5" />

            <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                onClick={() => onAction('delete')}
            >
                <Trash2 size={16} />
                <span>Delete</span>
            </button>
        </div>
        </>,
        document.body
    );
};
