import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row } from '../types';

interface SortableRowProps {
    row: Row;
    children: (dragListeners: any, isRowDragging: boolean) => React.ReactNode;
    className: string;
}

export const SortableRow: React.FC<SortableRowProps> = ({ row, children, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.id });

    const style = {
        transform: isDragging ? CSS.Transform.toString(transform) : 'none',
        transition: isDragging ? transition : undefined,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={className} role="row" {...attributes}>
            {children(listeners, isDragging)}
        </div>
    );
};
