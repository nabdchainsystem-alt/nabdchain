import React, { useState, useEffect, Suspense, memo, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, useUser, useAuth } from './auth-adapter';
import { Board, Workspace, ViewState, BoardViewType, BoardColumn, RecentlyVisitedItem, Task } from './types';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { FocusProvider } from './contexts/FocusContext';
import { AIProvider, useAI } from './contexts/AIContext';
import { SocketProvider } from './contexts/SocketContext';
import { RedirectToSignIn } from './auth-adapter';
import { boardService } from './services/boardService';
import { cleanupBoardStorage, cleanupWorkspaceBoardsStorage, getStorageItem, getStorageString, setStorageItem, setStorageString } from './utils/storage';
import { appLogger, boardLogger } from './utils/logger';
import { FeatureErrorBoundary } from './components/common/FeatureErrorBoundary';
import { API_URL } from './config/api';
import { adminService } from './services/adminService';
import { useUserPreferences } from './hooks/useUserPreferences';
import { MorphingLoader } from './components/common/MorphingLoader';

// Toast Provider (must be regular import - it's a wrapper)
import { ToastProvider } from './features/marketplace/components/Toast';

// Board Templates - Type import (not a component)
import type { BoardTemplate } from './features/board/data/templates';

// ============================================================================
// LAZY LOADED COMPONENTS - Imported from centralized route config
// ============================================================================
import {
  // Core Layout
  Sidebar,
  TopBar,
  // Auth & Landing
  LandingPage,
  AcceptInvitePage,
  SignUpPage,
  SignInPage,
  // Portal
  PortalMarketplacePage,
  // Mobile
  MobileApp,
  // Speed Insights
  SpeedInsights,
  // Core Features
  Dashboard,
  BoardView,
  InboxView,
  VaultView,
  MyWorkPage,
  TeamsPage,
  TalkPage,
  TestPage,
  ArcadePage,
  LiveSessionPage,
  // Supply Chain
  ProcurementPage,
  WarehousePage,
  ShippingPage,
  FleetPage,
  VendorsPage,
  PlanningPage,
  // Operations
  MaintenancePage,
  ProductionPage,
  QualityPage,
  // Business
  BusinessSalesPage,
  FinancePage,
  // Mini Company
  DashboardsPage,
  ReportsPage,
  SalesPage,
  PurchasesPage,
  InventoryPage,
  ExpensesPage,
  CustomersPage,
  SuppliersPage,
  // Marketplace
  LocalMarketplacePage,
  ForeignMarketplacePage,
  MarketplacePage,
  // Business Support
  ITPage,
  HRPage,
  MarketingPage,
  // Tools & Settings
  CornellNotesPage,
  QuickNotesPage,
  SettingsPage,
  // Preload function
  preloadCriticalRoutes,
} from './config/routes';

