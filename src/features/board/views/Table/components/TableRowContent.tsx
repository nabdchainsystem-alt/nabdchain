import React from 'react';
import { Trash } from 'phosphor-react';
import { Column, Row } from '../types';
import { DEFAULT_CHECKBOX_COLOR } from '../utils';
import type { DragListeners } from '@/types/drag';

interface TableRowContentProps {
    row: Row;
    dragListeners?: DragListeners;
    isOverlay?: boolean;
    visibleColumns: Column[];
    checkedRows: Set<string>;
    columns: Column[];
    onToggleRowSelection: (rowId: string) => void;
    onDeleteRow: (rowId: string) => void;
    onSelectColumnContextMenu?: (rect: DOMRect) => void;
    renderCellContent: (col: Column, row: Row) => React.ReactNode;
    isRTL?: boolean;
    activeColumnDragId?: string | null;
}

export const TableRowContent: React.FC<TableRowContentProps> = React.memo(({
    row,
    dragListeners,
    isOverlay = false,
    visibleColumns,
    checkedRows,
    columns,
    onToggleRowSelection,
    onDeleteRow,
    onSelectColumnContextMenu,
    renderCellContent,
    isRTL = false,
    activeColumnDragId,
}) => {
    return (
        <>
            {/* Columns */}
            {visibleColumns.map((col, index) => {
                const isSticky = !!col.pinned && !isOverlay;

                // Calculate position for sticky columns
                let offset = 0;
                if (isSticky) {
                    for (let i = 0; i < index; i++) {
                        if (visibleColumns[i].pinned) {
                            offset += visibleColumns[i].width;
                        }
                    }
                }

                const isDraggedColumn = activeColumnDragId === col.id;

                return (
                    <div
                        key={col.id}
                        data-row-id={row.id}
                        data-col-id={col.id}
                        className={`h-full border-e border-stone-100 dark:border-stone-800 ${col.id === 'select' ? 'flex items-center justify-center cursor-default' : ''} ${isSticky ? `z-10 ${checkedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-stone-900'}` : ''} ${isSticky && !visibleColumns[index + 1]?.pinned && !isOverlay ? `after:absolute ${isRTL ? 'after:left-0' : 'after:right-0'} after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]` : ''} ${isDraggedColumn ? 'opacity-50' : ''}`}
                        style={{
                            width: col.width,
                            ...(isSticky && {
                                [isRTL ? 'right' : 'left']: offset,
                                position: 'sticky',
                                willChange: isRTL ? 'transform, right' : 'transform, left',
                            }),
                            backgroundColor: col.backgroundColor || undefined
                        }}
                        onContextMenu={(e) => {
                            if (col.id === 'select' && onSelectColumnContextMenu) {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectColumnContextMenu(e.currentTarget.getBoundingClientRect());
                            }
                        }}
                    >
                        {col.id === 'select' ? (
                            <div
                                {...dragListeners}
                                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none px-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedRows.has(row.id)}
                                    onChange={() => onToggleRowSelection(row.id)}
                                    style={{
                                        accentColor: columns.find(c => c.id === 'select')?.color || DEFAULT_CHECKBOX_COLOR,
                                        willChange: 'transform'
                                    }}
                                    className="rounded border-stone-300 dark:border-stone-600 cursor-pointer w-4 h-4"
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            renderCellContent(col, row)
                        )}
                    </div>
                );
            })}

            {/* Fixed Actions Column (Delete) */}
            <div className="w-8 h-full flex items-center justify-center text-stone-300 border-s border-stone-100/50 dark:border-stone-800">
                {!isOverlay && (
                    <button
                        onClick={() => onDeleteRow(row.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                    >
                        <Trash size={14} />
                    </button>
                )}
            </div>
        </>
    );
});

TableRowContent.displayName = 'TableRowContent';
