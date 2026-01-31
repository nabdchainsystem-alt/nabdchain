/**
 * Shared drag-and-drop type definitions
 * Used across table, list, and kanban components
 */
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

/**
 * Drag listeners from @dnd-kit useSortable hook
 * Used to attach drag handlers to elements
 */
export type DragListeners = SyntheticListenerMap | undefined;

/**
 * Props for components that receive drag listeners
 */
export interface DraggableProps {
    dragListeners?: DragListeners;
    isDragging?: boolean;
}
