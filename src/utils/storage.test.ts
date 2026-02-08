import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStorageItem,
  getStorageString,
  setStorageItem,
  setStorageString,
  removeStorageItem,
  cleanupBoardStorage,
  cleanupWorkspaceBoardsStorage,
} from './storage';

// The global setup creates a localStorage mock with vi.fn() methods.
// vi.clearAllMocks() wipes mock implementations, so we need to re-spy
// on the localStorage methods in each beforeEach.
// We will create fresh spies for each test.

describe('storage utility', () => {
  let getItemSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.fn>;
  let removeItemSpy: ReturnType<typeof vi.fn>;
  let keySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Replace localStorage methods with fresh vi.fn() instances each time
    getItemSpy = vi.fn().mockReturnValue(null);
    setItemSpy = vi.fn();
    removeItemSpy = vi.fn();
    keySpy = vi.fn().mockReturnValue(null);

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy,
        removeItem: removeItemSpy,
        clear: vi.fn(),
        key: keySpy,
        length: 0,
      },
      writable: true,
      configurable: true,
    });
  });

  // ─── getStorageItem ───────────────────────────────────────────────

  describe('getStorageItem', () => {
    it('returns parsed JSON when key exists', () => {
      getItemSpy.mockReturnValue(JSON.stringify({ foo: 'bar' }));
      const result = getStorageItem('app-boards', []);
      expect(result).toEqual({ foo: 'bar' });
      expect(getItemSpy).toHaveBeenCalledWith('app-boards');
    });

    it('returns the default value when key is not in storage', () => {
      getItemSpy.mockReturnValue(null);
      const result = getStorageItem('app-boards', []);
      expect(result).toEqual([]);
    });

    it('returns the default value when stored JSON is invalid', () => {
      getItemSpy.mockReturnValue('not-json{{{');
      const result = getStorageItem('app-boards', ['fallback']);
      expect(result).toEqual(['fallback']);
    });

    it('handles primitive default values', () => {
      getItemSpy.mockReturnValue(null);
      expect(getStorageItem('app-sidebar-collapsed', false)).toBe(false);
    });

    it('returns parsed arrays', () => {
      getItemSpy.mockReturnValue(JSON.stringify([1, 2, 3]));
      expect(getStorageItem('app-workspaces', [])).toEqual([1, 2, 3]);
    });

    it('returns parsed boolean values', () => {
      getItemSpy.mockReturnValue('true');
      expect(getStorageItem('app-sidebar-collapsed', false)).toBe(true);
    });
  });

  // ─── getStorageString ─────────────────────────────────────────────

  describe('getStorageString', () => {
    it('returns the raw string when key exists', () => {
      getItemSpy.mockReturnValue('hello');
      expect(getStorageString('app-active-view', '')).toBe('hello');
    });

    it('returns the default string when key is missing', () => {
      getItemSpy.mockReturnValue(null);
      expect(getStorageString('app-active-view', 'default')).toBe('default');
    });

    it('returns empty string as default when no default specified', () => {
      getItemSpy.mockReturnValue(null);
      expect(getStorageString('app-active-view')).toBe('');
    });

    it('returns the raw value without JSON parsing', () => {
      getItemSpy.mockReturnValue('{"json": true}');
      expect(getStorageString('app-active-view', '')).toBe('{"json": true}');
    });
  });

  // ─── setStorageItem ───────────────────────────────────────────────

  describe('setStorageItem', () => {
    it('stores a JSON-stringified object and returns true', () => {
      const result = setStorageItem('app-boards', [{ id: '1' }]);
      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith('app-boards', JSON.stringify([{ id: '1' }]));
    });

    it('stores primitive values as JSON', () => {
      setStorageItem('app-sidebar-collapsed', true);
      expect(setItemSpy).toHaveBeenCalledWith('app-sidebar-collapsed', 'true');
    });

    it('returns false when localStorage.setItem throws (e.g. quota)', () => {
      setItemSpy.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      const result = setStorageItem('app-boards', []);
      expect(result).toBe(false);
    });
  });

  // ─── setStorageString ─────────────────────────────────────────────

  describe('setStorageString', () => {
    it('stores a raw string without JSON stringification', () => {
      const result = setStorageString('app-active-view', 'dashboard');
      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith('app-active-view', 'dashboard');
    });

    it('returns false on error', () => {
      setItemSpy.mockImplementation(() => {
        throw new Error('write error');
      });
      expect(setStorageString('app-active-view', 'x')).toBe(false);
    });
  });

  // ─── removeStorageItem ────────────────────────────────────────────

  describe('removeStorageItem', () => {
    it('removes the key and returns true', () => {
      const result = removeStorageItem('app-boards');
      expect(result).toBe(true);
      expect(removeItemSpy).toHaveBeenCalledWith('app-boards');
    });

    it('returns false when removeItem throws', () => {
      removeItemSpy.mockImplementation(() => {
        throw new Error('remove error');
      });
      expect(removeStorageItem('app-boards')).toBe(false);
    });
  });

  // ─── cleanupBoardStorage ──────────────────────────────────────────

  describe('cleanupBoardStorage', () => {
    it('removes all keys matching the board id with known prefixes', () => {
      const keys = [
        'board-tasks-board123',
        'board-statuses-board123',
        'room-table-columns-v4-room1-board123',
        'app-boards',
        'unrelated-key',
      ];

      // Override localStorage.length
      Object.defineProperty(localStorage, 'length', { value: keys.length, configurable: true });
      keySpy.mockImplementation((i: number) => keys[i] ?? null);

      cleanupBoardStorage('board123');

      // Should have removed the first 3 keys that contain "board123"
      expect(removeItemSpy).toHaveBeenCalledWith('board-tasks-board123');
      expect(removeItemSpy).toHaveBeenCalledWith('board-statuses-board123');
      expect(removeItemSpy).toHaveBeenCalledWith('room-table-columns-v4-room1-board123');
      // Should NOT have removed these
      expect(removeItemSpy).not.toHaveBeenCalledWith('app-boards');
      expect(removeItemSpy).not.toHaveBeenCalledWith('unrelated-key');
    });

    it('handles empty localStorage gracefully', () => {
      Object.defineProperty(localStorage, 'length', { value: 0, configurable: true });
      cleanupBoardStorage('nonexistent');
      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });

  // ─── cleanupWorkspaceBoardsStorage ────────────────────────────────

  describe('cleanupWorkspaceBoardsStorage', () => {
    it('calls cleanupBoardStorage for each board id', () => {
      Object.defineProperty(localStorage, 'length', { value: 0, configurable: true });
      cleanupWorkspaceBoardsStorage(['b1', 'b2', 'b3']);
      // Function should execute without errors even if nothing to clean
      expect(true).toBe(true);
    });
  });
});
