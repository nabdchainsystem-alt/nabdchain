import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './features/dashboard/Dashboard';
import { BoardView } from './features/board/BoardView';
import { InboxView } from './features/inbox/InboxView';
import DiscussionPage from './features/discussion/DiscussionPage';
import { VaultView } from './features/vault/VaultView';
import FlowHubPage from './features/flowHub/FlowHubPage';
import ProcessMapPage from './features/flowHub/ProcessMapPage';
import { MyWorkPage } from './features/myWork/MyWorkPage';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import { LoginPage } from './features/auth/LoginPage';
// import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth } from '@clerk/clerk-react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth } from './auth-adapter';
import { Logo } from './components/Logo';
import { LandingPage } from './features/landing/LandingPage';
import { AcceptInvitePage } from './features/auth/AcceptInvitePage';
import { Board, Workspace, ViewState, BoardViewType, BoardColumn, RecentlyVisitedItem } from './types';
import { BoardTemplate } from './features/board/data/templates';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider } from './contexts/UIContext';
import { NavigationProvider } from './contexts/NavigationContext';
import TeamsPage from './features/teams/TeamsPage';
import { FocusProvider } from './contexts/FocusContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
// import { FocusWidget } from './components/features/focus/FocusWidget';
// import { RedirectToSignIn } from '@clerk/clerk-react';
import { RedirectToSignIn } from './auth-adapter';
import { boardService } from './services/boardService';

// Mock Initial Data
const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'w1', name: 'Main workspace', icon: 'Briefcase', color: 'from-orange-400 to-red-500' }
];

const INITIAL_BOARDS: Board[] = [
  {
    id: 'default-1',
    name: 'Marketing Campaign',
    description: 'Q4 Product Launch Activities',
    workspaceId: 'w1',
    columns: [
      { id: 'c1', title: 'Owner', type: 'person' },
      { id: 'c2', title: 'Status', type: 'status' },
      { id: 'c3', title: 'Due Date', type: 'date' }
    ],
    tasks: [
      { id: 't1', name: 'Design Ad Creatives', person: 'Alice', status: 'Working on it', date: '2023-10-15', priority: 'High' },
      { id: 't2', name: 'Approve Budget', person: 'Bob', status: 'Done', date: '2023-10-01', priority: 'Medium' },
      { id: 't3', name: 'Launch Social Ads', person: 'Charlie', status: 'Stuck', date: '2023-10-20', priority: 'Low' },
      { id: 't4', name: 'Review Analytics', person: 'Alice', status: '', date: '2023-11-01', priority: null }
    ]
  },
  {
    id: 'default-2',
    name: 'Product Roadmap',
    description: '2024 Roadmap',
    workspaceId: 'w1',
    columns: [
      { id: 'c1', title: 'Owner', type: 'person' },
      { id: 'c2', title: 'Status', type: 'status' }
    ],
    tasks: [],
    isFavorite: false
  }
];

