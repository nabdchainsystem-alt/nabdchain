import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '../types';

interface SortableHeaderProps {
    col: Column;
    index: number;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ col, index, children, className, style, onClick, onContextMenu, disabled, sortDirection }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging,
    } = useSortable({
        id: col.id,
        disabled: disabled || col.id.endsWith('__select') || col.id === 'select'
    });

    // Do NOT apply transform - let DragOverlay handle visual movement
    const dndStyle: React.CSSProperties = {
        opacity: isDragging ? 0.3 : 1,
        cursor: (col.id.endsWith('__select') || col.id === 'select') ? 'default' : 'grab',
        ...style,
    };

    // Determine aria-sort value
    const ariaSort = sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined;

    return (
        <div
            ref={setNodeRef}
            style={dndStyle}
            className={className}
            onClick={onClick}
            onContextMenu={onContextMenu}
            role="columnheader"
            aria-sort={ariaSort}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
};
