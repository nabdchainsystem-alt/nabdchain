import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  SquaresFour,
  MagnifyingGlass,
  Note,
  ListChecks,
  Check,
  PushPin,
  X,
  CaretRight,
  MagicWand,
} from 'phosphor-react';
import { Board, Task } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { useAppContext } from '../../contexts/AppContext';

interface NabdSmartBarProps {
  boards: Board[];
  onCreateTask: (boardId: string, task: Partial<Task>) => void;
  onNavigate?: (view: string, boardId?: string) => void;
}

type CommandType = 'task' | 'note' | 'search' | 'notes' | null;

interface SearchResult {
  id: string;
  type: 'task' | 'board' | 'note';
  title: string;
  subtitle?: string;
  boardId?: string;
  boardName?: string;
}

interface FlattenedBoard {
  board: Board;
  path: string; // e.g., "Parent > Child"
  depth: number;
}

const getCommands = (t: (key: string) => string) => [
  {
    id: 'task' as CommandType,
    label: t('new_task'),
    keyword: 'newtask',
    icon: ListChecks,
    hint: t('create_task_in_board'),
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    id: 'note' as CommandType,
    label: t('quick_note'),
    keyword: 'note',
    icon: Note,
    hint: t('save_a_quick_note'),
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    id: 'search' as CommandType,
    label: t('search'),
    keyword: 'search',
    icon: MagnifyingGlass,
    hint: t('search_tasks_boards'),
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  },
  {
    id: 'notes' as CommandType,
    label: t('view_notes'),
    keyword: 'notes',
    icon: Note,
    hint: t('see_saved_notes'),
    color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  },
];

const TAG_COLORS: Record<string, string> = {
  important: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  todo: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  idea: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  later: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
  urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
};

import { useQuickNotes } from '../../hooks/useQuickNotes';