const AppContent: React.FC = () => {
  // --- Persistent State Initialization ---

  const { getToken, isSignedIn } = useAuth();

  const [activeView, setActiveView] = useState<ViewState | string>(() => {
    const saved = localStorage.getItem('app-active-view');
    return saved || 'dashboard';
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
          console.log('[App] Fetching workspaces...');
          const response = await fetch('http://localhost:3001/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('[App] Workspaces fetched:', data);
            setWorkspaces(data);

            // Auto-select workspace if current is invalid or missing
            const currentExists = data.find((w: Workspace) => w.id === activeWorkspaceId);
            if (data.length > 0 && !currentExists) {
              console.log(`[App] Current workspace ${activeWorkspaceId} not found. Switching to ${data[0].id}`);
              setActiveWorkspaceId(data[0].id);
            } else if (data.length > 0 && (!activeWorkspaceId || activeWorkspaceId === 'w1')) {
              // Keeps existing logic for empty/'w1' case just in case, though the above covers most mismatch cases
              setActiveWorkspaceId(data[0].id);
            } else if (data.length === 0) {
              console.warn('[App] No workspaces found. Prompting creation or waiting.');
            }
          } else {
            console.error('[App] Failed to fetch workspaces. Status:', response.status);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspaces", error);
      }
    };
    fetchWorkspaces();
  }, [isSignedIn, getToken]); // Only runs once on sign-in

  // Switch to standard state, fetched from API
  const [boards, setBoards] = useState<Board[]>([]);

  // Fetch Boards from API
  useEffect(() => {
    const fetchBoards = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (token) {
          const fetchedBoards = await boardService.getAllBoards(token);
          setBoards(fetchedBoards);

          // Sync activeWorkspaceId if it's still 'w1' or default and we have real boards
          if (fetchedBoards.length > 0) {
            const firstBoardWorkspaceId = fetchedBoards[0].workspaceId;
            if (firstBoardWorkspaceId && (activeWorkspaceId === 'w1' || !activeWorkspaceId)) {
              setActiveWorkspaceId(firstBoardWorkspaceId);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch boards", error);
      }
    };
    fetchBoards();
  }, [isSignedIn, getToken, activeWorkspaceId]);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
    // Check if we have a saved board ID that actually exists in our (potentially loaded) boards
    const savedId = localStorage.getItem('app-active-board');
    return savedId;
  });

  const lastLoggedUpdate = React.useRef<string>('');
  const processingRef = React.useRef<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed');
    return saved ? saved === 'true' : false;
  });

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

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

  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', isSidebarCollapsed ? 'true' : 'false');
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('app-active-view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('app-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  // Boards persistence REMOVED (now handled by API)

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

  const logActivity = React.useCallback(async (type: string, content: string, metadata?: any, specificWorkspaceId?: string, specificBoardId?: string) => {
    try {
      const token = await getToken();
      if (token) {
        await fetch('http://localhost:3001/api/activities', {
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
      console.error("Failed to log activity", e);
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

        // Log activity
        const ws = workspaces.find(w => w.id === createdBoard.workspaceId);
        logActivity('BOARD_CREATED', `Created board: ${createdBoard.name}${ws ? ` in ${ws.name}` : ''}`, { boardId: createdBoard.id }, createdBoard.workspaceId, createdBoard.id);

        // Ensure activeWorkspaceId stays in sync if user was on a mock one
        if (createdBoard.workspaceId && activeWorkspaceId !== createdBoard.workspaceId) {
          setActiveWorkspaceId(createdBoard.workspaceId);
        }
      }
    } catch (e) {
      console.error("Failed to create board backend", e);
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
          { id: 'Done', label: 'Done', color: '#00c875' }
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
          console.log("App: Saving tasks for board", { boardId: newBoardId, taskCount: initialTasks.length, firstTask: initialTasks[0]?.name });
          localStorage.setItem(`room-items-v3-${newBoardId}`, JSON.stringify(initialTasks));
          localStorage.setItem(`board-tasks-${newBoardId}`, JSON.stringify(initialTasks));
        }

      } catch (e) {
        console.error('Failed to initialize template storage', e);
      }
    }

    const newBoard: Board = {
      id: newBoardId,
      name: name || 'New Board',
      workspaceId: activeWorkspaceId,
      columns: initialColumns,
      tasks: [],
      defaultView: defaultView,
      availableViews: [defaultView],
      icon: icon,
      parentId: parentId
    };
    handleBoardCreated(newBoard);
  };

  const handleNavigate = (view: ViewState | string, boardId?: string) => {
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
  };

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
      return [newItem, ...filtered].slice(0, 3); // Keep top 3 for the design
    });
  };

  const handleAddWorkspace = React.useCallback(async (name: string, icon: string, color?: string) => {
    try {
      const token = await getToken();
      if (token) {
        const response = await fetch('http://localhost:3001/api/workspaces', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, icon, color })
        });

        if (response.ok) {
          const newWorkspace = await response.json();
          setWorkspaces(prev => [...prev, newWorkspace]);
          setActiveWorkspaceId(newWorkspace.id);
        }
      }
    } catch (error) {
      console.error("Failed to add workspace", error);
    }
  }, [getToken]);

  const handleDeleteWorkspace = React.useCallback(async (id: string) => {
    if (workspaces.length <= 1) return; // Prevent deleting last workspace

    try {
      const token = await getToken();
      if (token) {
        const response = await fetch(`http://localhost:3001/api/workspaces/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setWorkspaces(prev => {
            const newWorkspaces = prev.filter(w => w.id !== id);
            if (activeWorkspaceId === id && newWorkspaces.length > 0) {
              setActiveWorkspaceId(newWorkspaces[0].id);
            }
            return newWorkspaces;
          });
          setBoards(prev => prev.filter(b => b.workspaceId !== id));
        }
      }
    } catch (error) {
      console.error("Failed to delete workspace", error);
    }
  }, [workspaces.length, activeWorkspaceId, getToken]);

  const handleDeleteBoard = React.useCallback(async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    if (window.confirm(`Delete board "${board.name}"?`)) {
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (activeBoardId === boardId) {
        setActiveBoardId(null);
        setActiveView('dashboard');
      }

      try {
        const token = await getToken();
        if (token) {
          await boardService.deleteBoard(token, boardId);
          const ws = workspaces.find(w => w.id === board.workspaceId);
          logActivity('BOARD_DELETED', `Deleted board: ${board.name}${ws ? ` from ${ws.name}` : ''}`, { boardId }, board.workspaceId);
        }
      } catch (e) {
        console.error("Failed to delete board backend", e);
      }
    }
  }, [activeBoardId, getToken, boards, workspaces, logActivity]);

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
    } catch (e) { console.error(e); }
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

  const SalesPage = lazyWithRetry(() => import('./features/business/sales/SalesPage'));
  const SalesListingPage = lazyWithRetry(() => import('./features/business/sales/SalesListingPage'));
  const SalesFactoryPage = lazyWithRetry(() => import('./features/business/sales/SalesFactoryPage'));
  const FinancePage = lazyWithRetry(() => import('./features/business/finance/FinancePage'));

  // New Department Pages
  const DashboardsPage = lazyWithRetry(() => import('./features/departments/DashboardsPage'));
  const PurchasesPage = lazyWithRetry(() => import('./features/departments/PurchasesPage'));
  const InventoryPage = lazyWithRetry(() => import('./features/departments/InventoryPage'));
  const ExpensesPage = lazyWithRetry(() => import('./features/departments/ExpensesPage'));
  const SuppliersPage = lazyWithRetry(() => import('./features/departments/SuppliersPage'));
  const CustomersPage = lazyWithRetry(() => import('./features/departments/CustomersPage'));
  const ReportsPage = lazyWithRetry(() => import('./features/departments/ReportsPage'));

  const LocalMarketplacePage = lazyWithRetry(() => import('./features/marketplace/LocalMarketplacePage'));
  const ForeignMarketplacePage = lazyWithRetry(() => import('./features/marketplace/ForeignMarketplacePage'));

  const ITPage = lazyWithRetry(() => import('./features/business_support/it/ITPage'));
  const HRPage = lazyWithRetry(() => import('./features/business_support/hr/HRPage'));
  const MarketingPage = lazyWithRetry(() => import('./features/business_support/marketing/MarketingPage'));
  const CornellNotesPage = lazyWithRetry(() => import('./features/tools/cornell/CornellNotesPage'));
  const SettingsPage = lazyWithRetry(() => import('./features/settings/SettingsPage'));

  const FullScreenLoader = () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleUpdateTasks = React.useCallback(async (tasks: any[]) => {
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
        console.error("Failed to update tasks backend", e);
      }
    }
  }, [activeBoardId, getToken, boards, workspaces, logActivity]);

  // Generic task creator that can be used from My Work
  const handleCreateTaskOnBoard = React.useCallback(async (boardId: string, task: any) => {
    let updatedTasks: any[] = [];
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
      console.error("Failed to create task backend", e);
    }
  }, [getToken, logActivity]);

  return (
    <div className="flex flex-col h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg font-sans text-[#323338] dark:text-monday-dark-text transition-colors duration-200">
      <TopBar onNavigate={handleNavigate} />
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
          boards={boards}
          onDeleteBoard={handleDeleteBoard}
          onToggleFavorite={handleToggleFavorite}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onAddBoard={(name, icon, template, defaultView, parentId) => handleQuickAddBoard(name, icon, template, defaultView as any, parentId)}
          pageVisibility={pageVisibility}
        />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#FCFCFD] dark:bg-monday-dark-bg z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.08)] ml-0.5`}>
          <React.Suspense fallback={<FullScreenLoader />}>
            {activeView === 'dashboard' ? (
              <Dashboard
                onBoardCreated={handleBoardCreated}
                recentlyVisited={recentlyVisited}
                onNavigate={handleNavigate}
                boards={boards}
                activeWorkspaceId={activeWorkspaceId}
                workspaces={workspaces}
                onTaskCreated={handleCreateTaskOnBoard}
              />
            ) : activeView === 'board' && activeBoard ? (
              <BoardView
                key={activeBoard.id}
                board={activeBoard}
                onUpdateBoard={handleUpdateBoard}
                onUpdateTasks={handleUpdateTasks}
              />
            ) : activeView === 'inbox' ? (
              <InboxView logActivity={logActivity} />
            ) : activeView === 'discussion' ? (
              <DiscussionPage
                groups={boards}
                onGroupCreated={handleBoardCreated}
                onGroupDeleted={handleDeleteBoard}
                logActivity={logActivity}
              />
            ) : activeView === 'my_work' ? (
              <MyWorkPage
                boards={boards}
                onNavigateToBoard={handleNavigate}
                onUpdateTasks={handleCreateTaskOnBoard}
                onAddBoard={handleBoardCreated}
              />
            ) : activeView === 'teams' ? (
              <TeamsPage />
            ) : activeView === 'vault' ? (
              <VaultView />
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
              <SalesFactoryPage onNavigate={handleNavigate} />
            ) : activeView === 'sales_listing' ? (
              <SalesListingPage onNavigate={handleNavigate} />
            ) : activeView === 'sales' ? (
              <SalesPage />
            ) : activeView === 'finance' ? (
              <FinancePage />
            ) : activeView === 'dashboards' ? (
              <DashboardsPage />
            ) : activeView === 'purchases' ? (
              <PurchasesPage />
            ) : activeView === 'inventory' ? (
              <InventoryPage />
            ) : activeView === 'expenses' ? (
              <ExpensesPage />
            ) : activeView === 'suppliers' ? (
              <SuppliersPage />
            ) : activeView === 'customers' ? (
              <CustomersPage />
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
            ) : activeView === 'marketing' ? (
              <MarketingPage />
            ) : activeView === 'cornell_notes' ? (
              <CornellNotesPage />
            ) : activeView === 'settings' ? (
              <SettingsPage visibility={pageVisibility} onVisibilityChange={setPageVisibility} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 font-light text-xl">
                {activeView === 'board' && !activeBoard && "No board selected"}
              </div>
            )}
          </React.Suspense>
        </main>
      </div>
      {/* <FocusWidget /> */}
    </div>
  );
};




import { SignUpPage } from './features/auth/SignUpPage';

const AppRoutes: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser();
  // View state: 'landing' | 'signin' | 'signup'
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F7F9FB]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        {authView === 'landing' && (
          <LandingPage onEnterSystem={() => setAuthView('signin')} />
        )}

        {authView === 'signin' && (
          <div className="flex h-screen w-full items-center justify-center bg-white flex-col gap-6">
            {/* Logo removed as per request */}
            <SignIn
              fallbackRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  footer: "hidden" // Hide default footer to use custom navigation
                }
              }}
            />
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setAuthView('signup')}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </button>
            </div>
            <button
              onClick={() => setAuthView('landing')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}

        {authView === 'signup' && (
          <SignUpPage onNavigateToLogin={() => setAuthView('signin')} />
        )}
      </SignedOut>
      <SignedIn>
        <AppContent />
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
            </FocusProvider>
          </NavigationProvider>
        </LanguageProvider>
      </UIProvider>
    </AppProvider>
  )
}

export default App;
