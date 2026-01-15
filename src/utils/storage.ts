/**
 * Type-safe localStorage utility with error handling
 * Centralizes all localStorage operations for better maintainability
 */

export type StorageKey =
  | 'app-active-view'
  | 'app-workspaces'
  | 'app-boards'
  | 'app-active-workspace'
  | 'app-active-board'
  | 'app-sidebar-width'
  | 'app-sidebar-collapsed'
  | 'app-page-visibility'
  | 'app-recently-visited'
  | 'app-unsynced-boards'
  | 'app-deleted-boards'
  | 'app-theme'
  | `room-table-columns-v4-${string}`
  | `room-items-v3-${string}`
  | `board-tasks-${string}`
  | `board-statuses-${string}`;

/**
 * Safely get an item from localStorage with JSON parsing
 */
export function getStorageItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[Storage] Failed to parse "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely get a string item from localStorage (no JSON parsing)
 */
export function getStorageString(key: StorageKey, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.warn(`[Storage] Failed to get "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage with JSON stringification
 */
export function setStorageItem<T>(key: StorageKey, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to set "${key}":`, error);
    return false;
  }
}

/**
 * Safely set a string item in localStorage (no JSON stringification)
 */
export function setStorageString(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to set "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function removeStorageItem(key: StorageKey): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}":`, error);
    return false;
  }
}

/**
 * Clear all app-related storage (useful for logout/reset)
 */
export function clearAppStorage(): void {
  const appKeys = [
    'app-active-view',
    'app-workspaces',
    'app-boards',
    'app-active-workspace',
    'app-active-board',
    'app-sidebar-width',
    'app-sidebar-collapsed',
    'app-page-visibility',
    'app-recently-visited',
    'app-unsynced-boards',
    'app-deleted-boards',
  ];

  appKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Failed to clear "${key}":`, error);
    }
  });
}

/**
 * Get storage item with a dynamic key suffix (for board-specific data)
 */
export function getDynamicStorageItem<T>(
  prefix: string,
  suffix: string,
  defaultValue: T
): T {
  const key = `${prefix}${suffix}` as StorageKey;
  return getStorageItem(key, defaultValue);
}

/**
 * Set storage item with a dynamic key suffix (for board-specific data)
 */
export function setDynamicStorageItem<T>(
  prefix: string,
  suffix: string,
  value: T
): boolean {
  const key = `${prefix}${suffix}` as StorageKey;
  return setStorageItem(key, value);
}
