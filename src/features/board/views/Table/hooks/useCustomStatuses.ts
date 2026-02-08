/**
 * useCustomStatuses — Manages board custom status options
 *
 * Handles loading from localStorage, migration from old schema (string[]),
 * and CRUD operations with auto-persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { boardLogger } from '../../../../../utils/logger';
import { StatusOption } from '../types';

const STATUS_COLORS = ['gray', 'blue', 'emerald', 'orange', 'rose', 'purple', 'yellow', 'pink'];

export function useCustomStatuses(roomId: string, t: (key: string) => string) {
  const storageKey = `board-statuses-${roomId}`;

  const DEFAULT_STATUSES: StatusOption[] = [
    { id: 'To Do', title: t('to_do'), color: 'gray' },
    { id: 'In Progress', title: t('in_progress'), color: 'blue' },
    { id: 'Done', title: t('done'), color: 'emerald' },
    { id: 'Stuck', title: t('stuck'), color: 'orange' },
    { id: 'Rejected', title: t('rejected'), color: 'rose' },
  ];

  const [customStatuses, setCustomStatuses] = useState<StatusOption[]>([]);

  // Load from localStorage on mount (with migration from string[] schema)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            // Migrate from old string[] format
            const migrated = parsed.map((s: string) => {
              const lower = s.toLowerCase();
              let color = 'gray';
              if (lower.includes('done')) color = 'emerald';
              else if (lower.includes('progress')) color = 'blue';
              else if (lower.includes('stuck')) color = 'orange';
              else if (lower.includes('rejected')) color = 'rose';
              return { id: s, title: s, color };
            });
            setCustomStatuses(migrated);
          } else {
            setCustomStatuses(parsed);
          }
        } else {
          setCustomStatuses(DEFAULT_STATUSES);
        }
      } catch (e) {
        boardLogger.error('Failed to parse board statuses', e);
        setCustomStatuses(DEFAULT_STATUSES);
      }
    } else {
      setCustomStatuses(DEFAULT_STATUSES);
    }
  }, [storageKey]);

  const addStatus = useCallback(
    (newStatusTitle: string) => {
      setCustomStatuses((prev) => {
        if (prev.find((s) => s.title.toLowerCase() === newStatusTitle.toLowerCase())) return prev;
        const nextColor = STATUS_COLORS[prev.length % STATUS_COLORS.length];
        const newOption: StatusOption = { id: newStatusTitle, title: newStatusTitle, color: nextColor };
        const updated = [...prev, newOption];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const deleteStatus = useCallback(
    (statusId: string) => {
      setCustomStatuses((prev) => {
        const updated = prev.filter((s) => s.id !== statusId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  return {
    customStatuses,
    setCustomStatuses,
    addStatus,
    deleteStatus,
    storageKey,
  };
}
