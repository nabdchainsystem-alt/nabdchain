import { useState, useCallback, useMemo } from 'react';
import { Row, Column, TableGroup } from '../types';

interface UseTableSelectionProps {
    columns: Column[];
}

interface UseTableSelectionReturn {
    // Get all selected rows across all groups
    getSelectedRows: (tableGroups: TableGroup[]) => Row[];

    // Select/deselect all rows in all groups
    handleSelectAll: (checked: boolean, setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>) => void;

    // Check if all rows are selected
    areAllSelected: (tableGroups: TableGroup[]) => boolean;

    // Check if some (but not all) rows are selected
    areSomeSelected: (tableGroups: TableGroup[]) => boolean;

    // Get count of selected rows
    selectedCount: (tableGroups: TableGroup[]) => number;

    // Select/deselect a single row
    toggleRowSelection: (
        rowId: string,
        groupId: string,
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>
    ) => void;

    // Clear all selections
    clearSelection: (setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>) => void;
}

export function useTableSelection({ columns }: UseTableSelectionProps): UseTableSelectionReturn {
    const selectColumnId = useMemo(() =>
        columns.find(c => c.id === 'select')?.id || 'select'
    , [columns]);

    const getSelectedRows = useCallback((tableGroups: TableGroup[]): Row[] => {
        const allRows: Row[] = [];
        tableGroups.forEach(g => {
            g.rows.forEach(r => {
                if (r[selectColumnId]) {
                    allRows.push(r);
                }
            });
        });
        return allRows;
    }, [selectColumnId]);

    const handleSelectAll = useCallback((
        checked: boolean,
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>
    ) => {
        setTableGroups(prevGroups => {
            return prevGroups.map(group => ({
                ...group,
                rows: group.rows.map(row => ({
                    ...row,
                    [selectColumnId]: checked
                }))
            }));
        });
    }, [selectColumnId]);

    const areAllSelected = useCallback((tableGroups: TableGroup[]): boolean => {
        const allRows = tableGroups.flatMap(g => g.rows);
        if (allRows.length === 0) return false;
        return allRows.every(r => r[selectColumnId]);
    }, [selectColumnId]);

    const areSomeSelected = useCallback((tableGroups: TableGroup[]): boolean => {
        const allRows = tableGroups.flatMap(g => g.rows);
        if (allRows.length === 0) return false;
        const selectedCount = allRows.filter(r => r[selectColumnId]).length;
        return selectedCount > 0 && selectedCount < allRows.length;
    }, [selectColumnId]);

    const selectedCount = useCallback((tableGroups: TableGroup[]): number => {
        return tableGroups.flatMap(g => g.rows).filter(r => r[selectColumnId]).length;
    }, [selectColumnId]);

    const toggleRowSelection = useCallback((
        rowId: string,
        groupId: string,
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>
    ) => {
        setTableGroups(prevGroups => {
            return prevGroups.map(group => {
                if (group.id !== groupId) return group;
                return {
                    ...group,
                    rows: group.rows.map(row => {
                        if (row.id !== rowId) return row;
                        return {
                            ...row,
                            [selectColumnId]: !row[selectColumnId]
                        };
                    })
                };
            });
        });
    }, [selectColumnId]);

    const clearSelection = useCallback((
        setTableGroups: React.Dispatch<React.SetStateAction<TableGroup[]>>
    ) => {
        setTableGroups(prevGroups => {
            return prevGroups.map(group => ({
                ...group,
                rows: group.rows.map(row => ({
                    ...row,
                    [selectColumnId]: false
                }))
            }));
        });
    }, [selectColumnId]);

    return {
        getSelectedRows,
        handleSelectAll,
        areAllSelected,
        areSomeSelected,
        selectedCount,
        toggleRowSelection,
        clearSelection,
    };
}
