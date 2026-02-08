/**
 * useModalState — Consolidates all modal/panel open states
 *
 * Instead of 12+ individual useState booleans for modals,
 * this hook manages them as a single object.
 */

import { useState, useCallback } from 'react';
import { Row } from '../types';

interface DeleteConfig {
  isOpen: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
}

interface ActiveCell {
  rowId: string;
  colId: string;
  trigger?: HTMLElement;
  rect?: DOMRect;
}

interface ActiveTextMenu {
  rowId: string;
  colId: string;
  position: { x: number; y: number };
}

interface ActiveHeaderMenu {
  colId: string;
  position: { x: number; y: number };
}

interface ActiveColorMenu {
  rect: DOMRect;
  colId?: string;
  rowId?: string;
}

interface ActiveUploadCell {
  rowId: string;
  colId: string;
}

interface ActiveKpiFilter {
  type: 'status' | 'priority';
  value: string;
}

export function useModalState() {
  // Modals
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isAIReportModalOpen, setIsAIReportModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Context menus & pickers
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [activeTextMenu, setActiveTextMenu] = useState<ActiveTextMenu | null>(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<ActiveHeaderMenu | null>(null);
  const [activeColorMenu, setActiveColorMenu] = useState<ActiveColorMenu | null>(null);
  const [activeColumnMenu, setActiveColumnMenu] = useState<{ rect: DOMRect } | null>(null);
  const [renamingColId, setRenamingColId] = useState<string | null>(null);

  // Panels
  const [activeRowDetail, setActiveRowDetail] = useState<Row | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<ActiveKpiFilter | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<DeleteConfig | null>(null);

  // Upload state
  const [activeUploadCell, setActiveUploadCell] = useState<ActiveUploadCell | null>(null);
  const [activeUploadFile, setActiveUploadFile] = useState<File | null>(null);

  // Reminder
  const [activeReminderTarget, setActiveReminderTarget] = useState<{ rowId: string; rect: DOMRect } | null>(null);

  const closeAllMenus = useCallback(() => {
    setActiveCell(null);
    setActiveTextMenu(null);
    setActiveHeaderMenu(null);
    setActiveColorMenu(null);
    setActiveColumnMenu(null);
  }, []);

  return {
    // Modals
    isChartModalOpen,
    setIsChartModalOpen,
    isAIReportModalOpen,
    setIsAIReportModalOpen,
    isExcelImportModalOpen,
    setIsExcelImportModalOpen,
    isUploadModalOpen,
    setIsUploadModalOpen,

    // Context menus
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

    // Panels
    activeRowDetail,
    setActiveRowDetail,
    activeKpiFilter,
    setActiveKpiFilter,
    deleteConfig,
    setDeleteConfig,

    // Upload
    activeUploadCell,
    setActiveUploadCell,
    activeUploadFile,
    setActiveUploadFile,

    // Reminder
    activeReminderTarget,
    setActiveReminderTarget,

    // Bulk close
    closeAllMenus,
  };
}
