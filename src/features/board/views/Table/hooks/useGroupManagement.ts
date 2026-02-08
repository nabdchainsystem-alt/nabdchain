/**
 * useGroupManagement — Manages table groups (add, rename, collapse, pin, delete)
 *
 * Handles group CRUD, row addition to groups, localStorage persistence,
 * and syncing with parent callbacks.
 */

import { useState, useEffect, useCallback } from 'react';
import { boardLogger } from '../../../../../utils/logger';
import { Column, Row, TableGroup, GROUP_COLORS, getGroupColor } from '../types';

interface GroupManagementOptions {
  roomId: string;
  viewId: string;
  externalTasks?: Row[];
  tasksVersion?: string;
  columns: Column[];
  t: (key: string) => string;
  onAddGroup?: (id: string, title: string, color?: string) => void;
  onUpdateGroup?: (id: string, title: string) => void;
  onDeleteGroup?: (id: string) => void;
  defaultColumns?: Column[];
  setSortRules: (rules: never[]) => void;
  setSortConfig: (config: null) => void;
}

export function useGroupManagement(options: GroupManagementOptions) {
  const {
    roomId,
    viewId,
    externalTasks,
    tasksVersion,
    columns,
    t,
    onAddGroup,
    onUpdateGroup,
    onDeleteGroup,
    setSortRules,
    setSortConfig,
  } = options;

  const storageKeyGroups = `room-table-groups-v1-${roomId}-${viewId}`;

  // Initialize table groups from externalTasks or localStorage
  const [tableGroups, setTableGroups] = useState<TableGroup[]>(() => {
    const savedGroupsMap: Record<string, Partial<TableGroup>> = {};
    try {
      const savedGroups = localStorage.getItem(storageKeyGroups);
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed)) {
          parsed.forEach((g: TableGroup) => {
            savedGroupsMap[g.id] = {
              isCollapsed: g.isCollapsed,
              color: g.color,
              isPinned: g.isPinned,
              name: g.name,
              rows: g.rows,
            };
          });
        }
      }
    } catch (e) {
      boardLogger.warn('Failed to load saved groups from localStorage', e);
    }

    if (externalTasks && externalTasks.length > 0) {
      const savedRowsMap = new Map<string, Row>();
      Object.values(savedGroupsMap).forEach((saved: Partial<TableGroup>) => {
        if (saved.rows && Array.isArray(saved.rows)) {
          saved.rows.forEach((r: Row) => savedRowsMap.set(r.id, r));
        }
      });

      const tasksByGroup: Record<string, Row[]> = {};
      const uniqueGroupIds: string[] = [];

      externalTasks.forEach((task) => {
        const gid = task.groupId || 'default-group';
        if (!tasksByGroup[gid]) {
          tasksByGroup[gid] = [];
          uniqueGroupIds.push(gid);
        }
        const savedRow = savedRowsMap.get(task.id);
        if (savedRow) {
          tasksByGroup[gid].push({
            ...savedRow,
            ...task,
            ...Object.fromEntries(
              Object.entries(savedRow).filter(
                ([key]) => typeof savedRow[key as keyof Row] === 'object' && savedRow[key as keyof Row] !== null,
              ),
            ),
          });
        } else {
          tasksByGroup[gid].push(task);
        }
      });

      let orderedIds: string[] = [];
      try {
        const saved = localStorage.getItem(storageKeyGroups);
        if (saved) {
          orderedIds = JSON.parse(saved).map((g: TableGroup) => g.id);
        }
      } catch (e) {
        boardLogger.warn('Failed to parse saved groups order from localStorage', e);
      }

      const allIds = Array.from(new Set([...orderedIds, ...uniqueGroupIds]));

      return allIds
        .filter((id) => tasksByGroup[id] && tasksByGroup[id].length > 0)
        .map((id, idx) => {
          const saved = savedGroupsMap[id] || {};
          return {
            id,
            name: saved.name || `Group ${idx + 1}`,
            rows: tasksByGroup[id] || [],
            isCollapsed: saved.isCollapsed || false,
            color: saved.color || getGroupColor(idx),
            isPinned: saved.isPinned || false,
          };
        });
    }

    // Standalone mode: load from localStorage
    if (!externalTasks) {
      try {
        const savedGroupsStr = localStorage.getItem(storageKeyGroups);
        if (savedGroupsStr) {
          const parsed = JSON.parse(savedGroupsStr);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        boardLogger.error('Failed to load generic table data', e);
      }

      return [
        {
          id: 'group-1',
          name: t('group_1'),
          rows: [],
          isCollapsed: false,
          color: GROUP_COLORS[0],
        },
      ];
    }

    // Controlled mode with empty tasks: use 'default-group' with saved view state
    let savedViewState: Partial<TableGroup> = {};
    try {
      const savedGroupsStr = localStorage.getItem(storageKeyGroups);
      if (savedGroupsStr) {
        const parsed = JSON.parse(savedGroupsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedViewState = parsed[0];
        }
      }
    } catch {
      // Ignore errors, use defaults
    }

    return [
      {
        id: 'default-group',
        name: savedViewState.name || 'Tasks',
        rows: [],
        isCollapsed: savedViewState.isCollapsed || false,
        color: savedViewState.color || GROUP_COLORS[0],
      },
    ];
  });

  // Sync externalTasks changes to tableGroups
  useEffect(() => {
    if (externalTasks === undefined) return;

    setTableGroups((prevGroups) => {
      const tasksByGroup: Record<string, Row[]> = {};
      externalTasks.forEach((task) => {
        const gid = task.groupId || 'default-group';
        if (!tasksByGroup[gid]) tasksByGroup[gid] = [];
        tasksByGroup[gid].push(task);
      });

      const updatedGroups = prevGroups.map((g) => ({
        ...g,
        rows: tasksByGroup[g.id] || [],
      }));

      const existingIds = new Set(prevGroups.map((g) => g.id));
      const newIds = Object.keys(tasksByGroup).filter((id) => !existingIds.has(id));

      if (newIds.length > 0) {
        const isPlaceholderGroup = updatedGroups[0].id === 'group-1' || updatedGroups[0].id === 'default-group';
        if (
          updatedGroups.length === 1 &&
          isPlaceholderGroup &&
          (!updatedGroups[0].rows || updatedGroups[0].rows.length === 0) &&
          newIds.length === 1
        ) {
          const gid = newIds[0];
          return [{ ...updatedGroups[0], id: gid, rows: tasksByGroup[gid] }];
        }

        const newGroups = newIds.map((gid, idx) => ({
          id: gid,
          name: 'New Group',
          rows: tasksByGroup[gid],
          isCollapsed: false,
          color: GROUP_COLORS[(updatedGroups.length + idx) % GROUP_COLORS.length],
        }));
        return [...updatedGroups, ...newGroups];
      }

      return updatedGroups;
    });
  }, [externalTasks, tasksVersion]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKeyGroups, JSON.stringify(tableGroups));
  }, [tableGroups, storageKeyGroups]);

  // --- Group operations ---

  const addGroup = useCallback(
    (param?: string | React.MouseEvent) => {
      const nameToUse = typeof param === 'string' ? param : t('new_group');
      setTableGroups((prev) => {
        const newGroupId = `group-${Date.now()}`;
        const colorIndex = prev.length % GROUP_COLORS.length;
        const newGroup: TableGroup = {
          id: newGroupId,
          name: nameToUse,
          rows: [],
          isCollapsed: false,
          color: GROUP_COLORS[colorIndex],
        };
        if (onAddGroup) onAddGroup(newGroupId, nameToUse, undefined);
        return [...prev, newGroup];
      });
    },
    [t, onAddGroup],
  );

  const updateGroupName = useCallback(
    (groupId: string, newName: string) => {
      setTableGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g)));
      if (onUpdateGroup) onUpdateGroup(groupId, newName);
    },
    [onUpdateGroup],
  );

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setTableGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g)));
  }, []);

  const toggleGroupPin = useCallback((groupId: string) => {
    setTableGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isPinned: !g.isPinned } : g)));
  }, []);

  const deleteGroup = useCallback(
    (groupId: string) => {
      setTableGroups((prev) => {
        if (prev.length <= 1) {
          alert(t('cannot_delete_last_group'));
          return prev;
        }
        return prev.filter((g) => g.id !== groupId);
      });
      if (onDeleteGroup) onDeleteGroup(groupId);
    },
    [t, onDeleteGroup],
  );

  const addRowToGroup = useCallback(
    (groupId: string, rowName?: string) => {
      const nameToAdd = rowName?.trim() || t('new_item');
      const primaryCol = columns.find((c) => c.id === 'name') ||
        columns.find((c) => c.id !== 'select') || { id: 'name' };

      const newRow: Row = {
        id: Date.now().toString(),
        groupId,
        [primaryCol.id]: nameToAdd,
        status: 'To Do',
        dueDate: null,
        date: new Date().toISOString(),
        priority: null,
      };

      columns.forEach((col) => {
        // eslint-disable-next-line no-prototype-builtins
        if (col.id !== 'select' && !newRow.hasOwnProperty(col.id)) {
          newRow[col.id] = null;
        }
      });

      setSortRules([]);
      setSortConfig(null);

      setTableGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, rows: [newRow, ...g.rows] } : g)));
    },
    [columns, t, setSortRules, setSortConfig],
  );

  return {
    tableGroups,
    setTableGroups,
    storageKeyGroups,
    addGroup,
    updateGroupName,
    toggleGroupCollapse,
    toggleGroupPin,
    deleteGroup,
    addRowToGroup,
  };
}
