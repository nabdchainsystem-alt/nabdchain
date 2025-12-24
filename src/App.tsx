import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './features/dashboard/Dashboard';
import { BoardView } from './features/board/BoardView';
import { InboxView } from './features/inbox/InboxView';
import DiscussionPage from './features/discussion/DiscussionPage';
import { VaultView } from './features/vault/VaultView';
import FlowHubPage from './features/flowHub/FlowHubPage';
import ProcessMapPage from './features/flowHub/ProcessMapPage';
import { MyWorkPage } from './features/myWork/MyWorkPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { LandingPage } from './features/landing/LandingPage';
import { Board, Workspace, ViewState, BoardViewType, BoardColumn } from './types';
import { BoardTemplate } from './features/board/data/templates';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider } from './contexts/UIContext';
import { NavigationProvider } from './contexts/NavigationContext';
import TeamsPage from './features/teams/TeamsPage';
import { FocusProvider } from './contexts/FocusContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
// import { FocusWidget } from './components/features/focus/FocusWidget';

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

  const [activeView, setActiveView] = useState<ViewState | string>(() => {
    const saved = localStorage.getItem('app-active-view');
    return saved || 'dashboard';
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('app-workspaces');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = localStorage.getItem('app-boards');
    return saved ? JSON.parse(saved) : INITIAL_BOARDS;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('app-active-workspace') || INITIAL_WORKSPACES[0].id;
  });

  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
    // Check if we have a saved board ID that actually exists in our (potentially loaded) boards
    const savedId = localStorage.getItem('app-active-board');
    return savedId || INITIAL_BOARDS[0].id;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed');
    return saved ? saved === 'true' : false;
  });

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

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

  useEffect(() => {
    localStorage.setItem('app-boards', JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    localStorage.setItem('app-active-workspace', activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeBoardId) {
      localStorage.setItem('app-active-board', activeBoardId);
    }
  }, [activeBoardId]);

  const handleBoardCreated = (newBoard: Board) => {
    const boardWithWorkspace = { ...newBoard, workspaceId: activeWorkspaceId };
    setBoards([...boards, boardWithWorkspace]);
    setActiveBoardId(newBoard.id);
    setActiveView('board');
  };

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
    }
  };

  const handleAddWorkspace = (name: string, icon: string, color?: string) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name,
      icon,
      color: color || 'from-blue-400 to-indigo-500' // Default color if none provided
    };
    setWorkspaces([...workspaces, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return; // Prevent deleting last workspace
    const newWorkspaces = workspaces.filter(w => w.id !== id);
    setWorkspaces(newWorkspaces);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(newWorkspaces[0].id);
    }
    setBoards(boards.filter(b => b.workspaceId !== id));
  };

  const handleDeleteBoard = (id: string) => {
    const newBoards = boards.filter(b => b.id !== id);
    setBoards(newBoards);
    if (activeBoardId === id) {
      setActiveView('dashboard');
      setActiveBoardId(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setBoards(boards.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  };

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(boards.map(b => b.id === boardId ? { ...b, ...updates } : b));
  };

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

  const LocalMarketplacePage = lazyWithRetry(() => import('./features/marketplace/LocalMarketplacePage'));
  const ForeignMarketplacePage = lazyWithRetry(() => import('./features/marketplace/ForeignMarketplacePage'));

  const ITPage = lazyWithRetry(() => import('./features/business_support/it/ITPage'));
  const HRPage = lazyWithRetry(() => import('./features/business_support/hr/HRPage'));
  const MarketingPage = lazyWithRetry(() => import('./features/business_support/marketing/MarketingPage'));
  const CornellNotesPage = lazyWithRetry(() => import('./features/tools/cornell/CornellNotesPage'));

  const FullScreenLoader = () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#FCFCFD] dark:bg-monday-dark-bg font-sans text-[#323338] dark:text-monday-dark-text transition-colors duration-200">
      <TopBar />
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {![ 'sales_factory', 'sales_listing', 'sales' ].includes(activeView as string) && (
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
          />
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#FCFCFD] dark:bg-monday-dark-bg z-10 ${![ 'sales_factory', 'sales_listing', 'sales' ].includes(activeView as string) ? 'shadow-[-4px_0_24px_rgba(0,0,0,0.08)] ml-0.5' : ''}`}>
          <React.Suspense fallback={<FullScreenLoader />}>
            {activeView === 'dashboard' ? (
              <Dashboard onBoardCreated={handleBoardCreated} />
            ) : activeView === 'board' && activeBoard ? (
              <BoardView key={activeBoard.id} board={activeBoard} onUpdateBoard={handleUpdateBoard} />
            ) : activeView === 'inbox' ? (
              <InboxView />
            ) : activeView === 'discussion' ? (
              <DiscussionPage />
            ) : activeView === 'my_work' ? (
              <MyWorkPage boards={boards} onNavigateToBoard={handleNavigate} />
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



const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasEnteredSystem, setHasEnteredSystem] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F7F9FB]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated and hasn't clicked "Enter System" -> Show Landing Page
  if (!isAuthenticated && !hasEnteredSystem) {
    return <LandingPage onEnterSystem={() => setHasEnteredSystem(true)} />;
  }

  // Not authenticated but clicked "Enter System" -> Show Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated -> Show Main App
  return <AppContent />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <UIProvider>
          <LanguageProvider>
            <NavigationProvider>
              <FocusProvider>
                <AppRoutes />
              </FocusProvider>
            </NavigationProvider>
          </LanguageProvider>
        </UIProvider>
      </AppProvider>
    </AuthProvider>
  )
}

export default App;