// Delayed loading spinner - only shows after 150ms to prevent flash on fast loads
const DelayedSpinner = memo(({ delay = 150, size = 6 }: { delay?: number; size?: number }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className={`w-${size} h-${size} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}
      style={{ width: size * 4, height: size * 4 }} />
  );
});
DelayedSpinner.displayName = 'DelayedSpinner';

// Minimal loading spinner for Suspense - delayed to prevent flash
const LoadingSpinner = memo(() => (
  <div className="h-full w-full flex items-center justify-center">
    <DelayedSpinner size={6} />
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Full page loading state - delayed to prevent flash
const PageLoadingFallback = memo(() => (
  <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <DelayedSpinner size={8} delay={100} />
  </div>
));
PageLoadingFallback.displayName = 'PageLoadingFallback';

// Sidebar wrapper that isolates collapse state to prevent parent re-renders
interface SidebarWrapperProps {
  activeView: ViewState | string;
  activeBoardId: string | null;
  onNavigate: (view: string, boardId?: string, skipHistoryPush?: boolean, searchQuery?: string) => void;
  width: number;
  onResize: (width: number) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceChange: (id: string) => void;
  onAddWorkspace: (name: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  boards: Board[];
  onDeleteBoard: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddBoard: (name: string, icon: string, template: string, defaultView: string, parentId?: string) => void;
  pageVisibility: Record<string, boolean>;
}

const SidebarWrapper = memo<SidebarWrapperProps>((props) => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUI();

  return (
    <Suspense fallback={<div className="w-[240px] bg-gray-50 dark:bg-gray-900" />}>
      <Sidebar
        {...props}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev: boolean) => !prev)}
      />
    </Suspense>
  );
});
SidebarWrapper.displayName = 'SidebarWrapper';

const AppContent: React.FC = () => {
  // --- Persistent State Initialization ---

  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { updateUserDisplayName } = useAppContext();

  // Track if workspaces have been loaded from API (needed to prevent board fetch race condition)
  const [isWorkspacesLoaded, setIsWorkspacesLoaded] = useState(false);

  // Track previous sign-in state to detect sign-out
  const wasSignedInRef = React.useRef(isSignedIn);

  // CRITICAL FIX: Clear ALL cached data on fresh sign-in or user switch
  // This ensures data is always fetched fresh from server, preventing cross-device sync issues
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const lastUserId = sessionStorage.getItem('app-last-user-id');
      const currentUserId = user.id;

      // If this is a different user OR a fresh session (no lastUserId), clear ALL cached data
      if (!lastUserId || lastUserId !== currentUserId) {
        appLogger.info('[App] Fresh sign-in detected, clearing ALL cached data', {
          lastUserId,
          currentUserId,
          isFreshSession: !lastUserId
        });

        // Clear ALL user-specific data to force fresh fetch from server
        const keysToReset = [
          'app-active-view',
          'app-active-board',
          'app-recently-visited',
          'app-workspaces',      // Clear cached workspaces
          'app-boards',          // Clear cached boards
          'app-deleted-boards',
          'app-unsynced-boards',
        ];

        keysToReset.forEach(key => localStorage.removeItem(key));

        // Clear board-specific data
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.startsWith('room-') || key.startsWith('board-')) {
            localStorage.removeItem(key);
          }
        });

        appLogger.info('[App] Cleared all cached data for fresh session - will fetch from server');

        // Mark this session with the current user
        sessionStorage.setItem('app-last-user-id', currentUserId);
      }
      wasSignedInRef.current = true;
    }
  }, [isSignedIn, user?.id]);

  // CRITICAL FIX: Clear ALL user data on sign-out (for Clerk auth)
  // This ensures next login starts fresh without cached data
  useEffect(() => {
    if (wasSignedInRef.current && !isSignedIn) {
      appLogger.info('[App] Sign-out detected, clearing user data');

      // Clear all user-specific localStorage data
      const keysToRemove = [
        'app-active-workspace',
        'app-active-board',
        'app-active-view',
        'app-workspaces',
        'app-boards',
        'app-recently-visited',
        'app-page-visibility',
        'app-deleted-boards',
        'app-unsynced-boards',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear board-specific data
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('room-') || key.startsWith('board-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear session storage
      sessionStorage.removeItem('app-last-user-id');

      wasSignedInRef.current = false;
    }
  }, [isSignedIn]);

  // Sync user preferences (display name, etc.) with the server
  // This hook handles fetching from server on login and syncing changes back
  useUserPreferences();

  // Preload critical routes after initial render
  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

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
    // On root URL ('/'), check localStorage but don't restore 'board' view
    // because there's no board ID in the URL - go to dashboard instead
    const saved = getStorageString('app-active-view', '');
    if (saved === 'board') {
      return 'dashboard';
    }
    return saved || 'dashboard';
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    getStorageItem<Workspace[]>('app-workspaces', [])
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() =>
    getStorageString('app-active-workspace', '')
  );

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
            // Mark workspaces as loaded so boards can fetch
            setIsWorkspacesLoaded(true);
          } else {
            appLogger.error('[App] Failed to fetch workspaces. Status:', response.status);
            // Fallback to local storage if API fails - still mark as loaded to unblock boards
            setIsWorkspacesLoaded(true);
          }
        } else {
          // Fallback to local storage if no token (already loaded in initial state)
          // Check if we need to set activeWorkspaceId from local data
          if (workspaces.length > 0 && !activeWorkspaceId) {
            setActiveWorkspaceId(workspaces[0].id);
          }
          // Still mark as loaded even without token
          setIsWorkspacesLoaded(true);
        }
      } catch (error) {
        appLogger.error("Failed to fetch workspaces", error);
        // Still mark as loaded on error to prevent infinite blocking
        setIsWorkspacesLoaded(true);
      }
    };
    fetchWorkspaces();
  }, [isSignedIn, getToken]); // Only runs once on sign-in

  // Switch to standard state, fetched from API OR local storage
  const [boards, setBoards] = useState<Board[]>(() =>
    getStorageItem<Board[]>('app-boards', [])
  );

  // Track if we're still loading boards from API
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);

  // Track boards that haven't been synced to server yet
  const [unsyncedBoardIds, setUnsyncedBoardIds] = useState<Set<string>>(() =>
    new Set(getStorageItem<string[]>('app-unsynced-boards', []))
  );

  // Track boards that have been deleted locally but might still be on server
  const [deletedBoardIds, setDeletedBoardIds] = useState<Set<string>>(() =>
    new Set(getStorageItem<string[]>('app-deleted-boards', []))
  );

  // Track visited department pages for lazy keep-alive (only mount once visited)
  const [visitedDeptPages, setVisitedDeptPages] = useState<Set<string>>(() => new Set());

  // Marketplace params
  const [marketplaceInitialSearch, setMarketplaceInitialSearch] = useState('');

  // Startup cleanup: Remove deleted boards AND orphaned boards from localStorage
  useEffect(() => {
    const savedBoards = localStorage.getItem('app-boards');
    const savedDeleted = localStorage.getItem('app-deleted-boards');
    const savedWorkspaces = localStorage.getItem('app-workspaces');

    try {
      const boardsArray: Board[] = savedBoards ? JSON.parse(savedBoards) : [];
      const deletedSet = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();
      const workspacesArray = savedWorkspaces ? JSON.parse(savedWorkspaces) : [];
      const workspaceIds = new Set(workspacesArray.map((w: Workspace) => w.id));

      // Filter out:
      // 1. Boards that are in deletedBoardIds
      // 2. Boards that belong to non-existent workspaces (orphaned)
      const cleanedBoards = boardsArray.filter(b => {
        if (deletedSet.has(b.id)) {
          boardLogger.info('[Startup Cleanup] Removing deleted board:', b.id, b.name);
          return false;
        }
        // If board has a workspaceId but that workspace doesn't exist, it's orphaned
        if (b.workspaceId && !workspaceIds.has(b.workspaceId)) {
          boardLogger.info('[Startup Cleanup] Removing orphaned board (workspace deleted):', b.id, b.name, 'workspaceId:', b.workspaceId);
          cleanupBoardStorage(b.id);
          return false;
        }
        return true;
      });

      if (cleanedBoards.length !== boardsArray.length) {
        boardLogger.info('[Startup Cleanup] Cleaned boards:', {
          before: boardsArray.length,
          after: cleanedBoards.length,
          removed: boardsArray.length - cleanedBoards.length
        });
        localStorage.setItem('app-boards', JSON.stringify(cleanedBoards));
        setBoards(cleanedBoards);

        // Clean up board data for removed boards
        const removedIds = boardsArray
          .filter(b => deletedSet.has(b.id) || (b.workspaceId && !workspaceIds.has(b.workspaceId)))
          .map(b => b.id);
        removedIds.forEach(id => cleanupBoardStorage(id));
      }

      // Also clear deletedBoardIds for boards that no longer exist
      if (deletedSet.size > 0) {
        const existingBoardIds = new Set(cleanedBoards.map(b => b.id));
        const updatedDeleted = Array.from(deletedSet).filter(id => !existingBoardIds.has(id as string));
        if (updatedDeleted.length !== deletedSet.size) {
          localStorage.setItem('app-deleted-boards', JSON.stringify(updatedDeleted));
        }
      }
    } catch (e) {
      boardLogger.error('[Startup Cleanup] Failed to clean localStorage:', e);
    }
  }, []); // Run once on mount

  // Persist deleted boards
  useEffect(() => {
    localStorage.setItem('app-deleted-boards', JSON.stringify(Array.from(deletedBoardIds)));
  }, [deletedBoardIds]);

  // Persist unsynced boards
  useEffect(() => {
    localStorage.setItem('app-unsynced-boards', JSON.stringify(Array.from(unsyncedBoardIds)));
  }, [unsyncedBoardIds]);

  // Fetch Boards from API
  // CRITICAL FIX: Wait for workspaces to be loaded before fetching boards
  // This prevents race condition where boards fetch with empty/wrong workspace ID
  useEffect(() => {
    const fetchBoards = async () => {
      if (!isSignedIn) {
        setIsBoardsLoading(false);
        return;
      }
      // Wait for workspaces to be loaded to prevent race condition
      if (!isWorkspacesLoaded) {
        boardLogger.info('[Boards Fetch] Waiting for workspaces to load...');
        return;
      }
      try {
        const token = await getToken();
        if (token) {
          // CRITICAL FIX: If we're on a board URL, first check if the board belongs to the current workspace
          // If not, switch to the board's workspace before fetching all boards
          let workspaceIdToUse = activeWorkspaceId;
          const path = window.location.pathname;
          if (path.startsWith('/board/')) {
            const boardIdFromPath = path.split('/board/')[1]?.split('/')[0];
            if (boardIdFromPath) {
              // Fetch the specific board to check its workspace
              const targetBoard = await boardService.getBoard(token, boardIdFromPath);
              if (targetBoard && targetBoard.workspaceId && targetBoard.workspaceId !== activeWorkspaceId) {
                boardLogger.info('[Boards Fetch] Board belongs to different workspace, switching:', {
                  boardId: boardIdFromPath,
                  boardWorkspaceId: targetBoard.workspaceId,
                  currentWorkspaceId: activeWorkspaceId
                });
                workspaceIdToUse = targetBoard.workspaceId;
                setActiveWorkspaceId(targetBoard.workspaceId);
              }
            }
          }

          const fetchedBoards = await boardService.getAllBoards(token, workspaceIdToUse);

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
            const orphanedBoardIds: string[] = [];

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
                } else if (!isUnsynced && !isDeleted) {
                  // This board is orphaned (not on server, not unsynced, not explicitly deleted)
                  // Clean up its localStorage data
                  orphanedBoardIds.push(localBoard.id);
                }
              }
            });

            // Clean up orphaned boards' localStorage data
            if (orphanedBoardIds.length > 0) {
              boardLogger.info('[Boards Merge] Cleaning up orphaned boards:', orphanedBoardIds);
              orphanedBoardIds.forEach(id => cleanupBoardStorage(id));
            }

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
  }, [isSignedIn, getToken, activeWorkspaceId, isWorkspacesLoaded]);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
    // Only restore board ID if URL is a board URL
    // Don't restore from localStorage if on a different page (e.g. /dashboard)
    // This prevents stale board IDs from causing URL mismatches
    const path = window.location.pathname;
    if (path.startsWith('/board/')) {
      const boardIdFromPath = path.split('/board/')[1]?.split('/')[0];
      if (boardIdFromPath) return boardIdFromPath;
      // Fallback to localStorage only if on a board URL but ID missing from path
      const savedId = localStorage.getItem('app-active-board');
      return savedId;
    }
    return null;
  });

  const lastLoggedUpdate = React.useRef<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = getStorageString('app-sidebar-width', '260');
    return parseInt(saved, 10) || 260;
  });
  // isSidebarCollapsed state moved to UIContext

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // Sync workspace when viewing a board that belongs to a different workspace
  useEffect(() => {
    if (activeView === 'board' && activeBoard?.workspaceId && activeBoard.workspaceId !== activeWorkspaceId) {
      boardLogger.info('[Workspace Sync] Syncing workspace to match active board:', {
        boardId: activeBoard.id,
        boardWorkspaceId: activeBoard.workspaceId,
        currentWorkspaceId: activeWorkspaceId
      });
      setActiveWorkspaceId(activeBoard.workspaceId);
    }
  }, [activeView, activeBoard?.id, activeBoard?.workspaceId, activeWorkspaceId]);

  // Filter boards by active workspace - this ensures components only see relevant data
  const workspaceBoards = React.useMemo(() => {
    if (!activeWorkspaceId) return boards;
    return boards.filter(b => b.workspaceId === activeWorkspaceId);
  }, [boards, activeWorkspaceId]);

  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>(() =>
    getStorageItem<Record<string, boolean>>('app-page-visibility', {})
  );

  // Admin and Feature Flags state
  const [isAdmin, setIsAdmin] = useState(false);
  const [serverFeatureFlags, setServerFeatureFlags] = useState<Record<string, boolean>>({});
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState(false);

  // Fetch admin status and user-specific visibility
  const fetchAdminData = React.useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch admin status first
      let adminStatus = await adminService.getAdminStatus(token);

      // If not admin, try to bootstrap (only works if no admins exist yet)
      if (!adminStatus.isAdmin) {
        try {
          await adminService.bootstrap(token);
          // Re-fetch admin status after successful bootstrap
          adminStatus = await adminService.getAdminStatus(token);
          appLogger.info('[App] Bootstrap successful - user is now admin');
        } catch {
          // Bootstrap failed (admin already exists) - this is expected for most users
        }
      }

      setIsAdmin(adminStatus.isAdmin);

      // Fetch user's effective visibility
      const visibility = await adminService.getMyVisibility(token);

      // Server returns merged visibility (global + user-specific overrides)
      setServerFeatureFlags(visibility);
      setIsPermissionsLoaded(true);

      appLogger.info('[App] Admin status:', adminStatus.isAdmin, 'Visibility loaded:', Object.keys(visibility).length);
    } catch (error) {
      appLogger.error('Failed to fetch admin data:', error);
      setIsPermissionsLoaded(true); // Still mark as loaded to avoid infinite loading
    }
  }, [isSignedIn, getToken]);

  // Fetch admin data on mount
  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Normalize server flags from "page_xxx" to "xxx" format (for Sidebar and Settings)
  const normalizedServerFlags = React.useMemo(() => {
    const normalized: Record<string, boolean> = {};
    for (const [key, enabled] of Object.entries(serverFeatureFlags)) {
      const normalizedKey = key.startsWith('page_') ? key.replace('page_', '') : key;
      normalized[normalizedKey] = Boolean(enabled);
    }
    return normalized;
  }, [serverFeatureFlags]);

  // All known page keys that can be toggled in the sidebar
  const ALL_PAGE_KEYS = [
    'inbox', 'teams', 'test_tools', 'mini_company',
    'sales', 'purchases', 'inventory', 'expenses', 'customers', 'suppliers',
    'supply_chain', 'procurement', 'warehouse', 'fleet', 'vendors', 'planning',
    'operations', 'maintenance', 'production', 'quality',
    'business', 'sales_listing', 'sales_factory',
    'business_support', 'it_support', 'hr', 'marketing',
    'local_marketplace', 'foreign_marketplace'
  ];

  // Combine server feature flags with local visibility
  // Logic: Server can DISABLE pages (admin control), but user can also hide pages they don't want
  const effectivePageVisibility = React.useMemo(() => {
    // Wait for permissions to load before showing any pages (prevents flash)
    if (!isPermissionsLoaded && !isAdmin) {
      // Return ALL known pages hidden until permissions load
      const hidden: Record<string, boolean> = {};
      for (const key of ALL_PAGE_KEYS) {
        hidden[key] = false;
      }
      return hidden;
    }

    // Build combined visibility:
    // - If server disables a page (false), it's hidden (admin control)
    // - If user disables a page (false), it's hidden (personal preference)
    // - Page only shows if BOTH server allows AND user wants it
    const combined: Record<string, boolean> = {};

    // Get all unique keys from both sources
    const allKeys = new Set([
      ...Object.keys(pageVisibility),
      ...Object.keys(normalizedServerFlags)
    ]);

    for (const key of allKeys) {
      const serverAllows = normalizedServerFlags[key] !== false; // undefined = allowed
      const userWants = pageVisibility[key] !== false; // undefined = wants to see

      // Page is visible only if server allows AND user wants it
      combined[key] = serverAllows && userWants;
    }

    return combined;
  }, [pageVisibility, normalizedServerFlags, isAdmin, isPermissionsLoaded]);

  const [recentlyVisited, setRecentlyVisited] = useState<RecentlyVisitedItem[]>(() =>
    getStorageItem<RecentlyVisitedItem[]>('app-recently-visited', [])
  );

  // --- Persistence Effects ---

  useEffect(() => {
    setStorageString('app-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Sidebar persistence handled in UIContext

  useEffect(() => {
    setStorageString('app-active-view', activeView);
  }, [activeView]);

  // Set AI page context when view changes
  const { setCurrentPageContext } = useAI();
  useEffect(() => {
    // Define department pages that should provide context to AI
    const departmentPages = ['sales', 'purchases', 'inventory', 'expenses', 'customers', 'suppliers', 'procurement', 'warehouse', 'shipping', 'fleet', 'vendors', 'planning', 'maintenance', 'production', 'quality', 'hr', 'it_support', 'marketing', 'finance'];

    // Only set context for department pages and board views
    if (activeView === 'board' && activeBoard) {
      setCurrentPageContext({
        view: 'board',
        boardId: activeBoard.id,
        boardName: activeBoard.name,
      });
    } else if (departmentPages.includes(activeView)) {
      setCurrentPageContext({
        view: activeView,
        department: activeView,
      });
    } else {
      // Clear context for non-relevant pages (home, vault, etc.)
      setCurrentPageContext(null);
    }
  }, [activeView, activeBoard?.id, activeBoard?.name, setCurrentPageContext]);

  // Track visited department pages for lazy keep-alive
  const DEPT_PAGES = ['sales', 'purchases', 'inventory', 'expenses', 'customers', 'suppliers'];
  useEffect(() => {
    if (DEPT_PAGES.includes(activeView)) {
      setVisitedDeptPages(prev => {
        if (prev.has(activeView)) return prev;
        return new Set([...prev, activeView]);
      });
    }
  }, [activeView]);

  useEffect(() => {
    setStorageItem('app-workspaces', workspaces);
  }, [workspaces]);

  // Boards persistence - immediate for additions/deletions, short debounce for modifications
  const prevBoardsLengthRef = React.useRef(boards.length);
  useEffect(() => {
    const currentLength = boards.length;
    const prevLength = prevBoardsLengthRef.current;
    prevBoardsLengthRef.current = currentLength;

    // Immediate update for additions or deletions (count changed)
    // This prevents boards from disappearing on quick navigation
    if (currentLength !== prevLength) {
      setStorageItem('app-boards', boards);
      boardLogger.info('[Boards Persistence] Immediate save after count change', {
        before: prevLength,
        after: currentLength,
        action: currentLength > prevLength ? 'addition' : 'deletion'
      });
      return;
    }

    // Very short debounce (50ms) for modifications only - prevents rapid writes
    const timeoutId = setTimeout(() => {
      setStorageItem('app-boards', boards);
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [boards]);

  // Save boards before page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      setStorageItem('app-boards', boards);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [boards]);

  useEffect(() => {
    setStorageString('app-active-workspace', activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeBoardId) {
      setStorageString('app-active-board', activeBoardId);
    }
  }, [activeBoardId]);

  useEffect(() => {
    setStorageItem('app-page-visibility', pageVisibility);
  }, [pageVisibility]);

  useEffect(() => {
    setStorageItem('app-recently-visited', recentlyVisited);
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

  const handleQuickAddBoard = (name: string, icon?: string, template?: BoardTemplate, defaultView: BoardViewType = 'table', parentId?: string, nameDirection?: 'rtl' | 'ltr' | 'auto') => {
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

        // Save status groups - Use standard defaults (10% darker)
        const defaultGroups = [
          { id: 'To Do', label: 'To Do', color: '#aeaeae' },
          { id: 'In Progress', label: 'In Progress', color: '#e59935' },
          { id: 'Stuck', label: 'Stuck', color: '#cb3d52' },
          { id: 'Done', label: 'Done', color: '#00b369' },
          { id: 'Rejected', label: 'Rejected', color: '#2d2d2d' }
        ];
        // If template has specific groups use them, otherwise use defaults
        const statusGroups = (template.groups && template.groups.length > 1) ? template.groups.map(g => ({
          id: g.id,
          label: g.title,
          color: g.color || '#aeaeae'
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
      parentId: parentId,
      nameDirection: nameDirection
    };

    // Mark as unsynced immediately
    setUnsyncedBoardIds(prev => new Set(prev).add(newBoardId));

    handleBoardCreated(newBoard);
  };

  // Handler for Dashboard's "New Board" workspace selection
  const handleRequestNewBoard = React.useCallback((workspaceId: string) => {
    // Switch to the selected workspace
    setActiveWorkspaceId(workspaceId);
    // Dispatch event to open the Sidebar's board creation modal
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-new-board-modal'));
    }, 100); // Small delay to ensure workspace switch is processed
  }, []);

  const handleNavigate = React.useCallback((view: ViewState | string, boardId?: string, skipHistoryPush?: boolean, searchQuery?: string) => {
    setActiveView(view);
    if (searchQuery !== undefined) {
      setMarketplaceInitialSearch(searchQuery);
    } else if (view !== 'local_marketplace') {
      // Clear search if navigating elsewhere (optional, but keeps it clean)
      setMarketplaceInitialSearch('');
    }

    if (boardId) {
      setActiveBoardId(boardId);
      const board = boards.find(b => b.id === boardId);
      if (board) {
        // Sync active workspace if board belongs to a different one
        if (board.workspaceId && board.workspaceId !== activeWorkspaceId) {
          setActiveWorkspaceId(board.workspaceId);
        }
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
  }, [boards, activeWorkspaceId]);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view, boardId } = event.state;
        // Directly set state to avoid triggering another history push
        setActiveView(view || 'dashboard');
        if (boardId) setActiveBoardId(boardId);
      } else {
        // No history state - read from URL instead of defaulting to dashboard
        // This handles Chrome's behavior where history.state can be null after refresh
        const path = window.location.pathname;
        if (path.startsWith('/board/')) {
          const boardIdFromPath = path.split('/board/')[1]?.split('/')[0];
          setActiveView('board');
          if (boardIdFromPath) setActiveBoardId(boardIdFromPath);
        } else if (path !== '/' && path.length > 1) {
          const viewFromPath = path.substring(1).split('/')[0];
          if (viewFromPath) {
            setActiveView(viewFromPath);
          } else {
            setActiveView('dashboard');
          }
        } else {
          setActiveView('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize browser history state on mount
  // Preserve the current URL path - don't override with stale localStorage values
  useEffect(() => {
    const currentPath = window.location.pathname;
    window.history.replaceState({ view: activeView, boardId: activeBoardId }, '', currentPath);
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
      title: board ? board.name : view.toLowerCase().replace(/ /g, '_'),
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

  const handleAddWorkspace = React.useCallback(async (name: string, icon: string, color?: string, nameDirection?: 'rtl' | 'ltr' | 'auto') => {
    // Optimistic Update
    const tempId = `ws-${Date.now()}`;
    const newWorkspaceOptimistic: Workspace = {
      id: tempId,
      name,
      icon: icon as any,
      color: color || 'from-gray-400 to-gray-500',
      nameDirection: nameDirection,
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
          body: JSON.stringify({ name, icon, color, nameDirection })
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

  const handleRenameWorkspace = React.useCallback(async (id: string, newName: string, newIcon: string, newColor?: string, nameDirection?: 'rtl' | 'ltr' | 'auto') => {
    // Optimistic Update
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: newName, icon: newIcon as any, color: newColor || w.color, nameDirection: nameDirection } : w));

    try {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${API_URL}/workspaces/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: newName, icon: newIcon, color: newColor, nameDirection })
        });

        if (!response.ok) {
          appLogger.error("Failed to rename workspace backend");
        }
      }
    } catch (error) {
      appLogger.error("Failed to rename workspace", error);
    }
  }, [getToken]);

  const handleDeleteWorkspace = React.useCallback(async (id: string) => {
    if (workspaces.length <= 1) return; // Prevent deleting last workspace

    // Get boards to delete for localStorage cleanup
    const boardsToDelete = boards.filter(b => b.workspaceId === id);
    const boardIdsToDelete = boardsToDelete.map(b => b.id);
    const remainingBoards = boards.filter(b => b.workspaceId !== id);

    boardLogger.info('[Delete Workspace] Deleting workspace and boards:', {
      workspaceId: id,
      boardCount: boardIdsToDelete.length,
      boardIds: boardIdsToDelete
    });

    // Optimistic Update
    const workspaceToDelete = workspaces.find(w => w.id === id);
    const newWorkspaces = workspaces.filter(w => w.id !== id);

    setWorkspaces(newWorkspaces);
    if (activeWorkspaceId === id && newWorkspaces.length > 0) {
      setActiveWorkspaceId(newWorkspaces[0].id);
    }
    setBoards(remainingBoards);

    // CRITICAL: Immediately update ALL localStorage to prevent resurrection
    localStorage.setItem('app-boards', JSON.stringify(remainingBoards));
    localStorage.setItem('app-workspaces', JSON.stringify(newWorkspaces));

    // Mark boards as deleted and persist immediately
    const currentDeleted = localStorage.getItem('app-deleted-boards');
    const deletedSet = currentDeleted ? new Set(JSON.parse(currentDeleted)) : new Set();
    boardIdsToDelete.forEach(boardId => deletedSet.add(boardId));
    localStorage.setItem('app-deleted-boards', JSON.stringify(Array.from(deletedSet)));

    // Remove from unsynced
    const currentUnsynced = localStorage.getItem('app-unsynced-boards');
    if (currentUnsynced) {
      const unsyncedSet = new Set(JSON.parse(currentUnsynced));
      boardIdsToDelete.forEach(boardId => unsyncedSet.delete(boardId));
      localStorage.setItem('app-unsynced-boards', JSON.stringify(Array.from(unsyncedSet)));
    }

    // Clean up localStorage for all boards in this workspace
    cleanupWorkspaceBoardsStorage(boardIdsToDelete);

    // Update state for deleted boards
    setDeletedBoardIds(prev => {
      const next = new Set(prev);
      boardIdsToDelete.forEach(boardId => next.add(boardId));
      return next;
    });

    setUnsyncedBoardIds(prev => {
      const next = new Set(prev);
      boardIdsToDelete.forEach(boardId => next.delete(boardId));
      return next;
    });

    boardLogger.info('[Delete Workspace] localStorage updated immediately');

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
            setBoards(prev => [...prev, ...boardsToDelete]);
            localStorage.setItem('app-boards', JSON.stringify([...remainingBoards, ...boardsToDelete]));
            localStorage.setItem('app-workspaces', JSON.stringify([...newWorkspaces, workspaceToDelete]));
          }
        } else {
          boardLogger.info('[Delete Workspace] Backend delete successful');
          // Backend succeeded, clean up deletedBoardIds
          setDeletedBoardIds(prev => {
            const next = new Set(prev);
            boardIdsToDelete.forEach(boardId => next.delete(boardId));
            return next;
          });
          // Update localStorage for deleted boards
          const updatedDeleted = localStorage.getItem('app-deleted-boards');
          if (updatedDeleted) {
            const set = new Set(JSON.parse(updatedDeleted));
            boardIdsToDelete.forEach(boardId => set.delete(boardId));
            localStorage.setItem('app-deleted-boards', JSON.stringify(Array.from(set)));
          }
        }
      }
    } catch (error) {
      appLogger.error("Failed to delete workspace", error);
    }
  }, [workspaces, boards, activeWorkspaceId, getToken]);

  const handleDeleteBoard = React.useCallback(async (boardId: string, deleteMode: 'single' | 'recursive' = 'single') => {
    const board = boards.find(b => b.id === boardId);
    if (!board) {
      boardLogger.info('[Delete Board] Board not found in local state:', boardId);
      return;
    }

    boardLogger.info('[Delete Board] Attempting to delete:', { boardId, boardName: board.name, deleteMode });

    // Identify all boards involved (recursive finding of descendants)
    const getDescendants = (id: string, allBoards: Board[]): string[] => {
      const directChildren = allBoards.filter(b => b.parentId === id);
      let descendants = directChildren.map(c => c.id);
      directChildren.forEach(child => {
        descendants = [...descendants, ...getDescendants(child.id, allBoards)];
      });
      return descendants;
    };

    const descendants = getDescendants(boardId, boards);
    const boardsToDeleteIds = deleteMode === 'recursive' ? [boardId, ...descendants] : [boardId];

    boardLogger.info('[Delete Board] Strategy:', {
      mode: deleteMode,
      targetId: boardId,
      descendantsFound: descendants.length,
      totalToDelete: boardsToDeleteIds.length,
      ids: boardsToDeleteIds
    });

    // If 'single' mode, sub-boards need reparenting.
    // We'll move them to the deleted board's parent (or root if null).
    const newParentId = board.parentId || undefined;

    // Optimistic Update
    let newBoards = boards.filter(b => !boardsToDeleteIds.includes(b.id));

    if (deleteMode === 'single') {
      // Reparent direct children
      newBoards = newBoards.map(b => {
        if (b.parentId === boardId) {
          return { ...b, parentId: newParentId };
        }
        return b;
      });
    }

    setBoards(newBoards);

    // Update LocalStorage Persistence
    localStorage.setItem('app-boards', JSON.stringify(newBoards));

    // Cleanup Unsynced & Deleted sets
    setUnsyncedBoardIds(prev => {
      const next = new Set(prev);
      boardsToDeleteIds.forEach(id => next.delete(id));
      return next;
    });

    setDeletedBoardIds(prev => {
      const next = new Set(prev);
      boardsToDeleteIds.forEach(id => next.add(id));
      return next;
    });

    const deletedSetArr = [...(JSON.parse(localStorage.getItem('app-deleted-boards') || '[]')), ...boardsToDeleteIds];
    localStorage.setItem('app-deleted-boards', JSON.stringify([...new Set(deletedSetArr)]));

    // Cleanup local storage for deleted boards
    boardsToDeleteIds.forEach(id => cleanupBoardStorage(id));


    if (activeBoardId && boardsToDeleteIds.includes(activeBoardId)) {
      setActiveBoardId(null);
      setActiveView('dashboard');
    }

    // Backend Sync
    try {
      const token = await getToken();
      if (token) {
        if (deleteMode === 'recursive') {
          // If recursive, backend might support recursive delete or we delete one by one.
          // Assuming backend deletes children automatically or we loop.
          // Safest to delete all in loop or Promise.all, order matters (children then parent usually, or parent cascades).
          // If backend has cascade delete on FK, deleting parent is enough.
          // Let's safe bet: call delete for all.
          await Promise.all(boardsToDeleteIds.map(id => boardService.deleteBoard(token, id)));
        } else {
          // Single delete + Reparenting
          // 1. Delete target board
          await boardService.deleteBoard(token, boardId);
          // 2. Update children (backend should handle this? OR we manually update children first)
          // If we delete parent first, children might get deleted on cascade or orphaned.
          // Better execution: Update children to new parent, then delete target.
          const directChildren = boards.filter(b => b.parentId === boardId);
          await Promise.all(directChildren.map(child =>
            boardService.updateBoard(token, child.id, { parentId: newParentId })
          ));
        }
      }
    } catch (e) {
      boardLogger.error("[Delete Board] Backend sync failed", e);
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
      <Suspense fallback={<div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" />}>
        <TopBar onNavigate={handleNavigate} boards={workspaceBoards} onCreateTask={handleCreateTaskOnBoard} activeBoardId={activeBoardId} activeView={activeView} />
      </Suspense>
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <SidebarWrapper
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
          onRenameWorkspace={handleRenameWorkspace}
          boards={workspaceBoards}
          onDeleteBoard={handleDeleteBoard}
          onToggleFavorite={handleToggleFavorite}
          onAddBoard={(name, icon, template, defaultView, parentId, nameDirection) => handleQuickAddBoard(name, icon, template, defaultView as any, parentId, nameDirection)}
          pageVisibility={effectivePageVisibility}
        />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#FCFCFD] dark:bg-monday-dark-bg z-10 ltr:shadow-[-4px_0_24px_rgba(0,0,0,0.08)] rtl:shadow-[4px_0_24px_rgba(0,0,0,0.08)] ms-0.5`}>
          <React.Suspense fallback={<FullScreenLoader />}>
            {/* Dashboard - Always mounted, hidden when not active (CSS keep-alive) */}
            <div className={activeView === 'dashboard' ? 'contents' : 'hidden'}>
              <FeatureErrorBoundary featureName="Dashboard">
                <Dashboard
                  onBoardCreated={handleBoardCreated}
                  recentlyVisited={recentlyVisited}
                  onNavigate={handleNavigate}
                  boards={workspaceBoards}
                  activeWorkspaceId={activeWorkspaceId}
                  workspaces={workspaces}
                  onTaskCreated={handleCreateTaskOnBoard}
                  onRequestNewBoard={handleRequestNewBoard}
                />
              </FeatureErrorBoundary>
            </div>

            {/* Other views - conditionally rendered */}
            {activeView === 'board' ? (
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
            ) : null}

            {/* Department pages with dashboards - Lazy CSS keep-alive (mount on first visit, then preserve) */}
            {visitedDeptPages.has('sales') && (
              <div className={activeView === 'sales' ? 'contents' : 'hidden'}>
                <SalesPage />
              </div>
            )}
            {visitedDeptPages.has('purchases') && (
              <div className={activeView === 'purchases' ? 'contents' : 'hidden'}>
                <PurchasesPage />
              </div>
            )}
            {visitedDeptPages.has('inventory') && (
              <div className={activeView === 'inventory' ? 'contents' : 'hidden'}>
                <InventoryPage />
              </div>
            )}
            {visitedDeptPages.has('expenses') && (
              <div className={activeView === 'expenses' ? 'contents' : 'hidden'}>
                <ExpensesPage />
              </div>
            )}
            {visitedDeptPages.has('customers') && (
              <div className={activeView === 'customers' ? 'contents' : 'hidden'}>
                <CustomersPage />
              </div>
            )}
            {visitedDeptPages.has('suppliers') && (
              <div className={activeView === 'suppliers' ? 'contents' : 'hidden'}>
                <SuppliersPage />
              </div>
            )}

            {activeView === 'reports' ? (
              <ReportsPage />
            ) : activeView === 'it_support' ? (
              <ITPage />
            ) : activeView === 'hr' ? (
              <HRPage />
            ) : activeView === 'marketing' ? (
              <MarketingPage />
            ) : activeView === 'local_marketplace' ? (
              <LocalMarketplacePage initialSearchQuery={marketplaceInitialSearch} />
            ) : activeView === 'foreign_marketplace' ? (
              <ForeignMarketplacePage />
            ) : activeView === 'marketplace' ? (
              <MarketplacePage onNavigate={handleNavigate} />
            ) : activeView === 'cornell_notes' ? (
              <CornellNotesPage />
            ) : activeView === 'quick_notes' ? (
              <QuickNotesPage />
            ) : activeView === 'settings' ? (
              <SettingsPage
                visibility={pageVisibility}
                onVisibilityChange={setPageVisibility}
                isAdmin={isAdmin}
                onFeatureFlagsChange={fetchAdminData}
                serverAllowedPages={normalizedServerFlags}
              />
            ) : activeView === 'talk' ? (
              <TalkPage onNavigate={handleNavigate} />
            ) : activeView === 'test' ? (
              <TestPage />
            ) : activeView === 'arcade' ? (
              <ArcadePage />
            ) : activeView === 'live_session' ? (
              <LiveSessionPage />
            ) : null /* Unknown view - Dashboard is always mounted above */}
          </React.Suspense>
        </main>
      </div>

    </div>
  );
};

