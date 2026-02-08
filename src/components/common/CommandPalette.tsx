/**
 * Command Palette (⌘K)
 * Global search and quick actions
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MagnifyingGlass,
  X,
  ArrowRight,
  Command,
  House,
  Tray,
  Folders,
  Gear,
  Users,
  ChartLine,
  Package,
  Clock,
  Lightning,
} from 'phosphor-react';
import { useKeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';
import { createFocusTrap, announce } from '../../utils/accessibility';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  recentCommands?: string[];
  onCommandExecute?: (commandId: string) => void;
  placeholder?: string;
}

// Fuzzy search function
function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) {
    return { matches: true, score: queryLower.length / textLower.length + 0.5 };
  }

  // Fuzzy match
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 0.1;
    } else {
      consecutiveMatches = 0;
    }
  }

  return {
    matches: queryIndex === queryLower.length,
    score: queryIndex === queryLower.length ? score : 0,
  };
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  recentCommands = [],
  onCommandExecute,
  placeholder = 'Type a command or search...',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first, then all by category
      const recent = recentCommands.map((id) => commands.find((c) => c.id === id)).filter(Boolean) as CommandItem[];

      const others = commands.filter((c) => !recentCommands.includes(c.id));

      return [...recent, ...others];
    }

    // Search with fuzzy matching
    const results = commands
      .map((command) => {
        const titleMatch = fuzzyMatch(command.title, query);
        const descMatch = command.description ? fuzzyMatch(command.description, query) : { matches: false, score: 0 };
        const keywordMatch = command.keywords
          ? Math.max(...command.keywords.map((k) => fuzzyMatch(k, query).score))
          : 0;

        const score = Math.max(titleMatch.score * 2, descMatch.score, keywordMatch);

        return {
          command,
          matches: titleMatch.matches || descMatch.matches || keywordMatch > 0,
          score,
        };
      })
      .filter((r) => r.matches)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.command);

    return results;
  }, [commands, query, recentCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Map<string, CommandItem[]> = new Map();

    filteredCommands.forEach((command) => {
      const category = query.trim() ? 'Results' : command.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(command);
    });

    return groups;
  }, [filteredCommands, query]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => filteredCommands, [filteredCommands]);

  // Execute selected command
  const executeCommand = useCallback(
    (command: CommandItem) => {
      command.action();
      onCommandExecute?.(command.id);
      onClose();
      setQuery('');
      announce(`Executed: ${command.title}`);
    },
    [onClose, onCommandExecute],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < flatList.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatList.length - 1));
          break;
        case 'Enter':
          event.preventDefault();
          if (flatList[selectedIndex]) {
            executeCommand(flatList[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatList, selectedIndex, executeCommand, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (containerRef.current) {
        focusTrapRef.current = createFocusTrap(containerRef.current);
        focusTrapRef.current.activate();
      }
    } else {
      focusTrapRef.current?.deactivate();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatList[selectedIndex]) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, flatList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlass size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={flatList[selectedIndex] ? `command-${flatList[selectedIndex].id}` : undefined}
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} id="command-list" className="max-h-[60vh] overflow-y-auto py-2" role="listbox">
          {flatList.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No commands found</div>
          ) : (
            [...groupedCommands.entries()].map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((command) => {
                  const globalIndex = flatList.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      id={`command-${command.id}`}
                      data-index={globalIndex}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                        {command.icon || <ArrowRight size={18} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium truncate ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {command.title}
                        </div>
                        {command.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{command.description}</div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="flex-shrink-0 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
                          {formatShortcut(command.shortcut)}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command size={12} />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Default navigation commands
 */
