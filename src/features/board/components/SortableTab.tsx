import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PushPin } from 'phosphor-react';

export interface SortableTabProps {
    viewId: string;
    isActive: boolean;
    label: string;
    icon: React.ElementType;
    isPinned?: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Sortable tab component for board view navigation
 * Supports drag-and-drop reordering of view tabs
 */
export const SortableTab: React.FC<SortableTabProps> = ({
    viewId,
    isActive,
    label,
    icon: Icon,
    isPinned,
    onClick,
    onContextMenu,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: viewId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={`
                flex items-center justify-start text-left gap-2 py-1.5 border-b-2 text-[13.6px] font-medium
                transition-colors whitespace-nowrap select-none cursor-pointer
                ${isActive
                    ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }
            `}
        >
            <div className="relative">
                <Icon size={16} />
                {isPinned && (
                    <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-monday-dark-surface rounded-full p-0.5 shadow-sm">
                        <PushPin size={8} className="text-blue-500" weight="fill" />
                    </div>
                )}
            </div>
            <span>{label}</span>
        </div>
    );
};

export default SortableTab;