// Error boundary for the entire app content
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    appLogger.error('App Error Boundary caught error:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { children } = (this as any).props as ErrorBoundaryProps;
    if (hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return children;
  }
}

// Component to handle signed-in users - redirects to app subdomain if on main domain
const SignedInContent: React.FC<{ isMainDomain: boolean }> = ({ isMainDomain }) => {
  const [portalType, setPortalType] = useState<'buyer' | 'seller' | null>(() => {
    const stored = localStorage.getItem('portal_type');
    return stored === 'buyer' || stored === 'seller' ? stored : null;
  });

  useEffect(() => {
    // Don't auto-redirect if user just signed out (prevents redirect loop)
    const justSignedOut = sessionStorage.getItem('just_signed_out');
    if (justSignedOut) {
      sessionStorage.removeItem('just_signed_out');
      return;
    }
    if (isMainDomain) {
      window.location.href = 'https://app.nabdchain.com';
    }
  }, [isMainDomain]);

  const handlePortalLogout = () => {
    localStorage.removeItem('portal_type');
    localStorage.removeItem('mock_auth_token');
    localStorage.removeItem('nabd_dev_mode');
    // Don't set state before reload - it causes a brief sidebar flash
    window.location.reload();
  };

  if (isMainDomain) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Portal users see the marketplace
  if (portalType) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <PortalMarketplacePage portalType={portalType} onLogout={handlePortalLogout} />
      </Suspense>
    );
  }

  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
};

