import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from './components/layout/TopBar';
import { NabdSmartBar } from './components/ui/NabdSmartBar';
import { SignedIn, SignedOut, SignIn, useUser, useAuth } from './auth-adapter';
import { LandingPage } from './features/landing/LandingPage';
import { AcceptInvitePage } from './features/auth/AcceptInvitePage';
import { Board, Workspace, ViewState, BoardViewType, BoardColumn, RecentlyVisitedItem, Task } from './types';
import { BoardTemplate } from './features/board/data/templates';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { FocusProvider } from './contexts/FocusContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { ToastProvider } from './features/marketplace/components/Toast';
import { RedirectToSignIn } from './auth-adapter';
import { boardService } from './services/boardService';
import { cleanupBoardStorage, cleanupWorkspaceBoardsStorage } from './utils/storage';
import { appLogger, boardLogger } from './utils/logger';
import { FeatureErrorBoundary } from './components/common/FeatureErrorBoundary';
import { API_URL } from './config/api';

// Lazy load feature pages for better initial bundle size
const Dashboard = lazyWithRetry(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const BoardView = lazyWithRetry(() => import('./features/board/BoardView').then(m => ({ default: m.BoardView })));
const InboxView = lazyWithRetry(() => import('./features/inbox/InboxView').then(m => ({ default: m.InboxView })));
const VaultView = lazyWithRetry(() => import('./features/vault/VaultView').then(m => ({ default: m.VaultView })));
const FlowHubPage = lazyWithRetry(() => import('./features/flowHub/FlowHubPage'));
const ProcessMapPage = lazyWithRetry(() => import('./features/flowHub/ProcessMapPage'));
const MyWorkPage = lazyWithRetry(() => import('./features/myWork/MyWorkPage').then(m => ({ default: m.MyWorkPage })));
const TeamsPage = lazyWithRetry(() => import('./features/teams/TeamsPage'));
const TalkPage = lazyWithRetry(() => import('./features/talk/TalkPage'));
const TestPage = lazyWithRetry(() => import('./features/tools/TestPage').then(m => ({ default: m.TestPage })));

const AppContent: React.FC = () => {
  // --- Persistent State Initialization ---

  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUI();
  const { updateUserDisplayName } = useAppContext();

  // Sync authenticated user's name to AppContext
  useEffect(() => {
    if (user?.fullName) {
      updateUserDisplayName(user.fullName);
    }
  }, [user?.fullName, updateUserDisplayName]);

  const [activeView, setActiveView] = useState<ViewState | string>(() => {
    // Try to restore view from URL first, then localStorage
    const path = window.location.pathname;
    if (path.startsWith('/board/')) {
      return 'board';
    } else if (path !== '/' && path.length > 1) {
      // Extract view from path like /dashboard, /teams, /vault etc.
      const viewFromPath = path.substring(1).split('/')[0];
      if (viewFromPath) return viewFromPath;
    }
    const saved = localStorage.getItem('app-active-view');
    return saved || 'dashboard';
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('app-workspaces');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('app-active-workspace') || '';
  });

  // Fetch Workspaces from API
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (token) {
          appLogger.info('[App] Fetching workspaces...');
          const response = await fetch(`${API_URL}/workspaces`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            appLogger.info('[App] Workspaces fetched:', data);
            setWorkspaces(data);

            // Auto-select workspace if current is invalid or missing
            const currentExists = data.find((w: Workspace) => w.id === activeWorkspaceId);
            if (data.length > 0 && !currentExists) {
              appLogger.info(`Current workspace ${activeWorkspaceId} not found. Switching to ${data[0].id}`);
              setActiveWorkspaceId(data[0].id);
            } else if (data.length > 0 && (!activeWorkspaceId || activeWorkspaceId === 'w1')) {
              // Keeps existing logic for empty/'w1' case just in case, though the above covers most mismatch cases
              setActiveWorkspaceId(data[0].id);
            } else if (data.length === 0) {
              appLogger.warn('[App] No workspaces found. Prompting creation or waiting.');
            }
          } else {
            appLogger.error('[App] Failed to fetch workspaces. Status:', response.status);
            // Fallback to local storage if API fails (already loaded in initial state, so just keep it)
          }
        } else {
          // Fallback to local storage if no token (already loaded in initial state)
          // Check if we need to set activeWorkspaceId from local data
          if (workspaces.length > 0 && !activeWorkspaceId) {
            setActiveWorkspaceId(workspaces[0].id);
          }
        }
      } catch (error) {
        appLogger.error("Failed to fetch workspaces", error);
      }
    };
    fetchWorkspaces();
  }, [isSignedIn, getToken]); // Only runs once on sign-in

  // Switch to standard state, fetched from API OR local storage
  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = localStorage.getItem('app-boards');
    return saved ? JSON.parse(saved) : [];
  });

  // Track if we're still loading boards from API
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);

  // Track boards that haven't been synced to server yet
  const [unsyncedBoardIds, setUnsyncedBoardIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('app-unsynced-boards');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Track boards that have been deleted locally but might still be on server
  const [deletedBoardIds, setDeletedBoardIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('app-deleted-boards');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist deleted boards
  useEffect(() => {
    localStorage.setItem('app-deleted-boards', JSON.stringify(Array.from(deletedBoardIds)));
  }, [deletedBoardIds]);

  // Persist unsynced boards
  useEffect(() => {
    localStorage.setItem('app-unsynced-boards', JSON.stringify(Array.from(unsyncedBoardIds)));
  }, [unsyncedBoardIds]);

  // Fetch Boards from API
  useEffect(() => {
    const fetchBoards = async () => {
      if (!isSignedIn) {
        setIsBoardsLoading(false);
        return;
      }
      try {
        const token = await getToken();
        if (token) {
          const fetchedBoards = await boardService.getAllBoards(token, activeWorkspaceId);

          // CRITICAL: Read deletedBoardIds directly from localStorage to avoid stale closure issues
          const savedDeletedIds = localStorage.getItem('app-deleted-boards');
          const currentDeletedIds: Set<string> = savedDeletedIds
            ? new Set(JSON.parse(savedDeletedIds))
            : new Set();

          // Read unsyncedBoardIds directly from localStorage too for consistency
          const savedUnsyncedIds = localStorage.getItem('app-unsynced-boards');
          const currentUnsyncedIds: Set<string> = savedUnsyncedIds
            ? new Set(JSON.parse(savedUnsyncedIds))
            : new Set();

          // CRITICAL: Merge Strategy V2 - Unsynced Tracking
          // 1. Mark fetched boards as synced (remove from unsynced list)
          setUnsyncedBoardIds(prev => {
            const next = new Set(prev);
            fetchedBoards.forEach((b: Board) => next.delete(b.id));
            return next;
          });

          // 2. Clean up deletedBoardIds - if board is NOT in fetched list, server confirmed deletion
          const fetchedBoardIds = new Set(fetchedBoards.map((b: Board) => b.id));
          setDeletedBoardIds(prev => {
            const next = new Set(prev);
            prev.forEach(deletedId => {
              // If server no longer has this board, deletion is confirmed - stop tracking
              if (!fetchedBoardIds.has(deletedId)) {
                next.delete(deletedId);
              }
            });
            return next;
          });

          // 3. Merge: Keep Server Boards + Keep Unsynced Local Boards - Exclude Deleted Boards
          // Drop local boards that are NOT on server AND NOT in unsynced list (confirmed deletions)
          setBoards(prev => {
            const boardMap = new Map();

            // Server truth first, but filter out known deleted ones (use fresh localStorage value)
            fetchedBoards.forEach((b: Board) => {
              if (!currentDeletedIds.has(b.id)) {
                boardMap.set(b.id, b);
              }
            });

            // Restore local boards ONLY if they are pending sync
            prev.forEach(localBoard => {
              // If we haven't seen this board active on server yet...
              if (!boardMap.has(localBoard.id)) {
                // ...check if it's marked as unsynced (use fresh localStorage value)
                const isUnsynced = currentUnsyncedIds.has(localBoard.id);
                // Also make sure it's not deleted
                const isDeleted = currentDeletedIds.has(localBoard.id);
                if (isUnsynced && !isDeleted) {
                  boardMap.set(localBoard.id, localBoard);
                }
              }
            });

            return Array.from(boardMap.values());
          });

          // Sync activeWorkspaceId if it's still 'w1' or default and we have real boards
          if (fetchedBoards.length > 0) {
            const firstBoardWorkspaceId = fetchedBoards[0].workspaceId;
            if (firstBoardWorkspaceId && (activeWorkspaceId === 'w1' || !activeWorkspaceId)) {
              setActiveWorkspaceId(firstBoardWorkspaceId);
            }
          }
        }
        setIsBoardsLoading(false);
      } catch (error) {
        appLogger.error("Failed to fetch boards", error);
        setIsBoardsLoading(false);
      }
    };
    fetchBoards();
  }, [isSignedIn, getToken, activeWorkspaceId]);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
    // Try to restore board ID from URL first, then localStorage
    const path = window.location.pathname;
    if (path.startsWith('/board/')) {
      const boardIdFromPath = path.split('/board/')[1]?.split('/')[0];
      if (boardIdFromPath) return boardIdFromPath;
    }
    const savedId = localStorage.getItem('app-active-board');
    return savedId;
  });

  const lastLoggedUpdate = React.useRef<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-width');
    return saved ? parseInt(saved, 10) : 260;
  });
  // isSidebarCollapsed state moved to UIContext

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // Filter boards by active workspace - this ensures components only see relevant data
  const workspaceBoards = React.useMemo(() => {
    if (!activeWorkspaceId) return boards;
    return boards.filter(b => b.workspaceId === activeWorkspaceId);
  }, [boards, activeWorkspaceId]);

  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('app-page-visibility');
    return saved ? JSON.parse(saved) : {};
  });

  const [recentlyVisited, setRecentlyVisited] = useState<RecentlyVisitedItem[]>(() => {
    const saved = localStorage.getItem('app-recently-visited');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence Effects ---

  useEffect(() => {
    localStorage.setItem('app-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Sidebar persistence handled in UIContext

  useEffect(() => {
    localStorage.setItem('app-active-view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('app-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  // Boards persistence RESTORED (fallback for offline/refresh) - debounced to reduce JSON.stringify calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('app-boards', JSON.stringify(boards));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [boards]);

  useEffect(() => {
    localStorage.setItem('app-active-workspace', activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeBoardId) {
      localStorage.setItem('app-active-board', activeBoardId);
    }
  }, [activeBoardId]);

  useEffect(() => {
    localStorage.setItem('app-page-visibility', JSON.stringify(pageVisibility));
  }, [pageVisibility]);

  useEffect(() => {
    localStorage.setItem('app-recently-visited', JSON.stringify(recentlyVisited));
  }, [recentlyVisited]);

  const logActivity = React.useCallback(async (type: string, content: string, metadata?: Record<string, unknown>, specificWorkspaceId?: string, specificBoardId?: string) => {
    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_URL}/activities`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type,
            content,
            metadata,
            workspaceId: specificWorkspaceId || activeWorkspaceId,
            boardId: specificBoardId || activeBoardId
          })
        });
      }
    } catch (e) {
      appLogger.error("Failed to log activity", e);
    }
  }, [getToken, activeWorkspaceId, activeBoardId]);

  const handleBoardCreated = React.useCallback(async (newBoard: Board) => {
    // API Call first to get the real board object (with DB ID and workspaceId)
    try {
      const token = await getToken();
      if (token) {
        const createdBoard = await boardService.createBoard(token, newBoard);

        // Update local state with the board returned from server
        setBoards(prev => [...prev, createdBoard]);
        setActiveBoardId(createdBoard.id);
        setActiveView('board');

        // Log activity - MOVED TO BACKEND
        // const ws = workspaces.find(w => w.id === createdBoard.workspaceId);
        // logActivity('BOARD_CREATED', `Created board: ${createdBoard.name}${ws ? ` in ${ws.name}` : ''}`, { boardId: createdBoard.id }, createdBoard.workspaceId, createdBoard.id);

        // Ensure activeWorkspaceId stays in sync if user was on a mock one
        if (createdBoard.workspaceId && activeWorkspaceId !== createdBoard.workspaceId) {
          setActiveWorkspaceId(createdBoard.workspaceId);
        }
      }
    } catch (e) {
      boardLogger.error("Failed to create board backend", e);
      // Fallback
      setBoards(prev => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
      setActiveView('board');
    }
  }, [getToken, activeWorkspaceId, logActivity]);

  const handleQuickAddBoard = (name: string, icon?: string, template?: BoardTemplate, defaultView: BoardViewType = 'table', parentId?: string) => {
    const newBoardId = Date.now().toString();

    // Determine columns based on template or default
    let initialColumns: BoardColumn[] = [
      { id: 'name', title: 'Name', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'dueDate', title: 'Due date', type: 'date' },
      { id: 'priority', title: 'Priority', type: 'priority' }
    ];

    if (template) {
      initialColumns = template.columns.map(col => ({
        id: col.id,
        title: col.label,
        type: col.type as any
      }));

      // Initialize localStorage for RoomTable
      try {
        const mappedColumns = template.columns.map(col => ({
          id: col.id,
          label: col.label,
          type: col.type,
          width: col.width,
          minWidth: 100,
          resizable: true,
          pinned: col.id === 'name' || col.id === 'select',
          options: col.options
        }));
        // Save columns for RoomTable (v4 keys matching RoomTable.tsx)
        const v4ColsKey = `room-table-columns-v4-${newBoardId}-table-main`;
        localStorage.setItem(v4ColsKey, JSON.stringify(mappedColumns));
        localStorage.setItem(`room-table-columns-v4-${newBoardId}-default`, JSON.stringify(mappedColumns));

        // Save status groups - Use standard defaults
        const defaultGroups = [
          { id: 'To Do', label: 'To Do', color: '#c4c4c4' },
          { id: 'In Progress', label: 'In Progress', color: '#fdab3d' },
          { id: 'Stuck', label: 'Stuck', color: '#e2445c' },
          { id: 'Done', label: 'Done', color: '#00c875' },
          { id: 'Rejected', label: 'Rejected', color: '#333333' }
        ];
        // If template has specific groups use them, otherwise use defaults
        const statusGroups = (template.groups && template.groups.length > 1) ? template.groups.map(g => ({
          id: g.id,
          label: g.title,
          color: g.color || '#c4c4c4'
        })) : defaultGroups;

        localStorage.setItem(`board-statuses-${newBoardId}`, JSON.stringify(statusGroups));

        // Process Items (Tasks)
        if (template.items && template.items.length > 0) {
          const initialTasks = template.items.map((item, index) => {
            // Map item fields to columns
            // We know 'Name' -> 'name', 'Status' -> 'status', 'Owner' -> 'assignees' from mapColumns
            const task: any = {
              id: `t-${Date.now()}-${index}`,
              name: item['Name'] || 'Untitled Task',
              groupId: 'To Do' // Default to first group
            };

            // Map other dynamic fields
            Object.keys(item).forEach(key => {
              if (key === 'Name') return;

              if (key === 'Status') {
                task['status'] = item[key];
                // Set groupId based on status if possible
                const group = statusGroups.find(g => g.label === item[key]);
                if (group) task.groupId = group.id;
              } else if (key === 'Owner') {
                // For demo purposes, we can't easily map string "Alex" to a user ID without a user db.
                // We'll put it in a custom field or just leave it as text if column type allows.
                // But RoomTable expects user IDs for 'person' column.
                // We will just skip owner mapping or put it in a text field if we had one.
                // Actually, let's just leave it empty for 'person' column as we don't have matching user IDs.
                // Or if we change column type to text it would work.
                // For now, let's map it if the column type is text, otherwise ignore.
                const colId = key.toLowerCase().replace(/ /g, '_');
                if (colId === 'assignees') return; // Skip person column for text mapping
                task[colId] = item[key];
              } else {
                const colId = key.toLowerCase().replace(/ /g, '_');
                task[colId] = item[key];
              }
            });
            return task;
          });
          appLogger.info("App: Saving tasks for board", { boardId: newBoardId, taskCount: initialTasks.length, firstTask: initialTasks[0]?.name });
          localStorage.setItem(`room-items-v3-${newBoardId}`, JSON.stringify(initialTasks));
          localStorage.setItem(`board-tasks-${newBoardId}`, JSON.stringify(initialTasks));
        }

      } catch (e) {
        appLogger.error('Failed to initialize template storage', e);
      }
    }

    const newBoard: Board = {
      id: newBoardId,
      name: name || 'New Board',
      workspaceId: activeWorkspaceId,
      columns: initialColumns,
      tasks: [],
      defaultView: 'overview', // Standard start with Overview
      availableViews: ['overview', defaultView], // Overview + Selected Tool
      icon: icon,
      parentId: parentId
    };

    // Mark as unsynced immediately
    setUnsyncedBoardIds(prev => new Set(prev).add(newBoardId));

    handleBoardCreated(newBoard);
  };

  const handleNavigate = React.useCallback((view: ViewState | string, boardId?: string, skipHistoryPush?: boolean) => {
    setActiveView(view);
    if (boardId) {
      setActiveBoardId(boardId);
      const board = boards.find(b => b.id === boardId);
      if (board) {
        addToHistory(view, board);
      }
    } else {
      addToHistory(view);
    }

    // Push to browser history for back button support (unless restoring from popstate)
    if (!skipHistoryPush) {
      const url = boardId ? `/board/${boardId}` : `/${view}`;
      window.history.pushState({ view, boardId }, '', url);
    }
  }, [boards]);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view, boardId } = event.state;
        // Directly set state to avoid triggering another history push
        setActiveView(view || 'dashboard');
        if (boardId) setActiveBoardId(boardId);
      } else {
        // No state - default to dashboard
        setActiveView('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize browser history state on mount
  useEffect(() => {
    const initialUrl = activeBoardId ? `/board/${activeBoardId}` : `/${activeView}`;
    window.history.replaceState({ view: activeView, boardId: activeBoardId }, '', initialUrl);
  }, []);

  const addToHistory = (view: ViewState | string, board?: Board) => {
    if (view === 'dashboard' || view === 'landing' || view === 'signup' || view === 'signin') return;

    let title = view.charAt(0).toUpperCase() + view.slice(1).replace(/_/g, ' ');
    let metadata = 'Feature';

    if (board) {
      title = board.name;
      metadata = 'Board';
    } else if (view.includes('marketplace')) {
      metadata = 'Marketplace';
    } else if (['procurement', 'warehouse', 'shipping', 'fleet', 'vendors', 'planning'].includes(view as string)) {
      metadata = 'Supply Chain';
    }

    const newItem: RecentlyVisitedItem = {
      id: board ? board.id : view,
      title: title,
      type: view,
      timestamp: Date.now(),
      boardId: board?.id,
      metadata: metadata,
      icon: board?.icon,
      color: board ? 'blue' : 'gray' // Default colors, refined in Dashboard
    };

    setRecentlyVisited(prev => {
      const filtered = prev.filter(item => item.id !== newItem.id);
      return [newItem, ...filtered].slice(0, 10); // Keep top 10 for the design
    });
  };

  const handleAddWorkspace = React.useCallback(async (name: string, icon: string, color?: string) => {
    // Optimistic Update
    const tempId = `ws-${Date.now()}`;
    const newWorkspaceOptimistic: Workspace = {
      id: tempId,
      name,
      icon: icon as any,
      color: color || 'from-gray-400 to-gray-500',
    };

    setWorkspaces(prev => [...prev, newWorkspaceOptimistic]);
    setActiveWorkspaceId(tempId);

    try {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${API_URL}/workspaces`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, icon, color })
        });

        if (response.ok) {
          const newWorkspaceReal = await response.json();
          // Replace optimistic one with real one
          setWorkspaces(prev => prev.map(w => w.id === tempId ? newWorkspaceReal : w));
          setActiveWorkspaceId(newWorkspaceReal.id);

          // CRITICAL FIX: Update any boards that were created while workspace was in optimistic state
          setBoards(prev => prev.map(b => b.workspaceId === tempId ? { ...b, workspaceId: newWorkspaceReal.id } : b));

          // Auto-create a default "Table Plan" board for the new workspace
          const defaultBoardId = `board-${Date.now()}`;
          const defaultBoard: Board = {
            id: defaultBoardId,
            name: 'Board',
            workspaceId: newWorkspaceReal.id,
            columns: [
              { id: 'name', title: 'Name', type: 'text' },
              { id: 'status', title: 'Status', type: 'status' },
              { id: 'dueDate', title: 'Due date', type: 'date' },
              { id: 'priority', title: 'Priority', type: 'priority' }
            ],
            tasks: [],
            defaultView: 'table',
            availableViews: ['table'],
            icon: 'Table'
          };

          // Create the board via API
          try {
            const createdBoard = await boardService.createBoard(token, defaultBoard);
            setBoards(prev => [...prev, createdBoard]);
            setActiveBoardId(createdBoard.id);
            setActiveView('board');
          } catch (boardErr) {
            boardLogger.error("Failed to auto-create default board", boardErr);
            // Still add to local state as fallback
            setBoards(prev => [...prev, defaultBoard]);
            setActiveBoardId(defaultBoardId);
            setActiveView('board');

            // Track as unsynced
            setUnsyncedBoardIds(prev => new Set(prev).add(defaultBoardId));
          }
        } else {
          appLogger.error("Failed to add workspace backend, keeping local");
          // Optionally revert or mark as unsynced
        }
      }
    } catch (error) {
      appLogger.error("Failed to add workspace", error);
      // Keep optimistic update since we want offline support
    }
  }, [getToken]);



  const handleDeleteWorkspace = React.useCallback(async (id: string) => {
    if (workspaces.length <= 1) return; // Prevent deleting last workspace

    // Get boards to delete for localStorage cleanup
    const boardsToDelete = boards.filter(b => b.workspaceId === id);
    const boardIdsToDelete = boardsToDelete.map(b => b.id);

    // Optimistic Update
    const workspaceToDelete = workspaces.find(w => w.id === id);
    setWorkspaces(prev => {
      const newWorkspaces = prev.filter(w => w.id !== id);
      if (activeWorkspaceId === id && newWorkspaces.length > 0) {
        setActiveWorkspaceId(newWorkspaces[0].id);
      }
      return newWorkspaces;
    });
    setBoards(prev => prev.filter(b => b.workspaceId !== id));

    // Clean up localStorage for all boards in this workspace
    cleanupWorkspaceBoardsStorage(boardIdsToDelete);

    // Also mark these boards as deleted to prevent resurrection
    setDeletedBoardIds(prev => {
      const next = new Set(prev);
      boardIdsToDelete.forEach(id => next.add(id));
      return next;
    });

    try {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${API_URL}/workspaces/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          appLogger.error("Failed to delete workspace backend, reverting");
          // Revert optimistic update
          if (workspaceToDelete) {
            setWorkspaces(prev => [...prev, workspaceToDelete]);
          }
        } else {
          // Backend succeeded, clean up deletedBoardIds
          setDeletedBoardIds(prev => {
            const next = new Set(prev);
            boardIdsToDelete.forEach(id => next.delete(id));
            return next;
          });
        }
      }
    } catch (error) {
      appLogger.error("Failed to delete workspace", error);
    }
  }, [workspaces, boards, activeWorkspaceId, getToken]);

  const handleDeleteBoard = React.useCallback(async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) {
      boardLogger.info('[Delete Board] Board not found in local state:', boardId);
      return;
    }

    boardLogger.info('[Delete Board] Attempting to delete:', { boardId, boardName: board.name });

    // Optimistic update - remove from local state IMMEDIATELY
    setBoards(prev => prev.filter(b => b.id !== boardId));

    // CRITICAL FIX: Stop tracking as unsynced so it doesn't resurrect on refresh
    setUnsyncedBoardIds(prev => {
      const next = new Set(prev);
      next.delete(boardId);
      return next;
    });

    // Mark as deleted to prevent zombie reappearance (persisted to localStorage)
    setDeletedBoardIds(prev => new Set(prev).add(boardId));

    // Also update localStorage immediately to ensure it's persisted before any async operations
    const currentDeleted = localStorage.getItem('app-deleted-boards');
    const deletedSet = currentDeleted ? new Set(JSON.parse(currentDeleted)) : new Set();
    deletedSet.add(boardId);
    localStorage.setItem('app-deleted-boards', JSON.stringify(Array.from(deletedSet)));

    // Update unsynced storage too
    const currentUnsynced = localStorage.getItem('app-unsynced-boards');
    if (currentUnsynced) {
      const unsyncedSet = new Set(JSON.parse(currentUnsynced));
      if (unsyncedSet.has(boardId)) {
        unsyncedSet.delete(boardId);
        localStorage.setItem('app-unsynced-boards', JSON.stringify(Array.from(unsyncedSet)));
      }
    }

    // Clean up all localStorage data for this board
    cleanupBoardStorage(boardId);

    if (activeBoardId === boardId) {
      setActiveBoardId(null);
      setActiveView('dashboard');
    }

    // Try backend deletion - but don't revert UI on failure (user expects immediate feedback)
    try {
      const token = await getToken();
      if (token) {
        boardLogger.info('[Delete Board] Calling backend with token...');
        await boardService.deleteBoard(token, boardId);
        boardLogger.info('[Delete Board] Backend delete successful');
        // On success, we can remove from `deletedBoardIds` since server no longer has it
        setDeletedBoardIds(prev => {
          const next = new Set(prev);
          next.delete(boardId);
          return next;
        });
      } else {
        boardLogger.error("[Delete Board] No auth token available - keeping local deletion");
      }
    } catch (e) {
      boardLogger.error("[Delete Board] Backend call failed:", e);
    }
  }, [activeBoardId, getToken, boards]);

  const handleToggleFavorite = (id: string) => {
    // Favorites not yet persisted in backend schema
    setBoards(boards.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  };

  const handleUpdateBoard = React.useCallback(async (boardId: string, updates: Partial<Board>) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, ...updates } : b));

    try {
      const token = await getToken();
      if (token) {
        await boardService.updateBoard(token, boardId, updates);
      }
    } catch (e) { boardLogger.error('Failed to update board', e); }
  }, [getToken]);

  // --- Department Pages (Lazy Loaded) ---
  const ProcurementPage = lazyWithRetry(() => import('./features/supply_chain/procurement/ProcurementPage'));
  const WarehousePage = lazyWithRetry(() => import('./features/supply_chain/warehouse/WarehousePage'));
  const ShippingPage = lazyWithRetry(() => import('./features/supply_chain/shipping/ShippingPage'));
  const FleetPage = lazyWithRetry(() => import('./features/supply_chain/fleet/FleetPage'));
  const VendorsPage = lazyWithRetry(() => import('./features/supply_chain/vendors/VendorsPage'));
  const PlanningPage = lazyWithRetry(() => import('./features/supply_chain/planning/PlanningPage'));

  const MaintenancePage = lazyWithRetry(() => import('./features/operations/maintenance/MaintenancePage'));
  const ProductionPage = lazyWithRetry(() => import('./features/operations/production/ProductionPage'));
  const QualityPage = lazyWithRetry(() => import('./features/operations/quality/QualityPage'));

  const BusinessSalesPage = lazyWithRetry(() => import('./features/business/sales/SalesPage'));
  const FinancePage = lazyWithRetry(() => import('./features/business/finance/FinancePage'));


  // Mini Company - Overview
  const DashboardsPage = lazyWithRetry(() => import('./features/mini_company/overview/DashboardsPage'));
  const ReportsPage = lazyWithRetry(() => import('./features/mini_company/overview/ReportsPage'));

  // Mini Company - Operations
  const SalesPage = lazyWithRetry(() => import('./features/mini_company/operations/SalesPage'));
  const PurchasesPage = lazyWithRetry(() => import('./features/mini_company/operations/PurchasesPage'));
  const InventoryPage = lazyWithRetry(() => import('./features/mini_company/operations/InventoryPage'));

  // Mini Company - Finance
  const ExpensesPage = lazyWithRetry(() => import('./features/mini_company/finance/ExpensesPage'));
  const CustomersPage = lazyWithRetry(() => import('./features/mini_company/customers/CustomersPage').then(module => ({ default: module.CustomersPage })));
  const SuppliersPage = lazyWithRetry(() => import('./features/mini_company/suppliers/SuppliersPage').then(module => ({ default: module.SuppliersPage })));

  // Mini Company - People



  const LocalMarketplacePage = lazyWithRetry(() => import('./features/marketplace/LocalMarketplacePage'));
  const ForeignMarketplacePage = lazyWithRetry(() => import('./features/marketplace/ForeignMarketplacePage'));

  const ITPage = lazyWithRetry(() => import('./features/business_support/it/ITPage'));
  const HRPage = lazyWithRetry(() => import('./features/business_support/hr/HRPage'));
  const MarketingPage = lazyWithRetry(() => import('./features/business_support/marketing/MarketingPage'));
  const CornellNotesPage = lazyWithRetry(() => import('./features/tools/cornell/CornellNotesPage'));
  const QuickNotesPage = lazyWithRetry(() => import('./features/quick_notes/QuickNotesPage'));
  const SettingsPage = lazyWithRetry(() => import('./features/settings/SettingsPage'));

  const FullScreenLoader = () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleUpdateTasks = React.useCallback(async (tasks: Task[]) => {
    if (activeBoardId) {
      const currentBoard = boards.find(b => b.id === activeBoardId);
      if (!currentBoard) return;

      const oldTasks = currentBoard.tasks || [];
      const currentWorkspace = workspaces.find(w => w.id === currentBoard.workspaceId);
      const contextName = `${currentBoard.name}${currentWorkspace ? ` (${currentWorkspace.name})` : ''}`;

      // Basic deep equality check for tasks to avoid redundant updates/logging
      const tasksHash = JSON.stringify(tasks);
      const currentHash = JSON.stringify(oldTasks);

      if (tasksHash === currentHash) return;

      setBoards(prevBoards => prevBoards.map(b => b.id === activeBoardId ? { ...b, tasks } : b));

      try {
        const token = await getToken();
        if (token) {
          await boardService.updateBoard(token, activeBoardId, { tasks });

          // 1. Detect Task Additions
          if (tasks.length > oldTasks.length) {
            const addedTask = tasks.find(t => !oldTasks.some(ot => ot.id === t.id));
            if (addedTask) {
              const updateKey = `add-${addedTask.id}`;
              if (lastLoggedUpdate.current !== updateKey) {
                logActivity('TASK_CREATED', `Created task "${addedTask.name}" in ${contextName}`, { boardId: activeBoardId, taskId: addedTask.id });
                lastLoggedUpdate.current = updateKey;
              }
            }
          }
          // 2. Detect Task Deletions
          else if (tasks.length < oldTasks.length) {
            const removedTask = oldTasks.find(ot => !tasks.some(t => t.id === ot.id));
            if (removedTask) {
              const updateKey = `remove-${removedTask.id}`;
              if (lastLoggedUpdate.current !== updateKey) {
                logActivity('TASK_DELETED', `Deleted task "${removedTask.name}" from ${contextName}`, { boardId: activeBoardId, taskId: removedTask.id });
                lastLoggedUpdate.current = updateKey;
              }
            }
          }
          // 3. Detect Task Edits
          else {
            tasks.forEach((task) => {
              const oldTask = oldTasks.find(ot => ot.id === task.id);
              if (oldTask) {
                // Check multiple fields
                if (oldTask.status !== task.status) {
                  const updateKey = `status-${task.id}-${task.status}`;
                  if (lastLoggedUpdate.current !== updateKey) {
                    logActivity('TASK_UPDATED', `Updated "${task.name}" status to ${task.status || 'None'} in ${contextName}`, { boardId: activeBoardId, taskId: task.id });
                    lastLoggedUpdate.current = updateKey;
                  }
                } else if (oldTask.name !== task.name) {
                  const updateKey = `name-${task.id}-${task.name}`;
                  if (lastLoggedUpdate.current !== updateKey) {
                    logActivity('TASK_UPDATED', `Renamed task to "${task.name}" in ${contextName}`, { boardId: activeBoardId, taskId: task.id });
                    lastLoggedUpdate.current = updateKey;
                  }
                } else if (oldTask.priority !== task.priority) {
                  const updateKey = `priority-${task.id}-${task.priority}`;
                  if (lastLoggedUpdate.current !== updateKey) {
                    logActivity('TASK_UPDATED', `Changed priority of "${task.name}" to ${task.priority || 'None'} in ${contextName}`, { boardId: activeBoardId, taskId: task.id });
                    lastLoggedUpdate.current = updateKey;
                  }
                } else if (oldTask.date !== task.date) {
                  const updateKey = `date-${task.id}-${task.date}`;
                  if (lastLoggedUpdate.current !== updateKey) {
                    logActivity('TASK_UPDATED', `Changed date for "${task.name}" to ${task.date || 'unscheduled'} in ${contextName}`, { boardId: activeBoardId, taskId: task.id });
                    lastLoggedUpdate.current = updateKey;
                  }
                }
              }
            });
          }
        }
      } catch (e) {
        boardLogger.error("Failed to update tasks backend", e);
      }
    }
  }, [activeBoardId, getToken, boards, workspaces, logActivity]);

  // Generic task creator that can be used from My Work
  const handleCreateTaskOnBoard = React.useCallback(async (boardId: string, task: Task) => {
    let updatedTasks: Task[] = [];
    setBoards(prevBoards => prevBoards.map(b => {
      if (b.id === boardId) {
        updatedTasks = [...(b.tasks || []), task];
        return { ...b, tasks: updatedTasks };
      }
      return b;
    }));

    // Perform side effects OUTSIDE of the state updater
    try {
      const token = await getToken();
      if (token && updatedTasks.length > 0) {
        await boardService.updateBoard(token, boardId, { tasks: updatedTasks });
        const board = boards.find(b => b.id === boardId);
        const ws = workspaces.find(w => w.id === board?.workspaceId);
        const contextString = board ? `${board.name}${ws ? ` (${ws.name})` : ''}` : 'Board';
        logActivity('TASK_CREATED', `Created task: "${task.name}" in ${contextString}`, { boardId, taskId: task.id }, board?.workspaceId, boardId);
      }
    } catch (e) {
      boardLogger.error("Failed to create task backend", e);
    }
  }, [getToken, logActivity]);

  return (
    <div className="flex flex-col h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg font-sans text-[#323338] dark:text-monday-dark-text transition-colors duration-200">
      <TopBar onNavigate={handleNavigate} boards={workspaceBoards} onCreateTask={handleCreateTaskOnBoard} />
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <Sidebar
          activeView={activeView}
          activeBoardId={activeBoardId}
          onNavigate={handleNavigate}
          width={sidebarWidth}
          onResize={setSidebarWidth}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceChange={setActiveWorkspaceId}
          onAddWorkspace={handleAddWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          boards={workspaceBoards}
          onDeleteBoard={handleDeleteBoard}
          onToggleFavorite={handleToggleFavorite}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev: boolean) => !prev)}
          onAddBoard={(name, icon, template, defaultView, parentId) => handleQuickAddBoard(name, icon, template, defaultView as any, parentId)}
          pageVisibility={pageVisibility}
        />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#FCFCFD] dark:bg-monday-dark-bg z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.08)] ml-0.5`}>
          <React.Suspense fallback={<FullScreenLoader />}>
            {activeView === 'dashboard' ? (
              <FeatureErrorBoundary featureName="Dashboard">
                <Dashboard
                  onBoardCreated={handleBoardCreated}
                  recentlyVisited={recentlyVisited}
                  onNavigate={handleNavigate}
                  boards={workspaceBoards}
                  activeWorkspaceId={activeWorkspaceId}
                  workspaces={workspaces}
                  onTaskCreated={handleCreateTaskOnBoard}
                />
              </FeatureErrorBoundary>
            ) : activeView === 'board' ? (
              activeBoard ? (
                <FeatureErrorBoundary featureName="Board">
                  <BoardView
                    key={activeBoard.id}
                    board={activeBoard}
                    onUpdateBoard={handleUpdateBoard}
                    onUpdateTasks={handleUpdateTasks}
                    dashboardSections={activeBoard.dashboardSections}
                    onNavigate={handleNavigate}
                    isDepartmentLayout={!!activeBoard.isDepartmentLayout} // Pass layout flag
                  />
                </FeatureErrorBoundary>
              ) : isBoardsLoading ? (
                <FullScreenLoader />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 font-light text-xl">
                  Board not found. <button onClick={() => handleNavigate('dashboard')} className="ml-2 text-blue-500 hover:underline">Go to Dashboard</button>
                </div>
              )
            ) : activeView === 'inbox' ? (
              <FeatureErrorBoundary featureName="Inbox">
                <InboxView onNavigate={handleNavigate} />
              </FeatureErrorBoundary>
            ) : activeView === 'my_work' ? (
              <FeatureErrorBoundary featureName="My Work">
                <MyWorkPage
                  boards={workspaceBoards}
                  onNavigateToBoard={handleNavigate}
                  onUpdateTasks={handleCreateTaskOnBoard}
                  onAddBoard={handleBoardCreated}
                />
              </FeatureErrorBoundary>
            ) : activeView === 'teams' ? (
              <FeatureErrorBoundary featureName="Teams">
                <TeamsPage />
              </FeatureErrorBoundary>
            ) : activeView === 'vault' ? (
              <FeatureErrorBoundary featureName="Vault">
                <VaultView />
              </FeatureErrorBoundary>
            ) : activeView === 'flow_hub' ? (
              <FlowHubPage />
            ) : activeView === 'process_map' ? (
              <ProcessMapPage />
            ) : activeView === 'procurement' ? (
              <ProcurementPage />
            ) : activeView === 'warehouse' ? (
              <WarehousePage />
            ) : activeView === 'shipping' ? (
              <ShippingPage />
            ) : activeView === 'fleet' ? (
              <FleetPage />
            ) : activeView === 'vendors' ? (
              <VendorsPage />
            ) : activeView === 'planning' ? (
              <PlanningPage />
            ) : activeView === 'maintenance' ? (
              <MaintenancePage />
            ) : activeView === 'production' ? (
              <ProductionPage />
            ) : activeView === 'quality' ? (
              <QualityPage />
            ) : activeView === 'sales_factory' ? (
              <FinancePage onNavigate={handleNavigate} />
            ) : activeView === 'sales_listing' ? (
              <BusinessSalesPage onNavigate={handleNavigate} />
            ) : activeView === 'dashboards' ? (
              <DashboardsPage />
            ) : activeView === 'sales' ? (
              <SalesPage />
            ) : activeView === 'purchases' ? (
              <PurchasesPage />
            ) : activeView === 'inventory' ? (
              <InventoryPage />
            ) : activeView === 'expenses' ? (
              <ExpensesPage />
            ) : activeView === 'customers' ? (
              <CustomersPage />
            ) : activeView === 'suppliers' ? (
              <SuppliersPage />
            ) : activeView === 'reports' ? (
              <ReportsPage />
            ) : activeView === 'it_support' ? (
              <ITPage />
            ) : activeView === 'hr' ? (
              <HRPage />
            ) : activeView === 'marketing' ? (
              <MarketingPage />
            ) : activeView === 'local_marketplace' ? (
              <LocalMarketplacePage />
            ) : activeView === 'foreign_marketplace' ? (
              <ForeignMarketplacePage />
            ) : activeView === 'cornell_notes' ? (
              <CornellNotesPage />
            ) : activeView === 'quick_notes' ? (
              <QuickNotesPage />
            ) : activeView === 'settings' ? (
              <SettingsPage visibility={pageVisibility} onVisibilityChange={setPageVisibility} />
            ) : activeView === 'talk' ? (
              <TalkPage onNavigate={handleNavigate} />
            ) : activeView === 'test' ? (
              <TestPage />
            ) : (
              // Unknown view - redirect to dashboard
              <FeatureErrorBoundary featureName="Dashboard">
                <Dashboard
                  onBoardCreated={handleBoardCreated}
                  recentlyVisited={recentlyVisited}
                  onNavigate={handleNavigate}
                  boards={workspaceBoards}
                  activeWorkspaceId={activeWorkspaceId}
                  workspaces={workspaces}
                  onTaskCreated={handleCreateTaskOnBoard}
                />
              </FeatureErrorBoundary>
            )}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};




