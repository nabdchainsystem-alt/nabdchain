import React, { useState, useEffect, useRef } from 'react';
import { Column } from '../../../../types/boardTypes';
import { SortableHeader } from './SortableHeader';
import { Trash2, Plus } from 'lucide-react';
import { HeaderContextMenu } from './HeaderContextMenu';

interface TableHeaderCellProps {
    col: Column;
    index: number;
    columnsLength: number;
    group: any;
    rows: any[];
    renamingColId: string | null;
    setRenamingColId: (id: string | null) => void;
    handleRenameColumn: (colId: string, newName: string) => void;
    handleSort: (colId: string) => void;
    handleDeleteColumn: (colId: string) => void;
    handleSelectAll: (checked: boolean) => void;
    setActiveHeaderMenu: (menu: any) => void;
    startResize: (e: React.MouseEvent, colId: string, currentWidth: number) => void;
    activeColumnDragId: string | null;
    style?: React.CSSProperties;
    showRightShadow?: boolean;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
    col,
    index,
    columnsLength,
    group,
    rows,
    renamingColId,
    setRenamingColId,
    handleRenameColumn,
    handleSort,
    handleDeleteColumn,
    handleSelectAll,
    setActiveHeaderMenu,
    startResize,
    activeColumnDragId,
    style,
    showRightShadow,
}) => {
    const uniqueId = `${group.id}__${col.id}`;
    // const isSticky = !!col.pinned; <- passed via style now

    // Calculate sticky position if needed
    // Note: We need the full columns array to calculate sticky offset properly.
    // For now, simpler sticky logic might be needed or passed in as prop.
    // However, the original code calculated 'leftPos' inside the map loop based on *previous* columns.
    // We should pass 'leftPos' as a prop to this component.

    // ... wait, I need to modify the props to accept 'leftPos'.

    const isSelectCol = col.id === 'select';
    let isAllSelected = false;
    if (isSelectCol) {
        const allRowsCount = rows.length;
        const selectedCount = rows.filter(r => !!r['select']).length;
        isAllSelected = allRowsCount > 0 && selectedCount === allRowsCount;
    }

    // Use lifted state for renaming
    const isRenaming = renamingColId === col.id;
    const [renameValue, setRenameValue] = useState(col.label);

    // Sync local value when col label changes or renaming starts
    useEffect(() => {
        setRenameValue(col.label);
    }, [col.label, isRenaming]);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    return (
        <SortableHeader
            key={uniqueId}
            col={{ ...col, id: uniqueId }}
            index={index}
            disabled={isRenaming}
            className={`
                h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 shrink-0
                ${col.id === 'select' ? 'justify-center px-0' : col.id === 'name' ? 'px-3' : 'justify-center px-3'}
                ${index !== columnsLength - 1 ? 'border-e border-stone-200/50 dark:border-stone-800' : ''}
                hover:bg-stone-100 dark:hover:bg-stone-800 ${col.id !== 'select' ? 'cursor-pointer' : 'cursor-default'} transition-colors select-none relative group
                ${col.pinned ? 'z-50 bg-stone-50 dark:bg-stone-900' : 'bg-stone-100 dark:bg-stone-900'}
                ${showRightShadow ? 'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.1)]' : ''}
                ${activeColumnDragId === col.id ? 'opacity-30' : ''}
            `}
            style={style}
            onClick={() => {
                if (col.id !== 'select' && !isRenaming) {
                    handleSort(col.id);
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveHeaderMenu({
                    colId: col.id,
                    position: { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
                });
            }}
        >
            {isSelectCol ? (
                <div className="flex items-center justify-center w-full h-full">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-stone-300 dark:border-stone-600 cursor-pointer w-4 h-4 accent-blue-600"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ) : isRenaming ? (
                <div className="w-full h-full px-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                            handleRenameColumn(col.id, renameValue);
                            setRenamingColId(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRenameColumn(col.id, renameValue);
                                setRenamingColId(null);
                            }
                            if (e.key === 'Escape') {
                                setRenamingColId(null);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full h-8 bg-white dark:bg-stone-800 border border-blue-500 rounded px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            ) : (
                <div className={`flex items-center ${col.id === 'name' ? 'justify-between' : 'justify-center'} w-full px-2`}>
                    <span className="truncate flex-1 text-center select-none" onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (col.id !== 'select') setRenamingColId(col.id);
                    }}>{col.label}</span>
                    {!['name', 'select'].includes(col.id) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                            title="Delete Column"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                    <div
                        className="w-1 h-3/4 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-600 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute -right-[2px] top-1/2 -translate-y-1/2 z-10"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => { e.stopPropagation(); startResize(e, col.id, col.width); }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </SortableHeader>
    );
};
