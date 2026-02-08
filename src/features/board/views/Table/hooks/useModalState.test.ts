import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from './useModalState';

describe('useModalState', () => {
  it('initial state: all modals closed, all active states null', () => {
    const { result } = renderHook(() => useModalState());

    // Modals
    expect(result.current.isChartModalOpen).toBe(false);
    expect(result.current.isAIReportModalOpen).toBe(false);
    expect(result.current.isExcelImportModalOpen).toBe(false);
    expect(result.current.isUploadModalOpen).toBe(false);

    // Context menus
    expect(result.current.activeCell).toBeNull();
    expect(result.current.activeTextMenu).toBeNull();
    expect(result.current.activeHeaderMenu).toBeNull();
    expect(result.current.activeColorMenu).toBeNull();
    expect(result.current.activeColumnMenu).toBeNull();
    expect(result.current.renamingColId).toBeNull();

    // Panels
    expect(result.current.activeRowDetail).toBeNull();
    expect(result.current.activeKpiFilter).toBeNull();
    expect(result.current.deleteConfig).toBeNull();

    // Upload
    expect(result.current.activeUploadCell).toBeNull();
    expect(result.current.activeUploadFile).toBeNull();

    // Reminder
    expect(result.current.activeReminderTarget).toBeNull();
  });

  it('toggles chart modal open and close', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.setIsChartModalOpen(true);
    });
    expect(result.current.isChartModalOpen).toBe(true);

    act(() => {
      result.current.setIsChartModalOpen(false);
    });
    expect(result.current.isChartModalOpen).toBe(false);
  });

  it('toggles AI report modal open and close', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.setIsAIReportModalOpen(true);
    });
    expect(result.current.isAIReportModalOpen).toBe(true);

    act(() => {
      result.current.setIsAIReportModalOpen(false);
    });
    expect(result.current.isAIReportModalOpen).toBe(false);
  });

  it('sets active cell and clears it', () => {
    const { result } = renderHook(() => useModalState());
    const cellData = { rowId: 'row-1', colId: 'col-1' };

    act(() => {
      result.current.setActiveCell(cellData);
    });
    expect(result.current.activeCell).toEqual(cellData);

    act(() => {
      result.current.setActiveCell(null);
    });
    expect(result.current.activeCell).toBeNull();
  });

  it('sets active text menu and clears it', () => {
    const { result } = renderHook(() => useModalState());
    const menuData = { rowId: 'row-1', colId: 'col-1', position: { x: 100, y: 200 } };

    act(() => {
      result.current.setActiveTextMenu(menuData);
    });
    expect(result.current.activeTextMenu).toEqual(menuData);

    act(() => {
      result.current.setActiveTextMenu(null);
    });
    expect(result.current.activeTextMenu).toBeNull();
  });

  it('closeAllMenus clears all context menus at once', () => {
    const { result } = renderHook(() => useModalState());

    // Open several menus
    act(() => {
      result.current.setActiveCell({ rowId: 'r1', colId: 'c1' });
      result.current.setActiveTextMenu({ rowId: 'r1', colId: 'c1', position: { x: 0, y: 0 } });
      result.current.setActiveHeaderMenu({ colId: 'c1', position: { x: 0, y: 0 } });
      result.current.setActiveColorMenu({ rect: new DOMRect(0, 0, 100, 100), colId: 'c1' });
      result.current.setActiveColumnMenu({ rect: new DOMRect(0, 0, 50, 50) });
    });

    // Verify they are set
    expect(result.current.activeCell).not.toBeNull();
    expect(result.current.activeTextMenu).not.toBeNull();
    expect(result.current.activeHeaderMenu).not.toBeNull();
    expect(result.current.activeColorMenu).not.toBeNull();
    expect(result.current.activeColumnMenu).not.toBeNull();

    // Close all menus
    act(() => {
      result.current.closeAllMenus();
    });

    expect(result.current.activeCell).toBeNull();
    expect(result.current.activeTextMenu).toBeNull();
    expect(result.current.activeHeaderMenu).toBeNull();
    expect(result.current.activeColorMenu).toBeNull();
    expect(result.current.activeColumnMenu).toBeNull();
  });

  it('sets delete config and clears it', () => {
    const { result } = renderHook(() => useModalState());
    const config = {
      isOpen: true,
      title: 'Delete row?',
      description: 'This action cannot be undone',
      onConfirm: () => {},
    };

    act(() => {
      result.current.setDeleteConfig(config);
    });
    expect(result.current.deleteConfig).toEqual(config);

    act(() => {
      result.current.setDeleteConfig(null);
    });
    expect(result.current.deleteConfig).toBeNull();
  });

  it('sets active upload cell and file', () => {
    const { result } = renderHook(() => useModalState());
    const uploadCell = { rowId: 'row-1', colId: 'files-col' };
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.setActiveUploadCell(uploadCell);
      result.current.setActiveUploadFile(file);
    });

    expect(result.current.activeUploadCell).toEqual(uploadCell);
    expect(result.current.activeUploadFile).toBeInstanceOf(File);
    expect(result.current.activeUploadFile?.name).toBe('test.pdf');
  });
});
