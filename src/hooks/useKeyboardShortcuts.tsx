/**
 * Keyboard Shortcuts System
 * Global and contextual keyboard shortcuts for power users
 */

import React, { useEffect, useCallback, useRef, createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean; // Command key on Mac
    description: string;
    action: () => void;
    when?: () => boolean; // Conditional activation
    preventDefault?: boolean;
}

export interface ShortcutGroup {
    name: string;
    shortcuts: Shortcut[];
}

// Parse a shortcut string like "ctrl+shift+k" into parts
function parseShortcutString(shortcut: string): Omit<Shortcut, 'description' | 'action'> {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts[parts.length - 1];

    return {
        key,
        ctrl: parts.includes('ctrl') || parts.includes('control'),
        alt: parts.includes('alt') || parts.includes('option'),
        shift: parts.includes('shift'),
        meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    };
}

// Check if an event matches a shortcut
function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
    const key = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    // Handle special keys
    const keyMatches =
        key === shortcutKey ||
        (shortcutKey === 'escape' && key === 'escape') ||
        (shortcutKey === 'esc' && key === 'escape') ||
        (shortcutKey === 'enter' && key === 'enter') ||
        (shortcutKey === 'space' && key === ' ') ||
        (shortcutKey === 'backspace' && key === 'backspace') ||
        (shortcutKey === 'delete' && key === 'delete') ||
        (shortcutKey === 'tab' && key === 'tab');

    if (!keyMatches) return false;

    const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
    const altMatches = !!shortcut.alt === event.altKey;
    const shiftMatches = !!shortcut.shift === event.shiftKey;
    const metaMatches = !!shortcut.meta === event.metaKey;

    // For cross-platform, treat Ctrl on Windows/Linux as Cmd on Mac
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierMatches = isMac
        ? (shortcut.ctrl ? event.metaKey : !event.metaKey) && (shortcut.meta ? event.metaKey : true)
        : ctrlMatches && metaMatches;

    return modifierMatches && altMatches && shiftMatches;
}

// Check if we're in an input field
function isInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isEditable = (activeElement as HTMLElement).isContentEditable;

    return isInput || isEditable;
}

/**
 * Hook for using a single keyboard shortcut
 */
