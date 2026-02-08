/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useCallback, useEffect, useMemo, memo, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../../../contexts/AppContext';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { VaultItem } from '../../../vault/types';
import { useToast } from '../../../../components/common/Toast';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PriorityLevel } from '../../../priorities/priorityUtils';
import { useReminders } from '../../../reminders/reminderStore';
import { ReminderPanel } from '../../../reminders/ReminderPanel';
import { ChartBuilderConfig } from '../../components/chart-builder/types';
import {
  TablePagination,
  TableCell,
  TableRowContent,
  RoomTableModals,
  RoomTableToolbar,
  RoomTableBody,
} from './components';

// Import from centralized types and hooks
import { Column, Row, TableGroup, GroupColor, FilterRule, SortRule, GROUP_COLORS, DEFAULT_COLUMNS } from './types';

import {
  useCustomStatuses,
  useToolbarState,
  useGroupManagement,
  useModalState,
  useColumnOperations,
  useDragDropHandlers,
  useExcelImport,
  useRowOperations,
  useTableDataProcessing,
} from './hooks';

// Re-export types for consumers
export type { Column, Row, TableGroup, GroupColor, FilterRule, SortRule };

interface RoomTableProps {
  roomId: string;
  viewId: string;
  defaultColumns?: Column[];
  tasks?: any[];
  name?: string;
  columns?: Column[];
  onUpdateTasks?: (tasks: any[]) => void;
  onDeleteTask?: (groupId: string, taskId: string) => void;
  onNavigate?: (view: string) => void;

  onAddGroup?: (id: string, title: string, color?: string) => void;
  onUpdateGroup?: (id: string, title: string) => void;
  onDeleteGroup?: (id: string) => void;
  onRename?: (newName: string) => void;
  renderCustomActions?: (props: {
    setRows: React.Dispatch<React.SetStateAction<Row[]>>;
    setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
    setIsChartModalOpen: (open: boolean) => void;
    setIsAIReportModalOpen: (open: boolean) => void;
  }) => React.ReactNode;
  enableImport?: boolean;
  hideGroupHeader?: boolean;
  showPagination?: boolean;
  tasksVersion?: string;
}