export function createNavigationCommands(navigate: (path: string) => void): CommandItem[] {
  return [
    {
      id: 'nav.dashboard',
      title: 'Go to Dashboard',
      description: 'View your main dashboard',
      icon: <House size={18} />,
      shortcut: 'ctrl+shift+d',
      category: 'Navigation',
      keywords: ['home', 'main', 'overview'],
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav.inbox',
      title: 'Go to Inbox',
      description: 'View your inbox and messages',
      icon: <Tray size={18} />,
      shortcut: 'ctrl+shift+i',
      category: 'Navigation',
      keywords: ['email', 'messages', 'mail'],
      action: () => navigate('/inbox'),
    },
    {
      id: 'nav.boards',
      title: 'Go to Boards',
      description: 'View all your boards',
      icon: <Folders size={18} />,
      shortcut: 'ctrl+shift+b',
      category: 'Navigation',
      keywords: ['projects', 'tasks', 'kanban'],
      action: () => navigate('/boards'),
    },
    {
      id: 'nav.teams',
      title: 'Go to Teams',
      description: 'Manage your teams',
      icon: <Users size={18} />,
      category: 'Navigation',
      keywords: ['people', 'members', 'group'],
      action: () => navigate('/teams'),
    },
    {
      id: 'nav.settings',
      title: 'Go to Settings',
      description: 'Manage your preferences',
      icon: <Gear size={18} />,
      shortcut: 'ctrl+,',
      category: 'Navigation',
      keywords: ['preferences', 'config', 'account'],
      action: () => navigate('/settings'),
    },
    {
      id: 'nav.analytics',
      title: 'Go to Analytics',
      description: 'View reports and insights',
      icon: <ChartLine size={18} />,
      category: 'Navigation',
      keywords: ['reports', 'stats', 'metrics'],
      action: () => navigate('/analytics'),
    },
    {
      id: 'nav.supply-chain',
      title: 'Go to Supply Chain',
      description: 'Manage supply chain operations',
      icon: <Package size={18} />,
      category: 'Navigation',
      keywords: ['inventory', 'warehouse', 'shipping'],
      action: () => navigate('/supply-chain'),
    },
  ];
}

/**
 * Default action commands
 */
export function createActionCommands(actions: {
  createTask?: () => void;
  createBoard?: () => void;
  toggleDarkMode?: () => void;
  toggleSidebar?: () => void;
}): CommandItem[] {
  const commands: CommandItem[] = [];

  if (actions.createTask) {
    commands.push({
      id: 'action.new-task',
      title: 'Create New Task',
      description: 'Add a new task to the current board',
      icon: <Lightning size={18} />,
      shortcut: 'ctrl+n',
      category: 'Actions',
      keywords: ['add', 'new', 'task', 'todo'],
      action: actions.createTask,
    });
  }

  if (actions.createBoard) {
    commands.push({
      id: 'action.new-board',
      title: 'Create New Board',
      description: 'Create a new project board',
      icon: <Folders size={18} />,
      category: 'Actions',
      keywords: ['add', 'new', 'board', 'project'],
      action: actions.createBoard,
    });
  }

  if (actions.toggleDarkMode) {
    commands.push({
      id: 'action.toggle-dark',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      icon: <Clock size={18} />,
      shortcut: 'ctrl+shift+l',
      category: 'Actions',
      keywords: ['theme', 'light', 'dark', 'night'],
      action: actions.toggleDarkMode,
    });
  }

  if (actions.toggleSidebar) {
    commands.push({
      id: 'action.toggle-sidebar',
      title: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      shortcut: 'ctrl+\\',
      category: 'Actions',
      keywords: ['sidebar', 'menu', 'nav'],
      action: actions.toggleSidebar,
    });
  }

  return commands;
}

/**
 * Hook for command palette
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent-commands') || '[]');
    } catch {
      return [];
    }
  });

  // Open with Ctrl+K / Cmd+K
  useKeyboardShortcut('ctrl+k', () => setIsOpen(true));

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const onCommandExecute = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const filtered = prev.filter((id) => id !== commandId);
      const updated = [commandId, ...filtered].slice(0, 5);
      localStorage.setItem('recent-commands', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    recentCommands,
    onCommandExecute,
  };
}

export default CommandPalette;
