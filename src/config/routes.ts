/**
 * Route Configuration
 *
 * All lazy-loaded components and route definitions extracted from App.tsx
 * Keeps App.tsx focused on rendering and state management.
 */

import { lazyWithRetry } from '../utils/lazyWithRetry';

// ============================================================================
// LAZY LOADED COMPONENTS - All heavy components loaded on demand
// ============================================================================

// Core Layout
export const Sidebar = lazyWithRetry(() => import('../components/layout/Sidebar').then(m => ({ default: m.Sidebar })));
export const TopBar = lazyWithRetry(() => import('../components/layout/TopBar').then(m => ({ default: m.TopBar })));

// Auth & Landing Pages
export const LandingPage = lazyWithRetry(() => import('../features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
export const AcceptInvitePage = lazyWithRetry(() => import('../features/auth/AcceptInvitePage').then(m => ({ default: m.AcceptInvitePage })));
export const SignUpPage = lazyWithRetry(() => import('../features/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
export const SignInPage = lazyWithRetry(() => import('../features/auth/SignInPage').then(m => ({ default: m.SignInPage })));

// Portal Pages
export const PortalMarketplacePage = lazyWithRetry(() => import('../features/portal/PortalMarketplacePage'));
export const SellerProfilePage = lazyWithRetry(() => import('../features/portal/SellerProfilePage'));

// Mobile
export const MobileApp = lazyWithRetry(() => import('../features/mobile/MobileApp').then(m => ({ default: m.MobileApp })));

// Speed Insights (non-critical)
export const SpeedInsights = lazyWithRetry(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));

// Core Feature Pages
export const Dashboard = lazyWithRetry(() => import('../features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
export const BoardView = lazyWithRetry(() => import('../features/board/BoardView').then(m => ({ default: m.BoardView })));
export const InboxView = lazyWithRetry(() => import('../features/inbox/InboxView').then(m => ({ default: m.InboxView })));
export const VaultView = lazyWithRetry(() => import('../features/vault/VaultView').then(m => ({ default: m.VaultView })));
export const MyWorkPage = lazyWithRetry(() => import('../features/myWork/MyWorkPage').then(m => ({ default: m.MyWorkPage })));
export const TeamsPage = lazyWithRetry(() => import('../features/teams/TeamsPage'));
export const TalkPage = lazyWithRetry(() => import('../features/talk/TalkPage'));
export const TestPage = lazyWithRetry(() => import('../features/tools/TestPage').then(m => ({ default: m.TestPage })));
export const ArcadePage = lazyWithRetry(() => import('../features/arcade/ArcadePage'));
export const LiveSessionPage = lazyWithRetry(() => import('../features/collaboration/LiveSessionPage').then(m => ({ default: m.LiveSessionPage })));

// Department Pages - Supply Chain
export const ProcurementPage = lazyWithRetry(() => import('../features/supply_chain/procurement/ProcurementPage'));
export const WarehousePage = lazyWithRetry(() => import('../features/supply_chain/warehouse/WarehousePage'));
export const ShippingPage = lazyWithRetry(() => import('../features/supply_chain/shipping/ShippingPage'));
export const FleetPage = lazyWithRetry(() => import('../features/supply_chain/fleet/FleetPage'));
export const VendorsPage = lazyWithRetry(() => import('../features/supply_chain/vendors/VendorsPage'));
export const PlanningPage = lazyWithRetry(() => import('../features/supply_chain/planning/PlanningPage'));

// Department Pages - Operations
export const MaintenancePage = lazyWithRetry(() => import('../features/operations/maintenance/MaintenancePage'));
export const ProductionPage = lazyWithRetry(() => import('../features/operations/production/ProductionPage'));
export const QualityPage = lazyWithRetry(() => import('../features/operations/quality/QualityPage'));

// Department Pages - Business
export const BusinessSalesPage = lazyWithRetry(() => import('../features/business/sales/SalesPage'));
export const FinancePage = lazyWithRetry(() => import('../features/business/finance/FinancePage'));

// Mini Company - Overview
export const DashboardsPage = lazyWithRetry(() => import('../features/mini_company/overview/DashboardsPage'));
export const ReportsPage = lazyWithRetry(() => import('../features/mini_company/overview/ReportsPage'));

// Mini Company - Operations
export const SalesPage = lazyWithRetry(() => import('../features/mini_company/operations/SalesPage'));
export const PurchasesPage = lazyWithRetry(() => import('../features/mini_company/operations/PurchasesPage'));
export const InventoryPage = lazyWithRetry(() => import('../features/mini_company/operations/InventoryPage'));

// Mini Company - Finance & People
export const ExpensesPage = lazyWithRetry(() => import('../features/mini_company/finance/ExpensesPage'));
export const CustomersPage = lazyWithRetry(() => import('../features/mini_company/customers/CustomersPage').then(module => ({ default: module.CustomersPage })));
export const SuppliersPage = lazyWithRetry(() => import('../features/mini_company/suppliers/SuppliersPage').then(module => ({ default: module.SuppliersPage })));

// Marketplace
export const LocalMarketplacePage = lazyWithRetry(() => import('../features/marketplace/LocalMarketplacePage'));
export const ForeignMarketplacePage = lazyWithRetry(() => import('../features/marketplace/ForeignMarketplacePage'));
export const MarketplacePage = lazyWithRetry(() => import('../features/marketplace/MarketplacePage'));

// Business Support
export const ITPage = lazyWithRetry(() => import('../features/business_support/it/ITPage'));
export const HRPage = lazyWithRetry(() => import('../features/business_support/hr/HRPage'));
export const MarketingPage = lazyWithRetry(() => import('../features/business_support/marketing/MarketingPage'));

// Tools & Settings
export const CornellNotesPage = lazyWithRetry(() => import('../features/tools/cornell/CornellNotesPage'));
export const QuickNotesPage = lazyWithRetry(() => import('../features/quick_notes/QuickNotesPage'));
export const SettingsPage = lazyWithRetry(() => import('../features/settings/SettingsPage'));

// ============================================================================
// VIEW TO IMPORT MAPPING - For preloading on hover
// ============================================================================
const viewImports: Record<string, () => Promise<unknown>> = {
  dashboard: () => import('../features/dashboard/Dashboard'),
  my_work: () => import('../features/myWork/MyWorkPage'),
  inbox: () => import('../features/inbox/InboxView'),
  teams: () => import('../features/teams/TeamsPage'),
  vault: () => import('../features/vault/VaultView'),
  talk: () => import('../features/talk/TalkPage'),
  board: () => import('../features/board/BoardView'),
  // Mini Company
  dashboards: () => import('../features/mini_company/overview/DashboardsPage'),
  reports: () => import('../features/mini_company/overview/ReportsPage'),
  sales: () => import('../features/mini_company/operations/SalesPage'),
  purchases: () => import('../features/mini_company/operations/PurchasesPage'),
  inventory: () => import('../features/mini_company/operations/InventoryPage'),
  expenses: () => import('../features/mini_company/finance/ExpensesPage'),
  customers: () => import('../features/mini_company/customers/CustomersPage'),
  suppliers: () => import('../features/mini_company/suppliers/SuppliersPage'),
  // Supply Chain
  procurement: () => import('../features/supply_chain/procurement/ProcurementPage'),
  warehouse: () => import('../features/supply_chain/warehouse/WarehousePage'),
  shipping: () => import('../features/supply_chain/shipping/ShippingPage'),
  fleet: () => import('../features/supply_chain/fleet/FleetPage'),
  vendors: () => import('../features/supply_chain/vendors/VendorsPage'),
  planning: () => import('../features/supply_chain/planning/PlanningPage'),
  // Operations
  maintenance: () => import('../features/operations/maintenance/MaintenancePage'),
  production: () => import('../features/operations/production/ProductionPage'),
  quality: () => import('../features/operations/quality/QualityPage'),
  // Business
  sales_listing: () => import('../features/business/sales/SalesPage'),
  finance: () => import('../features/business/finance/FinancePage'),
  // Business Support
  it_support: () => import('../features/business_support/it/ITPage'),
  hr: () => import('../features/business_support/hr/HRPage'),
  marketing: () => import('../features/business_support/marketing/MarketingPage'),
  // Marketplace
  local_marketplace: () => import('../features/marketplace/LocalMarketplacePage'),
  foreign_marketplace: () => import('../features/marketplace/ForeignMarketplacePage'),
  marketplace: () => import('../features/marketplace/MarketplacePage'),
  // Tools
  cornell_notes: () => import('../features/tools/cornell/CornellNotesPage'),
  quick_notes: () => import('../features/quick_notes/QuickNotesPage'),
  settings: () => import('../features/settings/SettingsPage'),
  test: () => import('../features/tools/TestPage'),
  arcade: () => import('../features/arcade/ArcadePage'),
  live_session: () => import('../features/collaboration/LiveSessionPage'),
};

// Track which views are already preloaded to avoid duplicate requests
const preloadedViews = new Set<string>();

/**
 * Preload a specific route's chunk on hover to eliminate load time on click.
 * Safe to call multiple times - will only load each view once.
 */
export const preloadRoute = (view: string) => {
  if (preloadedViews.has(view)) return;

  const importer = viewImports[view];
  if (importer) {
    preloadedViews.add(view);
    importer().catch(() => {
      // Remove from set so it can retry on next hover
      preloadedViews.delete(view);
    });
  }
};

/**
 * Preload multiple routes at once (used for department sections on expand)
 */
export const preloadRoutes = (views: string[]) => {
  views.forEach(preloadRoute);
};

// ============================================================================
// PRELOAD CRITICAL ROUTES - Load in background after initial render
// ============================================================================
export const preloadCriticalRoutes = () => {
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  };

  // First batch: Core layout and most used pages
  schedulePreload(() => {
    import('../features/dashboard/Dashboard');
    import('../components/layout/Sidebar');
    import('../components/layout/TopBar');
  });

  // Second batch: Common navigation pages (after 500ms idle)
  setTimeout(() => {
    schedulePreload(() => {
      import('../features/myWork/MyWorkPage');
      import('../features/inbox/InboxView');
      import('../features/vault/VaultView');
      import('../features/board/BoardView');
    });
  }, 500);
};

// ============================================================================
// VIEW TO COMPONENT MAPPING
// ============================================================================

/**
 * Simple views that just render a component with no special props.
 * Used to reduce the massive if-else chain in App.tsx
 */
export const simpleViewComponents = {
  teams: TeamsPage,
  vault: VaultView,
  procurement: ProcurementPage,
  warehouse: WarehousePage,
  shipping: ShippingPage,
  fleet: FleetPage,
  vendors: VendorsPage,
  planning: PlanningPage,
  maintenance: MaintenancePage,
  production: ProductionPage,
  quality: QualityPage,
  dashboards: DashboardsPage,
  reports: ReportsPage,
  it_support: ITPage,
  hr: HRPage,
  marketing: MarketingPage,
  foreign_marketplace: ForeignMarketplacePage,
  cornell_notes: CornellNotesPage,
  quick_notes: QuickNotesPage,
  test: TestPage,
  arcade: ArcadePage,
  live_session: LiveSessionPage,
} as const;

/**
 * Department pages that use CSS keep-alive pattern
 * (mount on first visit, then preserve with hidden/contents)
 */
export const keepAliveViews = [
  'sales',
  'purchases',
  'inventory',
  'expenses',
  'customers',
  'suppliers',
] as const;

export type SimpleViewKey = keyof typeof simpleViewComponents;
export type KeepAliveView = typeof keepAliveViews[number];
