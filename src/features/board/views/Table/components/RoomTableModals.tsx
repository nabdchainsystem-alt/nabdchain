/**
 * RoomTableModals — All modal/overlay components used by RoomTable
 *
 * Extracted to reduce RoomTable.tsx line count.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ChartBuilderModal } from '../../../components/chart-builder/ChartBuilderModal';
import { AIReportModal } from '../../../components/AIReportModal';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ExcelImportModal } from '../../../components/ExcelImportModal';
import { SaveToVaultModal } from '../../../../dashboard/components/SaveToVaultModal';
import { TaskDetailPanel } from '../../../components/TaskDetailPanel';
import { ChartBuilderConfig } from '../../../components/chart-builder/types';
import { VaultItem } from '../../../../vault/types';
import { TextCellContextMenu, HeaderContextMenu } from './index';
import { CheckboxColorPicker } from './pickers';
import { Column, Row, TableGroup, SortRule } from '../types';
import { DEFAULT_CHECKBOX_COLOR } from '../utils';
import { boardLogger } from '../../../../../utils/logger';

interface RoomTableModalsProps {
  // Chart modals
  isChartModalOpen: boolean;
  setIsChartModalOpen: (open: boolean) => void;
  isAIReportModalOpen: boolean;
  setIsAIReportModalOpen: (open: boolean) => void;
  handleAddPinnedChart: (config: ChartBuilderConfig) => void;

  // Excel import modal
  isExcelImportModalOpen: boolean;
  setIsExcelImportModalOpen: (open: boolean) => void;
  handleExcelImport: (rows: Row[], columns?: Column[]) => void;

  // Upload modal
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  activeUploadFile: File | null;
  handleSaveVaultSuccess: (item: VaultItem) => void;

  // Delete confirmation
  deleteConfig: { isOpen: boolean; title: string; description: string; onConfirm: () => void } | null;
  setDeleteConfig: (config: any) => void;

  // Clear data modal
  isClearDataModalOpen: boolean;
  setIsClearDataModalOpen: (open: boolean) => void;
  handleClearTable: () => void;

  // Task detail panel
  activeRowDetail: Row | null;
  setActiveRowDetail: (row: Row | null) => void;
  customStatuses: any[];
  roomId: string;
  handleUpdateRow: (id: string, updates: Partial<Row>, groupId?: string) => void;

  // Hidden file input
  hiddenFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleHiddenFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Header context menu
  activeHeaderMenu: { colId: string; position: { x: number; y: number } } | null;
  setActiveHeaderMenu: (menu: any) => void;
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  handleToggleColumnFreeze: (colId: string) => void;

  // Text context menu
  activeTextMenu: { rowId: string; colId: string; position: { x: number; y: number } } | null;
  setActiveTextMenu: (menu: any) => void;
  handleTextColorChange: (rowId: string, colId: string, color: string) => void;
  rows: Row[];

  // Color picker
  activeColorMenu: { rowId?: string; colId?: string; rect: DOMRect } | null;
  setActiveColorMenu: (menu: any) => void;

  // Groups (for import modal)
  tableGroups: TableGroup[];
}

export const RoomTableModals: React.FC<RoomTableModalsProps> = ({
  isChartModalOpen,
  setIsChartModalOpen,
  isAIReportModalOpen,
  setIsAIReportModalOpen,
  handleAddPinnedChart,
  isExcelImportModalOpen,
  setIsExcelImportModalOpen,
  handleExcelImport,
  isUploadModalOpen,
  setIsUploadModalOpen,
  activeUploadFile,
  handleSaveVaultSuccess,
  deleteConfig,
  setDeleteConfig,
  isClearDataModalOpen,
  setIsClearDataModalOpen,
  handleClearTable,
  activeRowDetail,
  setActiveRowDetail,
  customStatuses,
  roomId,
  handleUpdateRow,
  hiddenFileInputRef,
  handleHiddenFileChange,
  activeHeaderMenu,
  setActiveHeaderMenu,
  columns,
  setColumns,
  setSortRules,
  handleToggleColumnFreeze,
  activeTextMenu,
  setActiveTextMenu,
  handleTextColorChange,
  rows,
  activeColorMenu,
  setActiveColorMenu,
  tableGroups,
}) => (
  <>
    <ChartBuilderModal
      isOpen={isChartModalOpen}
      onClose={() => setIsChartModalOpen(false)}
      columns={columns}
      rows={rows}
      onSave={(config) => {
        boardLogger.info('Chart Config Saved:', config);
        setIsChartModalOpen(false);
      }}
    />

    <AIReportModal
      isOpen={isAIReportModalOpen}
      onClose={() => setIsAIReportModalOpen(false)}
      columns={columns}
      rows={rows}
      onAddChart={handleAddPinnedChart}
    />

    <ExcelImportModal
      isOpen={isExcelImportModalOpen}
      onClose={() => setIsExcelImportModalOpen(false)}
      onImport={handleExcelImport}
      existingColumns={columns}
      groupId={tableGroups[0]?.id}
    />

    <SaveToVaultModal
      isOpen={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      file={activeUploadFile}
      onSuccess={handleSaveVaultSuccess}
    />

    {deleteConfig && (
      <DeleteConfirmationModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig(null)}
        onConfirm={deleteConfig.onConfirm}
        title={deleteConfig.title}
        description={deleteConfig.description}
      />
    )}

    <ConfirmModal
      isOpen={isClearDataModalOpen}
      onClose={() => setIsClearDataModalOpen(false)}
      onConfirm={handleClearTable}
      title="Clear all data?"
      description="This will permanently delete all rows from this table. This action cannot be undone."
      confirmText="Clear Data"
      type="danger"
    />

    <TaskDetailPanel
      isOpen={!!activeRowDetail}
      onClose={() => setActiveRowDetail(null)}
      row={activeRowDetail}
      columns={columns}
      customStatuses={customStatuses}
      boardId={roomId}
      onUpdateRow={handleUpdateRow}
    />

    <input type="file" ref={hiddenFileInputRef} className="hidden" onChange={handleHiddenFileChange} />

    {activeHeaderMenu && (
      <HeaderContextMenu
        onClose={() => setActiveHeaderMenu(null)}
        onHeaderColorSelect={(color) => {
          const newCols = columns.map((c) => (c.id === activeHeaderMenu.colId ? { ...c, headerColor: color } : c));
          setColumns(newCols);
          setActiveHeaderMenu(null);
        }}
        onColumnColorSelect={(color) => {
          const newCols = columns.map((c) =>
            c.id === activeHeaderMenu.colId ? { ...c, backgroundColor: color, headerColor: color } : c,
          );
          setColumns(newCols);
          setActiveHeaderMenu(null);
        }}
        currentHeaderColor={columns.find((c) => c.id === activeHeaderMenu.colId)?.headerColor}
        currentColumnColor={columns.find((c) => c.id === activeHeaderMenu.colId)?.backgroundColor}
        position={activeHeaderMenu.position}
        onSortAsc={() => {
          setSortRules([
            {
              id: 'sort-' + Date.now(),
              column: activeHeaderMenu.colId,
              direction: 'asc',
            },
          ]);
          setActiveHeaderMenu(null);
        }}
        onSortDesc={() => {
          setSortRules([
            {
              id: 'sort-' + Date.now(),
              column: activeHeaderMenu.colId,
              direction: 'desc',
            },
          ]);
          setActiveHeaderMenu(null);
        }}
        onFreezeToggle={() => {
          if (activeHeaderMenu.colId) {
            handleToggleColumnFreeze(activeHeaderMenu.colId);
          }
          setActiveHeaderMenu(null);
        }}
        isFrozen={!!columns.find((c) => c.id === activeHeaderMenu.colId)?.pinned}
        canFreeze={activeHeaderMenu.colId !== 'name' && activeHeaderMenu.colId !== 'select'}
      />
    )}

    {activeTextMenu && (
      <TextCellContextMenu
        onClose={() => setActiveTextMenu(null)}
        onColorSelect={(color) => handleTextColorChange(activeTextMenu.rowId, activeTextMenu.colId, color)}
        currentColor={rows.find((r) => r.id === activeTextMenu.rowId)?._styles?.[activeTextMenu.colId]?.color}
        position={activeTextMenu.position}
      />
    )}

    {activeColorMenu && (
      <CheckboxColorPicker
        onClose={() => setActiveColorMenu(null)}
        onSelect={(color) => {
          const colId = activeColorMenu.colId || 'select';
          if (activeColorMenu.rowId) {
            handleTextColorChange(activeColorMenu.rowId, colId, color);
          } else {
            const newCols = columns.map((c) => (c.id === colId ? { ...c, color } : c));
            setColumns(newCols);
          }
          setActiveColorMenu(null);
        }}
        current={
          activeColorMenu.rowId
            ? rows.find((r) => r.id === activeColorMenu.rowId)?._styles?.[activeColorMenu.colId || 'select']?.color ||
              DEFAULT_CHECKBOX_COLOR
            : columns.find((c) => c.id === (activeColorMenu.colId || 'select'))?.color || DEFAULT_CHECKBOX_COLOR
        }
        triggerRect={activeColorMenu.rect}
      />
    )}
  </>
);