const AppRoutes: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser();

  // Detect hostname
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAppSubdomain = hostname === 'app.nabdchain.com';
  const isMainDomain = hostname === 'nabdchain.com' || hostname === 'www.nabdchain.com';

  // Track if auth loading is taking too long
  const [authTimeout, setAuthTimeout] = useState(false);

  // Enforce minimum loading time of 2 seconds for the animation
  const [minLoadComplete, setMinLoadComplete] = useState(false);

  useEffect(() => {
    // Start minimum loading timer
    const timer = setTimeout(() => {
      setMinLoadComplete(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // View state for auth screens: 'home' (landing), 'signin', 'signup'
  // Determine initial view from URL path
  const [authView, setAuthViewState] = useState<'home' | 'signin' | 'signup'>(() => {
    const path = window.location.pathname;
    if (path === '/signin' || path === '/login') return 'signin';
    if (path === '/signup' || path === '/register') return 'signup';
    // Default to home (landing page)
    return 'home';
  });

  // Wrapper to update both state and URL
  const setAuthView = (view: 'home' | 'signin' | 'signup') => {
    setAuthViewState(view);
    const newPath = view === 'home' ? '/' : `/${view}`;
    window.history.pushState({}, '', newPath);
  };

  // Handle browser back/forward for auth views
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signin' || path === '/login') {
        setAuthViewState('signin');
      } else if (path === '/signup' || path === '/register') {
        setAuthViewState('signup');
      } else {
        setAuthViewState('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Timeout for auth loading - if it takes more than 10 seconds, show retry option
  useEffect(() => {
    if (!isLoaded) {
      const timeout = setTimeout(() => {
        setAuthTimeout(true);
      }, 10000);
      return () => clearTimeout(timeout);
    } else {
      setAuthTimeout(false);
    }
  }, [isLoaded]);

  const showLoader = !isLoaded || !minLoadComplete;

  if (showLoader) {
    return (
      <>
        <MorphingLoader fullScreen />
        {authTimeout && (
          <div className="fixed bottom-10 left-0 right-0 text-center z-[60]">
            <p className="text-gray-500 mb-2 text-sm">Loading is taking longer than expected...</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 text-sm"
            >
              Reload Page
            </button>
          </div>
        )}
      </>
    );
  }

  // Handler for "Back to Home" - redirect to main domain or show landing
  const handleBackToHome = () => {
    if (isAppSubdomain) {
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
          <LandingPage
            onEnterSystem={() => {
              // If on main domain, redirect to app subdomain for sign-in
              if (isMainDomain) {
                window.location.href = 'https://app.nabdchain.com';
              } else {
                setAuthView('signin');
              }
            }}
            onNavigateToSignIn={() => setAuthView('signin')}
            onNavigateToSignUp={() => setAuthView('signup')}
          />
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
  // Check for mobile subdomain
  const hostname = window.location.hostname;
  const isMobileSubdomain = hostname === 'mobile.nabdchain.com' ||
    hostname === 'mobile.app.nabdchain.com' ||
    hostname.startsWith('mobile.localhost') ||
    // For local testing: use ?mobile=true query param
    new URLSearchParams(window.location.search).get('mobile') === 'true';

  // Render mobile app for mobile subdomain
  if (isMobileSubdomain) {
    return (
      <AppProvider>
        <MobileApp />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <UIProvider>
        <LanguageProvider>
          <NavigationProvider>
            <FocusProvider>
              <ToastProvider>
                <SocketProvider>
                  <AIProvider>
                    {/* Invitation Route */}
                    <Router>
                      <Routes>
                        <Route
                          path="/invite/accept"
                          element={
                            <>
                              <SignedIn>
                                <Suspense fallback={<PageLoadingFallback />}>
                                  <AcceptInvitePage />
                                </Suspense>
                              </SignedIn>
                              <SignedOut>
                                <RedirectToSignIn />
                              </SignedOut>
                            </>
                          }
                        />
                        {/* Live Session Route */}
                        <Route
                          path="/live/:roomId?"
                          element={
                            <>
                              <SignedIn>
                                <React.Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
                                  <LiveSessionPage />
                                </React.Suspense>
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
                    <Suspense fallback={null}>
                      <SpeedInsights />
                    </Suspense>
                  </AIProvider>
                </SocketProvider>
              </ToastProvider>
            </FocusProvider>
          </NavigationProvider>
        </LanguageProvider>
      </UIProvider>
    </AppProvider>
  )
}

export default App;
