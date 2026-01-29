import React, { useState, useEffect, useRef } from 'react';
import { Column, TableGroup, Row } from '../types';
import { SortableHeader } from './SortableHeader';
import { Trash as Trash2, Plus } from 'phosphor-react';
import { HeaderContextMenu } from './HeaderContextMenu';
import { useAppContext } from '../../../../../contexts/AppContext';

// Standard column IDs/types that should be translated
const STANDARD_COLUMN_KEYS: Record<string, string> = {
    'name': 'name',
    'people': 'col_people',
    'status': 'col_status',
    'priority': 'col_priority',
    'date': 'col_date',
    'dueDate': 'due_date',
    'timeline': 'col_timeline',
    'files': 'col_files',
    'checkbox': 'col_checkbox',
    'number': 'col_numbers',
    'text': 'col_text',
    'email': 'col_email',
    'phone': 'col_phone',
    'url': 'col_url',
    'location': 'col_location',
    'rating': 'col_rating',
    'tags': 'col_tags',
    'currency': 'col_currency',
    'dropdown': 'col_dropdown',
    'doc': 'col_doc',
    'voting': 'col_voting',
    'world_clock': 'col_world_clock',
};

interface HeaderMenuPosition {
    colId: string;
    position: { x: number; y: number };
}

interface TableHeaderCellProps {
    col: Column;
    index: number;
    columnsLength: number;
    group: TableGroup;
    rows: Row[];
    renamingColId: string | null;
    setRenamingColId: (id: string | null) => void;
    handleRenameColumn: (colId: string, newName: string) => void;
    handleSort: (colId: string) => void;
    handleDeleteColumn: (colId: string) => void;
    handleSelectAll: (checked: boolean) => void;
    setActiveHeaderMenu: (menu: HeaderMenuPosition | null) => void;
    startResize: (e: React.MouseEvent, colId: string, currentWidth: number) => void;
    activeColumnDragId: string | null;
    style?: React.CSSProperties;
    showRightShadow?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
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
    sortDirection,
}) => {
    const { t, dir } = useAppContext();
    const isRTL = dir === 'rtl';
    const uniqueId = `${group.id}__${col.id}`;

    // Get translated label for standard columns, or use the custom label
    const getColumnLabel = (column: Column): string => {
        // First check by exact ID match for standard columns (name, status, priority, etc.)
        const idTranslationKey = STANDARD_COLUMN_KEYS[column.id];
        if (idTranslationKey) {
            return t(idTranslationKey);
        }

        // Then check by column type for dynamically added columns
        // Only use translation if the label appears to be auto-generated (not user-customized)
        const typeTranslationKey = STANDARD_COLUMN_KEYS[column.type];
        if (typeTranslationKey) {
            // Check if label is still the default (matches any language's translation pattern)
            // If user renamed it to something custom, preserve their name
            const defaultLabel = t(typeTranslationKey);
            const labelLower = column.label?.toLowerCase() || '';
            const typeLower = column.type?.toLowerCase() || '';

            // Use translation if: label matches current translation, or label matches type name
            // This handles: "Status", "الحالة", "status", etc.
            if (!column.label || column.label === defaultLabel || labelLower === typeLower || labelLower === typeTranslationKey) {
                return defaultLabel;
            }
        }

        // For all other columns (custom columns), use their stored label
        // This preserves user-entered custom names
        return column.label;
    };
    const displayLabel = getColumnLabel(col);
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
            sortDirection={sortDirection}
            className={`
                h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 shrink-0
                ${col.id === 'select' ? 'justify-center px-0' : col.id === 'name' ? 'justify-start px-3' : 'justify-center px-3'}
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
                        aria-label={isAllSelected ? 'Deselect all rows' : 'Select all rows'}
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
                    <span className={`truncate flex-1 ${col.id === 'name' ? 'text-start' : 'text-center'} select-none`} onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (col.id !== 'select') setRenamingColId(col.id);
                    }}>
                        {displayLabel}
                        {sortDirection === 'asc' && <span className="ms-1 text-blue-500">↑</span>}
                        {sortDirection === 'desc' && <span className="ms-1 text-blue-500">↓</span>}
                    </span>
                    {!['name', 'select'].includes(col.id) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                            title={t('delete_column')}
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                    <div
                        className={`w-1 h-3/4 cursor-col-resize hover:bg-stone-300 dark:hover:bg-stone-600 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 z-10 ${isRTL ? '-left-[2px]' : '-right-[2px]'}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => { e.stopPropagation(); startResize(e, col.id, col.width); }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </SortableHeader>
    );
};
