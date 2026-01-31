import React, { memo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Row } from '../types';
import { SortableRow } from './SortableRow';
import type { DragListeners } from '@/types/drag';

// =============================================================================
// VIRTUALIZED ROWS COMPONENT
// Note: Virtualization temporarily disabled pending react-window v2 migration
// Currently uses standard rendering which works well for most list sizes
// =============================================================================

interface VirtualizedRowsProps {
    rows: Row[];
    rowHeight: number;
    containerHeight: number;
    containerWidth: number;
    activeDragId: string | null;
    checkedRows: Set<string>;
    isDoneStatus: (status: string | undefined) => boolean;
    renderRowContent: (row: Row, dragListeners: DragListeners, isRowDragging: boolean) => React.ReactNode;
}

export const VirtualizedRows: React.FC<VirtualizedRowsProps> = memo(({
    rows,
    activeDragId,
    checkedRows,
    isDoneStatus,
    renderRowContent
}) => {
    return (
        <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {rows.map((row) => (
                <SortableRow
                    key={row.id}
                    row={row}
                    className={`
                        group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50
                        hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                        ${activeDragId === row.id ? 'opacity-30' : ''}
                        ${isDoneStatus(row.status) ? 'bg-green-50 dark:bg-green-900/20' : checkedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-stone-900'}
                    `}
                >
                    {(dragListeners, isRowDragging) => renderRowContent(row, dragListeners, isRowDragging)}
                </SortableRow>
            ))}
        </SortableContext>
    );
});

VirtualizedRows.displayName = 'VirtualizedRows';