export const NabdSmartBar: React.FC<NabdSmartBarProps> = ({ boards, onCreateTask, onNavigate }) => {
  const { t, language } = useAppContext();
  const COMMANDS = useMemo(() => getCommands(t), [t]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeCommand, setActiveCommand] = useState<CommandType>(null);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedBoardPath, setSelectedBoardPath] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const [notes, setNotes] = useState<QuickNote[]>(loadNotes);
  const { notes, addNote, togglePinNote, deleteNote } = useQuickNotes();
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);

  // Flatten boards including sub-boards with parent path
  const flattenedBoards = useMemo((): FlattenedBoard[] => {
    const result: FlattenedBoard[] = [];
    const boardMap = new Map<string, Board>(boards.map((b) => [b.id, b]));

    const getPath = (board: Board, depth: number = 0): string => {
      if (board.parentId && boardMap.has(board.parentId)) {
        const parent = boardMap.get(board.parentId)!;
        return `${getPath(parent, depth + 1)} › ${board.name}`;
      }
      return board.name;
    };

    const getDepth = (board: Board): number => {
      let depth = 0;
      let current = board;
      while (current.parentId && boardMap.has(current.parentId)) {
        depth++;
        current = boardMap.get(current.parentId)!;
      }
      return depth;
    };

    // Sort: parent boards first, then their children
    const sortedBoards = [...boards].sort((a, b) => {
      const depthA = getDepth(a);
      const depthB = getDepth(b);
      if (depthA !== depthB) return depthA - depthB;
      return a.name.localeCompare(b.name);
    });

    sortedBoards.forEach((board) => {
      result.push({
        board,
        path: getPath(board),
        depth: getDepth(board),
      });
    });

    return result;
  }, [boards]);

  // Extract tags from input
  const extractedTags = useMemo(() => {
    return (inputValue.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase());
  }, [inputValue]);

  const contentWithoutTags = useMemo(() => {
    return inputValue.replace(/#\w+/g, '').trim();
  }, [inputValue]);

  // Search results
  const searchResults = useMemo((): SearchResult[] => {
    if (activeCommand !== 'search' || !inputValue.trim()) return [];
    const query = inputValue.toLowerCase();
    const results: SearchResult[] = [];

    boards.forEach((board) => {
      if (board.name.toLowerCase().includes(query)) {
        results.push({
          id: board.id,
          type: 'board',
          title: board.name,
          subtitle: `${board.tasks?.length || 0} ${t('tasks')}`,
        });
      }
      (board.tasks || []).forEach((task) => {
        if (task.name?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)) {
          results.push({
            id: task.id,
            type: 'task',
            title: task.name,
            subtitle: task.status || t('no_status'),
            boardId: board.id,
            boardName: board.name,
          });
        }
      });
    });

    notes.forEach((note) => {
      if (note.content.toLowerCase().includes(query)) {
        results.push({
          id: note.id,
          type: 'note',
          title: note.content.slice(0, 50) + (note.content.length > 50 ? '...' : ''),
          subtitle: note.tags.map((tag) => `#${tag}`).join(' ') || t('no_tags'),
        });
      }
    });

    return results.slice(0, 10);
  }, [activeCommand, inputValue, boards, notes]);

  // Filter boards for picker (including sub-boards)
  const filteredBoards = useMemo(() => {
    if (!showBoardPicker) return [];
    // Normalize input by removing spaces (to match "@new task/" as "@newtask/")
    const normalizedInput = inputValue.toLowerCase().replace(/\s+/g, '');
    // Extract search query after the slash
    const slashMatch = normalizedInput.match(/@newtask\/(.*)$/i);
    const query = slashMatch ? slashMatch[1] : '';

    if (!query) return flattenedBoards.slice(0, 10);

    return flattenedBoards
      .filter((fb) => fb.board.name.toLowerCase().includes(query) || fb.path.toLowerCase().includes(query))
      .slice(0, 10);
  }, [showBoardPicker, inputValue, flattenedBoards]);

  // Recent notes
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [notes]);

  // Filter commands based on partial input
  const filteredCommands = useMemo(() => {
    if (!inputValue.startsWith('@') || activeCommand) return COMMANDS;
    const query = inputValue.slice(1).toLowerCase().replace(/\s+/g, ''); // Remove @ and spaces
    if (!query) return COMMANDS;
    return COMMANDS.filter(
      (cmd) => cmd.keyword.includes(query) || cmd.label.toLowerCase().replace(/\s+/g, '').includes(query),
    );
  }, [inputValue, activeCommand, COMMANDS]);

  // Determine current list
  const currentList = showCommandMenu
    ? filteredCommands
    : showBoardPicker
      ? filteredBoards
      : activeCommand === 'search'
        ? searchResults
        : activeCommand === 'notes'
          ? recentNotes
          : [];

  // Check if can submit
  const canSubmit = useMemo(() => {
    if (activeCommand === 'task') return contentWithoutTags.length > 0 && selectedBoard !== null;
    if (activeCommand === 'note') return contentWithoutTags.length > 0;
    return false;
  }, [activeCommand, contentWithoutTags, selectedBoard]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [inputValue, showCommandMenu, showBoardPicker]);
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);
  // useEffect(() => { saveNotes(notes); }, [notes]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPinned) return;

      // Check if click is outside container
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetState();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isPinned]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        resetState();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Detect @newtask/ pattern to show board picker
  useEffect(() => {
    const lowerInput = inputValue.toLowerCase().replace(/\s+/g, ''); // Normalize by removing spaces

    // Show command menu when @ is typed (with optional partial command)
    if (inputValue.startsWith('@') && !lowerInput.startsWith('@newtask/') && !activeCommand) {
      setShowCommandMenu(true);
      setShowBoardPicker(false);
    }
    // Show board picker when @newtask/ is typed (with or without spaces)
    else if (lowerInput.startsWith('@newtask/') && !activeCommand) {
      setShowCommandMenu(false);
      setShowBoardPicker(true);
    }
    // Hide menus otherwise
    else if (!activeCommand) {
      setShowCommandMenu(false);
      setShowBoardPicker(false);
    }
  }, [inputValue, activeCommand]);

  const resetState = () => {
    setInputValue('');
    setActiveCommand(null);
    setSelectedBoard(null);
    setSelectedBoardPath('');
    setShowCommandMenu(false);
    setShowBoardPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listLength = currentList.length;

    // Backspace removes chips when input is empty
    if (e.key === 'Backspace' && inputValue === '') {
      if (selectedBoard) {
        e.preventDefault();
        setSelectedBoard(null);
        setSelectedBoardPath('');
        return;
      }
      if (activeCommand) {
        e.preventDefault();
        setActiveCommand(null);
        return;
      }
    }

    // Navigate list
    if (listLength > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % listLength);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + listLength) % listLength);
        return;
      }
    }

    // Select from command menu
    if (e.key === 'Enter' && showCommandMenu && filteredCommands[selectedIndex]) {
      e.preventDefault();
      selectCommand(filteredCommands[selectedIndex]);
      return;
    }

    // Select board from picker (when typing @newtask/)
    if (e.key === 'Enter' && showBoardPicker && filteredBoards[selectedIndex]) {
      e.preventDefault();
      const fb = filteredBoards[selectedIndex];
      setActiveCommand('task');
      setSelectedBoard(fb.board);
      setSelectedBoardPath(fb.path);
      setShowBoardPicker(false);
      setInputValue('');
      inputRef.current?.focus();
      return;
    }

    // Search result click
    if (e.key === 'Enter' && activeCommand === 'search' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSearchResultClick(searchResults[selectedIndex]);
      return;
    }

    // View notes - navigate
    if (e.key === 'Enter' && activeCommand === 'notes') {
      e.preventDefault();
      if (onNavigate) {
        onNavigate('quick_notes');
      }
      return;
    }

    // Submit task or note
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit();
      return;
    }
  };

  const selectCommand = (command: (typeof COMMANDS)[0]) => {
    if (command.id === 'task') {
      // For task, show the slash hint but don't set activeCommand yet
      setInputValue('@newtask/');
      setShowCommandMenu(false);
      setShowBoardPicker(true);
    } else {
      setActiveCommand(command.id);
      setInputValue('');
      setShowCommandMenu(false);
    }
    inputRef.current?.focus();
  };

  const selectBoard = (fb: FlattenedBoard) => {
    setActiveCommand('task');
    setSelectedBoard(fb.board);
    setSelectedBoardPath(fb.path);
    setShowBoardPicker(false);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeCommand = () => {
    setActiveCommand(null);
    setSelectedBoard(null);
    setSelectedBoardPath('');
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeBoard = () => {
    setSelectedBoard(null);
    setSelectedBoardPath('');
    inputRef.current?.focus();
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (!onNavigate) return;
    if (result.type === 'board') onNavigate('board', result.id);
    else if (result.type === 'task' && result.boardId) onNavigate('board', result.boardId);
    else if (result.type === 'note') onNavigate('quick_notes');
  };

  const handleSubmit = () => {
    if (activeCommand === 'task' && selectedBoard && contentWithoutTags) {
      const newTask = {
        id: `task-${Date.now()}`,
        name: contentWithoutTags,
        status: 'To Do',
        groupId: 'To Do',
        createdAt: new Date().toISOString(),
      };
      onCreateTask(selectedBoard.id, newTask);
      setSuccessMessage(`${t('added_to')} ${selectedBoard.name}`);
      setTimeout(() => setSuccessMessage(null), 2000);
      setInputValue('');
      // Keep command and board for rapid entry
    }

    if (activeCommand === 'note' && contentWithoutTags) {
      addNote(contentWithoutTags, extractedTags);
      setSuccessMessage(t('note_saved'));
      setTimeout(() => setSuccessMessage(null), 2000);
      setInputValue('');
    }

    inputRef.current?.focus();
  };

  // const togglePinNote = (noteId: string) => setNotes(prev => prev.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  // const deleteNote = (noteId: string) => setNotes(prev => prev.filter(n => n.id !== noteId));

  const getCommandInfo = (cmd: CommandType) => COMMANDS.find((c) => c.id === cmd);

  const getPlaceholder = () => {
    if (showBoardPicker) return t('type_search_boards');
    if (activeCommand === 'task') return selectedBoard ? t('type_task_enter') : t('type_newtask_select_board');
    if (activeCommand === 'note') return t('type_note_tags');
    if (activeCommand === 'search') return t('search_everything');
    return t('type_at_commands');
  };

  return (
    <>
      {successMessage && (
        <div className="fixed bottom-24 right-8 rtl:right-auto rtl:left-8 z-[10000] animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-lg">
            <Check size={16} />
            {successMessage}
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group p-1.5 text-gray-500 dark:text-monday-dark-text-secondary hover:text-[#323338] dark:hover:text-monday-dark-text transition-colors rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover"
          aria-label={t('open_smart_bar')}
        >
          <MagicWand
            size={21}
            weight="light"
            className={`transition-all duration-300 ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[600px] rounded-2xl animate-in slide-in-from-bottom-4 duration-300 group shadow-2xl">
            {/* Main Content */}
            <div className="relative w-full bg-white/95 dark:bg-monday-dark-surface/95 backdrop-blur-xl rounded-2xl flex flex-col overflow-hidden ring-1 ring-gray-200/50 dark:ring-gray-700/50">
              {/* Dropdown Content Area */}
              {(showCommandMenu ||
                showBoardPicker ||
                activeCommand === 'notes' ||
                (activeCommand === 'search' && inputValue.trim())) && (
                <div className="py-2 max-h-[400px] overflow-y-auto border-b border-gray-100 dark:border-gray-800">
                  {/* Command Menu */}
                  {showCommandMenu && (
                    <div>
                      {filteredCommands.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">{t('no_commands_found')}</div>
                      ) : (
                        filteredCommands.map((cmd, index) => (
                          <button
                            key={cmd.id}
                            onClick={() => selectCommand(cmd)}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left rtl:text-right transition-colors ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cmd.color}`}>
                              <cmd.icon size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {cmd.label}
                                <span className="ml-1.5 rtl:ml-0 rtl:mr-1.5 text-gray-400 font-normal">
                                  @{cmd.keyword}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">{cmd.hint}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Board Picker */}
                  {showBoardPicker && (
                    <div>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                          {t('select_board')}
                        </span>
                      </div>
                      {filteredBoards.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">{t('no_boards_found')}</div>
                      ) : (
                        filteredBoards.map((fb, index) => (
                          <button
                            key={fb.board.id}
                            onClick={() => selectBoard(fb)}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left rtl:text-right transition-colors ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${index === selectedIndex ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                            >
                              <SquaresFour size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              {fb.depth > 0 ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <span className="text-gray-400 truncate">
                                    {fb.path.split(' › ').slice(0, -1).join(' › ')}
                                  </span>
                                  <CaretRight size={12} className="text-gray-300 shrink-0" />
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {fb.board.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                                  {fb.board.name}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {fb.board.tasks?.length || 0} {t('tasks')}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Notes List */}
                  {activeCommand === 'notes' && (
                    <div>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-gray-400 uppercase">{t('recent_notes')}</span>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('quick_notes')}
                            className="text-[10px] text-violet-600 hover:underline"
                          >
                            {t('view_all')}
                          </button>
                        )}
                      </div>
                      {recentNotes.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">{t('no_notes_yet')}</div>
                      ) : (
                        recentNotes.map((note, index) => (
                          <div
                            key={note.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 last:border-0 ${index === selectedIndex ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">{note.content}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-gray-400 font-datetime">
                                    {formatTimeAgo(note.createdAt, language)}
                                  </span>
                                  {note.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TAG_COLORS[tag] || TAG_COLORS.later}`}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => togglePinNote(note.id)}
                                  className={`p-1.5 rounded ${note.pinned ? 'text-amber-500' : 'text-gray-300 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                >
                                  <PushPin size={14} />
                                </button>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1.5 rounded text-gray-300 hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Search Results */}
                  {activeCommand === 'search' && inputValue.trim() && (
                    <div>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        <span className="text-[10px] font-medium text-gray-400">
                          {searchResults.length} {t('results')}
                        </span>
                      </div>
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">{t('no_matches_found')}</div>
                      ) : (
                        searchResults.map((result, index) => (
                          <button
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left rtl:text-right transition-colors ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                result.type === 'board'
                                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/20'
                                  : result.type === 'task'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'
                                    : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20'
                              }`}
                            >
                              {result.type === 'board' ? (
                                <SquaresFour size={16} />
                              ) : result.type === 'task' ? (
                                <ListChecks size={16} />
                              ) : (
                                <Note size={16} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {result.boardName ? `${t('in_board')} ${result.boardName}` : result.subtitle}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center h-14 px-4 gap-3">
                {/* Active Command Chip */}
                {activeCommand && !showBoardPicker && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getCommandInfo(activeCommand)?.color}`}
                  >
                    {React.createElement(getCommandInfo(activeCommand)?.icon || ListChecks, { size: 12 })}
                    <span>{getCommandInfo(activeCommand)?.label}</span>
                    <button onClick={removeCommand} className="ml-0.5 rtl:ml-0 rtl:mr-0.5 hover:opacity-70">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Selected Board Chip */}
                {selectedBoard && !showBoardPicker && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                    <SquaresFour size={12} />
                    <span className="max-w-[200px] truncate">{selectedBoardPath || selectedBoard.name}</span>
                    <button onClick={removeBoard} className="ml-0.5 rtl:ml-0 rtl:mr-0.5 hover:opacity-70">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Tags Preview */}
                {extractedTags.length > 0 && activeCommand === 'note' && (
                  <div className="flex items-center gap-1 shrink-0">
                    {extractedTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TAG_COLORS[tag] || TAG_COLORS.later}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  className="flex-1 h-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0"
                  autoFocus
                />

                {/* Submit Button */}
                {canSubmit && (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-full hover:opacity-80 transition-opacity shrink-0"
                  >
                    {activeCommand === 'note' ? t('save') : t('add')}
                    <ArrowRight size={12} />
                  </button>
                )}

                {/* Pin Button */}
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 ml-1 rounded-full transition-all duration-200 shrink-0 ${isPinned ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title={isPinned ? 'Unpin bar' : 'Pin bar'}
                >
                  <PushPin size={16} weight={isPinned ? 'fill' : 'regular'} />
                </button>
                {/* Dropdown Content Area */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
