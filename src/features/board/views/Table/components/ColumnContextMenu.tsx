import React, { useRef } from 'react';
import {
    ArrowUpDown,
    ArrowLeftToLine,
    ArrowRightToLine,
    MoveHorizontal,
    Pin,
    ArrowLeft,
    ArrowRight,
    Trash2,
    Edit2
} from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/useClickOutside';

interface ColumnContextMenuProps {
    onClose: () => void;
    onAction: (action: string) => void;
    columnId: string;
}

export const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ onClose, onAction, columnId }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    useClickOutside(wrapperRef, onClose);

    const menuItems = [
        { id: 'sort', label: 'Sort', icon: ArrowUpDown },
        { id: 'insert_left', label: 'Insert left', icon: ArrowLeftToLine },
        { id: 'insert_right', label: 'Insert right', icon: ArrowRightToLine },
        { id: 'autosize', label: 'Autosize this column', icon: MoveHorizontal },
        { id: 'pin', label: 'Pin column', icon: Pin },
        { id: 'rename', label: 'Rename column', icon: Edit2 },
        { separator: true },
        { id: 'move_start', label: 'Move to start', icon: ArrowLeft },
        { id: 'move_end', label: 'Move to end', icon: ArrowRight },
    ];

    return (
        <div
            ref={wrapperRef}
            onClick={(e) => e.stopPropagation()}
            className="w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden flex flex-col py-1"
        >
            {menuItems.map((item, index) => {
                if (item.separator) {
                    return <div key={`sep-${index}`} className="h-px bg-stone-100 dark:bg-stone-800 my-1" />;
                }

                const Icon = item.icon as React.ElementType;

                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            onAction(item.id!);
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-start hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
                    >
                        <Icon size={16} className="text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300" />
                        <span className="text-stone-700 dark:text-stone-200">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