export function useKeyboardShortcut(
    shortcut: string | Omit<Shortcut, 'description' | 'action'>,
    action: () => void,
    options: {
        description?: string;
        when?: () => boolean;
        preventDefault?: boolean;
        allowInInput?: boolean;
        enabled?: boolean;
    } = {}
): void {
    const {
        when,
        preventDefault = true,
        allowInInput = false,
        enabled = true,
    } = options;

    const actionRef = useRef(action);
    actionRef.current = action;

    useEffect(() => {
        if (!enabled) return;

        const parsedShortcut =
            typeof shortcut === 'string' ? parseShortcutString(shortcut) : shortcut;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Skip if in input and not allowed
            if (!allowInInput && isInputFocused()) return;

            // Check condition
            if (when && !when()) return;

            const fullShortcut: Shortcut = {
                ...parsedShortcut,
                description: '',
                action: actionRef.current,
            };

            if (matchesShortcut(event, fullShortcut)) {
                if (preventDefault) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                actionRef.current();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, when, preventDefault, allowInInput, enabled]);
}

/**
 * Hook for multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(
    shortcuts: Array<{
        shortcut: string;
        action: () => void;
        description?: string;
        when?: () => boolean;
        allowInInput?: boolean;
    }>,
    enabled = true
): void {
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            for (const { shortcut, action, when, allowInInput } of shortcutsRef.current) {
                // Skip if in input and not allowed
                if (!allowInInput && isInputFocused()) continue;

                // Check condition
                if (when && !when()) continue;

                const parsedShortcut = parseShortcutString(shortcut);
                const fullShortcut: Shortcut = {
                    ...parsedShortcut,
                    description: '',
                    action,
                };

                if (matchesShortcut(event, fullShortcut)) {
                    event.preventDefault();
                    event.stopPropagation();
                    action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled]);
}

// Context for global shortcut registry
interface ShortcutsContextValue {
    shortcuts: Map<string, Shortcut>;
    register: (id: string, shortcut: Shortcut) => void;
    unregister: (id: string) => void;
    getAll: () => ShortcutGroup[];
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

/**
 * Provider for global shortcuts
 */
export function ShortcutsProvider({ children }: { children: ReactNode }) {
    const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map());

    const register = useCallback((id: string, shortcut: Shortcut) => {
        setShortcuts((prev) => {
            const next = new Map(prev);
            next.set(id, shortcut);
            return next;
        });
    }, []);

    const unregister = useCallback((id: string) => {
        setShortcuts((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const getAll = useCallback((): ShortcutGroup[] => {
        const groups: Map<string, Shortcut[]> = new Map();

        shortcuts.forEach((shortcut, id) => {
            const groupName = id.split('.')[0] || 'General';
            if (!groups.has(groupName)) {
                groups.set(groupName, []);
            }
            groups.get(groupName)!.push(shortcut);
        });

        return Array.from(groups.entries()).map(([name, shortcuts]) => ({
            name,
            shortcuts,
        }));
    }, [shortcuts]);

    // Global event listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Skip if in input
            if (isInputFocused()) return;

            for (const shortcut of shortcuts.values()) {
                if (shortcut.when && !shortcut.when()) continue;

                if (matchesShortcut(event, shortcut)) {
                    if (shortcut.preventDefault !== false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    shortcut.action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);

    return (
        <ShortcutsContext.Provider value={{ shortcuts, register, unregister, getAll }}>
            {children}
        </ShortcutsContext.Provider>
    );
}

/**
 * Hook to register a shortcut in the global registry
 */
export function useRegisterShortcut(
    id: string,
    shortcut: string,
    action: () => void,
    description: string,
    options: {
        when?: () => boolean;
        enabled?: boolean;
    } = {}
): void {
    const context = useContext(ShortcutsContext);
    const actionRef = useRef(action);
    actionRef.current = action;

    const { when, enabled = true } = options;

    useEffect(() => {
        if (!context || !enabled) return;

        const parsedShortcut = parseShortcutString(shortcut);
        const fullShortcut: Shortcut = {
            ...parsedShortcut,
            description,
            action: () => actionRef.current(),
            when,
        };

        context.register(id, fullShortcut);
        return () => context.unregister(id);
    }, [context, id, shortcut, description, when, enabled]);
}

/**
 * Hook to get all registered shortcuts
 */
export function useShortcuts(): ShortcutGroup[] {
    const context = useContext(ShortcutsContext);
    return context?.getAll() ?? [];
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return shortcut
        .split('+')
        .map((part) => {
            const p = part.toLowerCase();
            if (p === 'ctrl' || p === 'control') return isMac ? '⌃' : 'Ctrl';
            if (p === 'alt' || p === 'option') return isMac ? '⌥' : 'Alt';
            if (p === 'shift') return isMac ? '⇧' : 'Shift';
            if (p === 'meta' || p === 'cmd' || p === 'command') return isMac ? '⌘' : 'Win';
            if (p === 'enter') return '↵';
            if (p === 'escape' || p === 'esc') return 'Esc';
            if (p === 'backspace') return '⌫';
            if (p === 'delete') return 'Del';
            if (p === 'space') return '␣';
            if (p === 'tab') return '⇥';
            if (p === 'arrowup') return '↑';
            if (p === 'arrowdown') return '↓';
            if (p === 'arrowleft') return '←';
            if (p === 'arrowright') return '→';
            return part.toUpperCase();
        })
        .join(isMac ? '' : '+');
}

// Default shortcuts for common actions
export const DEFAULT_SHORTCUTS = {
    // Navigation
    goToInbox: 'ctrl+shift+i',
    goToDashboard: 'ctrl+shift+d',
    goToBoards: 'ctrl+shift+b',
    goToSettings: 'ctrl+,',

    // Actions
    newTask: 'ctrl+n',
    search: 'ctrl+k',
    save: 'ctrl+s',
    undo: 'ctrl+z',
    redo: 'ctrl+shift+z',

    // UI
    toggleSidebar: 'ctrl+\\',
    toggleDarkMode: 'ctrl+shift+l',
    closeModal: 'escape',
    help: 'ctrl+/',
} as const;

export default {
    useKeyboardShortcut,
    useKeyboardShortcuts,
    useRegisterShortcut,
    useShortcuts,
    ShortcutsProvider,
    formatShortcut,
    DEFAULT_SHORTCUTS,
};