// --- Main RoomTable Component ---
const RoomTable: React.FC<RoomTableProps> = ({
  roomId,
  viewId,
  defaultColumns,
  tasks: externalTasks,
  name: _initialName,
  columns: externalColumns,
  onUpdateTasks,
  onDeleteTask,
  renderCustomActions,
  _onRename,
  onNavigate,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  _enableImport,
  hideGroupHeader,
  showPagination,
  tasksVersion,
}) => {
  const { t, dir } = useAppContext();
  const isRTL = dir === 'rtl';
  const { showToast } = useToast();
  // Keys for persistence
  const storageKeyColumns = `room-table-columns-v7-${roomId}-${viewId}`;
  const _storageKeyRows = `room-table-rows-v7-${roomId}-${viewId}`;
  const _storageKeyName = `room-table-name-v7-${roomId}-${viewId}`;

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts prevents accidental drags on clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Modal/menu states (consolidated hook)
  const {
    isChartModalOpen,
    setIsChartModalOpen,
    isAIReportModalOpen,
    setIsAIReportModalOpen,
    isExcelImportModalOpen,
    setIsExcelImportModalOpen,
    isUploadModalOpen,
    setIsUploadModalOpen,
    activeCell,
    setActiveCell,
    activeTextMenu,
    setActiveTextMenu,
    activeHeaderMenu,
    setActiveHeaderMenu,
    activeColorMenu,
    setActiveColorMenu,
    activeColumnMenu,
    setActiveColumnMenu,
    renamingColId,
    setRenamingColId,
    activeRowDetail,
    setActiveRowDetail,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    activeKpiFilter,
    setActiveKpiFilter,
    deleteConfig,
    setDeleteConfig,
    activeUploadCell,
    setActiveUploadCell,
    activeUploadFile,
    setActiveUploadFile,
    activeReminderTarget,
    setActiveReminderTarget,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    closeAllMenus,
  } = useModalState();

  // Toolbar states (consolidated hook) — placed early for dependency by useGroupManagement
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchInputRef,
    toggleSearch,
    isPersonFilterOpen,
    setIsPersonFilterOpen,
    personFilter,
    setPersonFilter,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    filters,
    setFilters,
    isSortPanelOpen,
    setIsSortPanelOpen,
    sortRules,
    setSortRules,
    isHideColumnsOpen,
    setIsHideColumnsOpen,
    hiddenColumns,
    setHiddenColumns,
    columnSearchQuery,
    setColumnSearchQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isBodyVisible,
    setIsBodyVisible,
    isClearDataModalOpen,
    setIsClearDataModalOpen,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearAllFilters,
  } = useToolbarState();
  const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);

  // Custom statuses (consolidated hook)
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    customStatuses,
    setCustomStatuses,
    addStatus: handleAddCustomStatus,
    deleteStatus: handleDeleteCustomStatus,
  } = useCustomStatuses(roomId, t);

  const creationRowInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // --- State ---
  const [columns, setColumns] = useState<Column[]>(() => {
    if (externalColumns && externalColumns.length > 0) return externalColumns;
    try {
      const saved = localStorage.getItem(storageKeyColumns);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Ensure select and name are pinned (migration)
          // Also ensure Data 2 label is in English
          return parsed.map((col: Column) => {
            if (col.id === 'select' || col.id === 'name') {
              return { ...col, pinned: true };
            }
            if (col.id === 'data2' && col.label === 'بيانات 2') {
              return { ...col, label: 'Data 2' };
            }
            return col;
          });
        }
      }
      // Use prop defaultColumns if available, otherwise internal default
      return defaultColumns && defaultColumns.length > 0 ? defaultColumns : DEFAULT_COLUMNS;
    } catch {
      return defaultColumns && defaultColumns.length > 0 ? defaultColumns : DEFAULT_COLUMNS;
    }
  });

  // Group management (consolidated hook)
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tableGroups,
    setTableGroups,
    storageKeyGroups,
    addGroup: _handleAddTableGroup,
    updateGroupName: handleUpdateGroupName,
    toggleGroupCollapse: handleToggleGroupCollapse,
    toggleGroupPin: handleToggleGroupPin,
    deleteGroup: handleDeleteGroup,
    addRowToGroup: _handleAddRowToGroup,
  } = useGroupManagement({
    roomId,
    viewId,
    externalTasks,
    tasksVersion,
    columns,
    t,
    onAddGroup,
    onUpdateGroup,
    onDeleteGroup,
    setSortRules: setSortRules as (rules: never[]) => void,
    setSortConfig: setSortConfig as (config: null) => void,
  });

  // Derived rows from all groups (for backward compatibility with filtering, sorting, reminders etc.)
  const rows = useMemo(() => tableGroups.flatMap((g) => g.rows), [tableGroups]);

  // Wrapper setRows that updates the first group (for backward compatibility with some handlers)
  const setRows: React.Dispatch<React.SetStateAction<Row[]>> = useCallback((action) => {
    setTableGroups((prev) => {
      const newRows = typeof action === 'function' ? action(prev[0]?.rows || []) : action;
      if (prev.length === 0) {
        return [{ id: 'group-1', name: 'Group 1', rows: newRows, isCollapsed: false, color: GROUP_COLORS[0] }];
      }
      return prev.map((g, idx) => (idx === 0 ? { ...g, rows: newRows } : g));
    });
  }, []);

  // Pagination State with transition for smooth navigation
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPageRaw] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(showPagination ? 50 : -1);

  // Wrap page changes in transition for smoother UX
  const setCurrentPage = useCallback((page: number) => {
    startTransition(() => {
      setCurrentPageRaw(page);
    });
  }, []);

  // Pinned Charts State
  const storageKeyPinnedCharts = `room-table-pinned-charts-${roomId}-${viewId}`;
  const [pinnedCharts, setPinnedCharts] = useState<ChartBuilderConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyPinnedCharts);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist Pinned Charts
  useEffect(() => {
    localStorage.setItem(storageKeyPinnedCharts, JSON.stringify(pinnedCharts));
  }, [pinnedCharts, storageKeyPinnedCharts]);

  // Reset pagination when rows change length significantly (optional, but good UX)
  useEffect(() => {
    if (currentPage > 1 && rows.length < (currentPage - 1) * rowsPerPage) {
      setCurrentPage(1);
    }
  }, [rows.length, rowsPerPage, currentPage]);

  // Sync from props if they change (only if they are actually different to avoid focus loss)
  useEffect(() => {
    if (externalColumns && externalColumns.length > 0) {
      setColumns((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(externalColumns);
        return isSame ? prev : externalColumns;
      });
    }
  }, [externalColumns]);

  const { groupedByItem: remindersByItem, addReminder, updateReminder, deleteReminder } = useReminders(roomId);
  const activeReminderRow = useMemo(
    () => (activeReminderTarget ? rows.find((r) => r.id === activeReminderTarget.rowId) : null),
    [activeReminderTarget, rows],
  );
  const [priorityFilter, _setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [newTaskName, setNewTaskName] = useState('');

  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  // Drag & drop (consolidated hook)
  const {
    activeDragId,
    handleDragStart,
    handleDragEnd,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    activeColumnDragId,
    columnDragMousePos,
    handleStructureDragStart,
    handleStructureDragOver,
    handleStructureDragEnd,
  } = useDragDropHandlers({
    tableGroups,
    setTableGroups,
    columns,
    setColumns,
    onUpdateTasks,
    tableBodyRef,
  });

  // Excel import (consolidated hook)
  const { fileInputRef, handleImportClick, handleExcelImport, handleImport } = useExcelImport({
    columns,
    setColumns,
    rows,
    tableGroups,
    setTableGroups,
    onUpdateTasks,
    setSortRules,
    setSortConfig,
    setIsExcelImportModalOpen,
    showToast,
    t,
  });

  // Select All / Deselect All Handler
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const _primaryCol = columns.find((c) => c.id === 'name') || { id: 'name' };

      // We only want to select/deselect 'real' rows? The user requested "main checkbox activate it when user clicks all will be marked".
      // This implies selecting ALL items.
      // We need to iterate over all groups and their rows.

      // But tableGroups is state. We need to update ALL rows in ALL groups.
      // Wait, handleUpdateRow updates a single row. We should probably do a bulk update or just update local state if performance allows.
      // Actually, handleUpdateRow updates local state `tableGroups`.

      setTableGroups((prevGroups) => {
        return prevGroups.map((group) => ({
          ...group,
          rows: group.rows.map((row) => ({
            ...row,
            [columns.find((c) => c.id === 'select')?.id || 'select']: checked,
          })),
        }));
      });
    },
    [columns],
  );

  // Export Handler
  const handleExportTable = useCallback(() => {
    // Gather data
    // If anything is selected, export ONLY selected. Else export select all.
    // Check selection across all groups
    let allRows: Row[] = [];
    tableGroups.forEach((g) => {
      allRows = [...allRows, ...g.rows];
    });

    const selectedRows = allRows.filter((r) => !!r['select']);
    const rowsToExport = selectedRows.length > 0 ? selectedRows : allRows;

    if (rowsToExport.length === 0) {
      alert(t('no_data_to_export'));
      return;
    }

    // Format data for Excel
    const data = rowsToExport.map((r) => {
      const rowObj: any = {};
      columns.forEach((c) => {
        if (c.id === 'select') return; // Skip select column
        let val = r[c.id];
        // Format values if needed
        if (c.type === 'people' && val) val = (val as any).name;
        if (c.type === 'files' && val) val = (val as any).title || 'File';
        // Doc, Date, etc are strings or simple enough
        rowObj[c.label] = val;
      });
      return rowObj;
    });

    // Generate Sheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Board Export');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Table_Export_${dateStr}.xlsx`);
    XLSX.writeFile(wb, `Table_Export_${dateStr}.xlsx`);
  }, [tableGroups, columns]);

  // Clear Table Handler
  const handleClearTable = useCallback(() => {
    // Clear all rows from all groups
    setTableGroups((prev) => prev.map((g) => ({ ...g, rows: [] })));

    // Clear creation rows buffer
    resetCreationRows();

    // Persist immediately
    // Note: The persistence effect will trigger automatically due to state change

    showToast(t('table_cleared_successfully'), 'success');
    setIsClearDataModalOpen(false);

    if (onUpdateTasks) {
      onUpdateTasks([]);
    }
  }, [onUpdateTasks, showToast]);

  // creationRowInputRef is already defined at line 854

  // Persistence Effects
  useEffect(() => {
    if (!externalColumns) {
      localStorage.setItem(storageKeyColumns, JSON.stringify(columns));
    }
  }, [columns, storageKeyColumns, externalColumns]);

  // Data processing (filtering, sorting, pagination — consolidated hook)
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filteredRows,
    sortedRows,
    visibleColumns,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filteredTableGroups,
    paginatedRows,
    paginatedGroups,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalPages,
    isAllRows,
    priorityStats,
  } = useTableDataProcessing({
    rows,
    columns,
    tableGroups,
    searchQuery,
    personFilter,
    filters,
    priorityFilter,
    activeKpiFilter,
    sortRules,
    sortConfig,
    rowsPerPage,
    currentPage,
    hiddenColumns,
    hideGroupHeader,
    activeCell,
    setActiveCell,
    setIsPersonFilterOpen,
    setIsFilterPanelOpen,
    setIsSortPanelOpen,
    setIsHideColumnsOpen,
  });

  // Row operations (consolidated hook)
  const {
    creationRows,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleUpdateCreationRow,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleCommitCreationRow,
    CREATION_ROW_ID,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleAddTask,
    handleUpdateRow,
    handleTextChange,
    handleDeleteRow,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleDeleteRowFromGroup,
    handleTextColorChange,
    toggleCell,
    navigateToNextCell,
    resetCreationRows,
  } = useRowOperations({
    columns,
    rows,
    setRows,
    tableGroups,
    setTableGroups,
    onUpdateTasks,
    onDeleteTask,
    externalTasks,
    setSortRules,
    setSortConfig,
    activeCell,
    setActiveCell,
    visibleColumns,
    tableBodyRef,
    creationRowInputRefs,
    newTaskName,
    setNewTaskName,
    t,
  });

  const handleAddPinnedChart = (config: ChartBuilderConfig) => {
    setPinnedCharts((prev) => [...prev, config]);
    // Ideally show a toast here
  };

  const handleDeletePinnedChart = (index: number) => {
    setPinnedCharts((prev) => prev.filter((_, i) => i !== index));
  };

  const _handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Handlers ---
  const _handleCellAction = (action: string, rowId: string, colId: string, _value?: any) => {
    if (action === 'navigate') {
      // Navigate to Vault
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const fileData = row[colId];

      const targetFolderId = fileData?.folderId || 'root';
      const targetHighlightId = fileData?.id;

      const params = new URLSearchParams();
      if (targetFolderId) params.set('folder', targetFolderId);
      if (targetHighlightId) params.set('highlight', targetHighlightId);

      const url = `/vault?${params.toString()}`;

      if (onNavigate) {
        window.history.pushState({}, '', url);
        onNavigate('vault');
      } else {
        window.location.href = url;
      }
    } else if (action === 'upload') {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      setActiveUploadCell({ rowId, colId });
      setActiveUploadFile(null); // Reset
      setIsUploadModalOpen(true);
    }
  };

  const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActiveUploadFile(e.target.files[0]);
      setIsUploadModalOpen(true);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleSaveVaultSuccess = (item: VaultItem) => {
    if (activeUploadCell) {
      // Store only essential reference properties, not the full base64 content
      // This prevents localStorage quota exceeded errors
      const fileReference = {
        id: item.id,
        title: item.title,
        type: item.type,
        folderId: item.folderId,
        metadata: item.metadata,
        // Don't store previewUrl or content - they're too large for localStorage
      };

      // Find current files in the cell and append the new file
      const currentRow = rows.find((r) => r.id === activeUploadCell.rowId);
      const currentValue = currentRow?.[activeUploadCell.colId];
      const existingFiles = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      const updatedFiles = [...existingFiles, fileReference];

      handleUpdateRow(activeUploadCell.rowId, { [activeUploadCell.colId]: updatedFiles });
    }
    setIsUploadModalOpen(false);
    setActiveUploadCell(null);
    setActiveUploadFile(null);
  };

  // Column operations (consolidated hook)
  const {
    addColumn: handleAddColumn,
    deleteColumn: handleDeleteColumn,
    renameColumn: handleRenameColumn,
    toggleColumnFreeze: handleToggleColumnFreeze,
    updateColumn: handleUpdateColumn,
    addColumnOption: handleAddColumnOption,
    editColumnOption: handleEditColumnOption,
    deleteColumnOption: handleDeleteColumnOption,
    handleSort,
    startResize,
  } = useColumnOperations({
    columns,
    setColumns,
    setRows,
    isRTL,
    sortRules,
    setSortRules,
    tableBodyRef,
    activeCell,
    handleUpdateRow,
    creationRowId: CREATION_ROW_ID,
  });

  const renderCellContent = (col: Column, row: Row, inputRef?: React.Ref<HTMLInputElement>) => {
    // Calculate row index for auto-numbering (find position in full rows array)
    const rowIndex = rows.findIndex((r) => r.id === row.id);

    return (
      <TableCell
        col={col}
        row={row}
        columns={columns}
        activeCell={activeCell}
        customStatuses={customStatuses}
        boardId={roomId}
        allRows={rows}
        rowIndex={rowIndex >= 0 ? rowIndex : 0}
        onUpdateRow={handleUpdateRow}
        onUpdateColumn={handleUpdateColumn}
        onTextChange={handleTextChange}
        onToggleCell={toggleCell}
        onSetActiveCell={setActiveCell}
        onNavigateToNextCell={navigateToNextCell}
        onAddCustomStatus={handleAddCustomStatus}
        onDeleteCustomStatus={handleDeleteCustomStatus}
        onAddColumnOption={handleAddColumnOption}
        onEditColumnOption={handleEditColumnOption}
        onDeleteColumnOption={handleDeleteColumnOption}
        onSetActiveColorMenu={setActiveColorMenu}
        onSetActiveTextMenu={setActiveTextMenu}
        onFileUploadRequest={(rowId, colId) => {
          setActiveUploadCell({ rowId, colId });
          hiddenFileInputRef.current?.click();
        }}
        onNavigate={onNavigate}
        inputRef={inputRef}
        onOpenDetail={(r) => setActiveRowDetail(r)}
      />
    );
  };

  // --- Selection State ---
  // Derived from the actual row data (single source of truth)
  const checkedRows = useMemo(() => {
    return new Set(rows.filter((r) => !!r['select']).map((r) => r.id));
  }, [rows]);

  const toggleRowSelection = (rowId: string) => {
    // Find current value
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      handleUpdateRow(rowId, { select: !row['select'] });
    }
  };

  const renderRowContent = (row: Row, dragListeners?: any, isOverlay = false) => {
    return (
      <TableRowContent
        row={row}
        dragListeners={dragListeners}
        isOverlay={isOverlay}
        visibleColumns={visibleColumns}
        checkedRows={checkedRows}
        columns={columns}
        onToggleRowSelection={toggleRowSelection}
        onDeleteRow={handleDeleteRow}
        onSelectColumnContextMenu={(rect) => setActiveColorMenu({ rect })}
        renderCellContent={renderCellContent}
        isRTL={isRTL}
        activeColumnDragId={activeColumnDragId}
      />
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans">
      {/* Header Actions - Optional if needed, currently empty/handled by parent view */}

      {/* Scrollable Container */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Secondary Toolbar */}
        <RoomTableToolbar
          t={t}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          isPersonFilterOpen={isPersonFilterOpen}
          setIsPersonFilterOpen={setIsPersonFilterOpen}
          personFilter={personFilter}
          setPersonFilter={setPersonFilter}
          isFilterPanelOpen={isFilterPanelOpen}
          setIsFilterPanelOpen={setIsFilterPanelOpen}
          filters={filters}
          setFilters={setFilters}
          isSortPanelOpen={isSortPanelOpen}
          setIsSortPanelOpen={setIsSortPanelOpen}
          sortRules={sortRules}
          setSortRules={setSortRules}
          isHideColumnsOpen={isHideColumnsOpen}
          setIsHideColumnsOpen={setIsHideColumnsOpen}
          hiddenColumns={hiddenColumns}
          setHiddenColumns={setHiddenColumns}
          columnSearchQuery={columnSearchQuery}
          setColumnSearchQuery={setColumnSearchQuery}
          setIsClearDataModalOpen={setIsClearDataModalOpen}
          columns={columns}
          rows={rows}
          checkedRows={checkedRows}
          filteredTableGroups={filteredTableGroups}
          handleExportTable={handleExportTable}
          handleImportClick={handleImportClick}
          handleImport={handleImport}
          fileInputRef={fileInputRef}
          setDeleteConfig={setDeleteConfig}
          onDeleteTask={onDeleteTask}
          onUpdateTasks={onUpdateTasks}
          setRows={setRows}
          setColumns={setColumns}
          setIsChartModalOpen={setIsChartModalOpen}
          setIsAIReportModalOpen={setIsAIReportModalOpen}
          renderCustomActions={renderCustomActions}
        />

        {/* Table Scrollable Area */}
        <RoomTableBody
          tableBodyRef={tableBodyRef}
          dir={dir}
          isRTL={isRTL}
          t={t}
          pinnedCharts={pinnedCharts}
          handleDeletePinnedChart={handleDeletePinnedChart}
          sensors={sensors}
          handleStructureDragStart={handleStructureDragStart}
          handleStructureDragOver={handleStructureDragOver}
          handleStructureDragEnd={handleStructureDragEnd}
          activeColumnDragId={activeColumnDragId}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          activeDragId={activeDragId}
          columns={columns}
          rows={rows}
          visibleColumns={visibleColumns}
          paginatedGroups={paginatedGroups}
          hideGroupHeader={hideGroupHeader}
          sortRules={sortRules}
          handleToggleGroupCollapse={handleToggleGroupCollapse}
          handleToggleGroupPin={handleToggleGroupPin}
          handleUpdateGroupName={handleUpdateGroupName}
          handleDeleteGroup={handleDeleteGroup}
          setDeleteConfig={setDeleteConfig}
          renamingColId={renamingColId}
          setRenamingColId={setRenamingColId}
          handleRenameColumn={handleRenameColumn}
          handleSort={handleSort}
          handleDeleteColumn={handleDeleteColumn}
          handleSelectAll={handleSelectAll}
          setActiveHeaderMenu={setActiveHeaderMenu}
          startResize={startResize}
          activeColumnMenu={activeColumnMenu}
          setActiveColumnMenu={setActiveColumnMenu}
          handleAddColumn={handleAddColumn}
          CREATION_ROW_ID={CREATION_ROW_ID}
          creationRows={creationRows}
          creationRowInputRefs={creationRowInputRefs}
          renderCellContent={renderCellContent}
          renderRowContent={renderRowContent}
          checkedRows={checkedRows}
        />

        {showPagination && (
          <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-monday-dark-surface">
            <TablePagination
              totalItems={rows.length}
              pageSize={rowsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                startTransition(() => {
                  setRowsPerPage(size);
                  setCurrentPageRaw(1);
                });
              }}
              isLoading={isPending}
            />
          </div>
        )}

        {activeReminderTarget && (
          <PortalPopup
            triggerRef={{ current: { getBoundingClientRect: () => activeReminderTarget.rect } } as any}
            onClose={() => setActiveReminderTarget(null)}
            side="bottom"
          >
            <ReminderPanel
              itemId={activeReminderTarget.rowId}
              itemTitle={activeReminderRow?.name}
              reminders={remindersByItem[activeReminderTarget.rowId] || []}
              onAdd={(remindAt, kind, label) =>
                addReminder({
                  itemId: activeReminderTarget.rowId,
                  boardId: roomId,
                  itemTitle: activeReminderRow?.name,
                  remindAt,
                  kind,
                  relativeLabel: label,
                })
              }
              onDelete={deleteReminder}
              onUpdateStatus={(id, status) => updateReminder(id, { status })}
            />
          </PortalPopup>
        )}

        <RoomTableModals
          isChartModalOpen={isChartModalOpen}
          setIsChartModalOpen={setIsChartModalOpen}
          isAIReportModalOpen={isAIReportModalOpen}
          setIsAIReportModalOpen={setIsAIReportModalOpen}
          handleAddPinnedChart={handleAddPinnedChart}
          isExcelImportModalOpen={isExcelImportModalOpen}
          setIsExcelImportModalOpen={setIsExcelImportModalOpen}
          handleExcelImport={handleExcelImport}
          isUploadModalOpen={isUploadModalOpen}
          setIsUploadModalOpen={setIsUploadModalOpen}
          activeUploadFile={activeUploadFile}
          handleSaveVaultSuccess={handleSaveVaultSuccess}
          deleteConfig={deleteConfig}
          setDeleteConfig={setDeleteConfig}
          isClearDataModalOpen={isClearDataModalOpen}
          setIsClearDataModalOpen={setIsClearDataModalOpen}
          handleClearTable={handleClearTable}
          activeRowDetail={activeRowDetail}
          setActiveRowDetail={setActiveRowDetail}
          customStatuses={customStatuses}
          roomId={roomId}
          handleUpdateRow={handleUpdateRow}
          hiddenFileInputRef={hiddenFileInputRef}
          handleHiddenFileChange={handleHiddenFileChange}
          activeHeaderMenu={activeHeaderMenu}
          setActiveHeaderMenu={setActiveHeaderMenu}
          columns={columns}
          setColumns={setColumns}
          setSortRules={setSortRules}
          handleToggleColumnFreeze={handleToggleColumnFreeze}
          activeTextMenu={activeTextMenu}
          setActiveTextMenu={setActiveTextMenu}
          handleTextColorChange={handleTextColorChange}
          rows={rows}
          activeColorMenu={activeColorMenu}
          setActiveColorMenu={setActiveColorMenu}
          tableGroups={tableGroups}
        />
      </div>
    </div>
  );
};

export default memo(RoomTable);