import { SignUpPage } from './features/auth/SignUpPage';

// Component to handle signed-in users - redirects to app subdomain if on main domain
const SignedInContent: React.FC<{ isMainDomain: boolean }> = ({ isMainDomain }) => {
  useEffect(() => {
    if (isMainDomain) {
      window.location.href = 'https://app.nabdchain.com';
    }
  }, [isMainDomain]);

  if (isMainDomain) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppContent />;
};

const AppRoutes: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser();

  // Detect hostname
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAppSubdomain = hostname === 'app.nabdchain.com';
  const isMainDomain = hostname === 'nabdchain.com' || hostname === 'www.nabdchain.com';

  // View state for auth screens: 'home' (landing), 'signin', 'signup'
  // On app subdomain, default to signin if not authenticated
  const [authView, setAuthView] = useState<'home' | 'signin' | 'signup'>(() => {
    // If on app subdomain, skip landing and go straight to signin
    if (isAppSubdomain) return 'signin';
    return 'home';
  });

  // Check for dev_auth URL parameter (passed from landing page dev login)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const devAuthToken = urlParams.get('dev_auth');
    if (devAuthToken) {
      localStorage.setItem('nabd_dev_mode', 'true');
      localStorage.setItem('mock_auth_token', devAuthToken);
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F7F9FB] dark:bg-monday-dark-bg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handler for "Back to Home" - show landing page (or redirect to main domain on app subdomain)
  const handleBackToHome = () => {
    if (isAppSubdomain) {
      // On app subdomain, redirect to main site for landing page
      window.location.href = 'https://nabdchain.com';
    } else {
      setAuthView('home');
    }
  };

  // Redirect URL after sign-in: stay on current domain
  // This avoids cross-domain cookie issues
  const signInRedirectUrl = '/dashboard';

  // App subdomain (app.nabdchain.com or localhost) - Show app or auth
  return (
    <>
      <SignedOut>
        {/* Show landing page */}
        {authView === 'home' && (
          <LandingPage onEnterSystem={() => {
            // If on main domain, redirect to app subdomain for sign-in
            if (isMainDomain) {
              window.location.href = 'https://app.nabdchain.com';
            } else {
              setAuthView('signin');
            }
          }} />
        )}

        {authView === 'signin' && (
          <div className="flex h-screen w-full items-center justify-center bg-white flex-col gap-6 relative">
            {/* Back to Home - Fixed at top */}
            <button
              onClick={handleBackToHome}
              className="absolute top-6 left-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors z-50"
            >
              ← Back to Home
            </button>

            <SignIn
              fallbackRedirectUrl={signInRedirectUrl}
              appearance={{
                variables: {
                  colorPrimary: '#000000',
                  colorText: '#000000',
                  colorTextSecondary: '#71717a',
                  colorBackground: '#ffffff',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#000000',
                },
                elements: {
                  footer: "hidden",
                  formButtonPrimary: "bg-black hover:bg-zinc-800 text-white",
                  formButtonReset: "text-black hover:text-zinc-700",
                  card: "shadow-xl",
                  headerTitle: "text-black",
                  headerSubtitle: "text-zinc-500",
                  // Hide Google/social sign-in buttons
                  socialButtons: "hidden",
                  socialButtonsBlockButton: "hidden",
                  dividerRow: "hidden",
                  formFieldLabel: "text-zinc-700",
                  formFieldInput: "border-zinc-300 focus:border-black focus:ring-black",
                  footerActionLink: "text-black hover:text-zinc-700",
                }
              }}
            />
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setAuthView('signup')}
                className="text-black font-medium hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        {authView === 'signup' && (
          <SignUpPage onNavigateToLogin={() => setAuthView('signin')} />
        )}
      </SignedOut>
      <SignedIn>
        <SignedInContent isMainDomain={isMainDomain} />
      </SignedIn>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <UIProvider>
        <LanguageProvider>
          <NavigationProvider>
            <FocusProvider>
              <ToastProvider>
                {/* Invitation Route */}
                <Router>
                  <Routes>
                    <Route
                      path="/invite/accept"
                      element={
                        <>
                          <SignedIn>
                            <AcceptInvitePage />
                          </SignedIn>
                          <SignedOut>
                            <RedirectToSignIn />
                          </SignedOut>
                        </>
                      }
                    />
                    {/* Dashboard & Main App Routes */}
                    <Route path="*" element={<AppRoutes />} />
                  </Routes>
                </Router>
              </ToastProvider>
            </FocusProvider>
          </NavigationProvider>
        </LanguageProvider>
      </UIProvider>
    </AppProvider>
  )
}

export default App;
