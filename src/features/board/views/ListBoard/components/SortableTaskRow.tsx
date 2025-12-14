import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskRow } from './TaskRow';
import { TaskItem, StatusOption, ColumnWidths } from '../types';

interface SortableTaskRowProps {
  item: TaskItem;
  statusOptions: StatusOption[];
  groupColor: string;
  colWidths: ColumnWidths;
  onUpdate: (updatedItem: TaskItem) => void;
  onDelete: () => void;
}

export const SortableTaskRow: React.FC<SortableTaskRowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};