import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Row } from '../types';
import type { DragListeners } from '@/types/drag';

interface SortableRowProps {
  row: Row;
  children: (dragListeners: DragListeners, isRowDragging: boolean) => React.ReactNode;
  className: string;
}

export const SortableRow: React.FC<SortableRowProps> = ({ row, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  // GPU-accelerated transform for smooth dragging
  const style: React.CSSProperties = {
    // Use translate3d for GPU acceleration
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    // Smooth transition only when not actively dragging
    transition: isDragging
      ? 'none' // No transition during drag for instant response
      : 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    // GPU acceleration hints
    willChange: isDragging ? 'transform' : 'auto',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'dragging' : ''}`}
      role="row"
      {...attributes}
    >
      {children(listeners, isDragging)}
    </div>
  );
};
