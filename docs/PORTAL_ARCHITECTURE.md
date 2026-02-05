# Portal Architecture - B2B/B2C Marketplace

> Scalable architecture design for a multi-role marketplace supporting Buyers, Sellers, and future role expansions.

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Auth & Role Resolution Flow](#2-auth--role-resolution-flow)
3. [Sidebar Dynamic Rendering Logic](#3-sidebar-dynamic-rendering-logic)
4. [Shared UI Kit Strategy](#4-shared-ui-kit-strategy)
5. [API Boundaries](#5-api-boundaries)

---

## 1. Folder Structure

```
src/features/portal/
├── index.ts                          # Public exports
├── PortalRouter.tsx                  # Main router with role switching
│
├── core/                             # Shared core infrastructure
│   ├── context/
│   │   ├── PortalContext.tsx         # Theme, i18n, direction
│   │   ├── PortalAuthContext.tsx     # Role resolution, permissions
│   │   ├── PortalNavigationContext.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── usePortalAuth.ts          # Auth state & role detection
│   │   ├── usePortalNavigation.ts    # Cross-role navigation
│   │   ├── usePortalPermissions.ts   # Permission checks
│   │   ├── usePortalTheme.ts         # Theme utilities
│   │   └── index.ts
│   ├── guards/
│   │   ├── RoleGuard.tsx             # Route protection by role
│   │   ├── PermissionGuard.tsx       # Feature-level permissions
│   │   └── OnboardingGuard.tsx       # Onboarding completion check
│   └── constants/
│       ├── roles.ts                  # Role definitions
│       ├── permissions.ts            # Permission matrix
│       └── routes.ts                 # Route definitions
│
├── shared/                           # Shared components & services
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PortalShell.tsx       # Main layout wrapper
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx       # Dynamic sidebar
│   │   │   │   ├── SidebarItem.tsx
│   │   │   │   ├── SidebarSection.tsx
│   │   │   │   ├── RoleSwitcher.tsx  # Role toggle component
│   │   │   │   └── index.ts
│   │   │   ├── TopBar.tsx
│   │   │   └── Container.tsx
│   │   ├── ui/                       # UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table/
│   │   │   ├── Form/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── index.ts
│   │   ├── data-display/             # Data visualization
│   │   │   ├── StatCard.tsx
│   │   │   ├── TrendIndicator.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   └── index.ts
│   │   └── feedback/
│   │       ├── Toast.tsx
│   │       ├── Alert.tsx
│   │       └── Skeleton.tsx
│   ├── services/
│   │   ├── apiClient.ts              # Base API client
│   │   ├── notificationService.ts
│   │   └── analyticsService.ts
│   └── types/
│       ├── common.types.ts
│       ├── api.types.ts
│       └── index.ts
│
├── buyer/                            # Buyer-specific module
│   ├── BuyerPortal.tsx               # Buyer entry point
│   ├── routes.tsx                    # Buyer route definitions
│   ├── pages/
│   │   ├── BuyerDashboard.tsx
│   │   ├── Marketplace.tsx
│   │   ├── ItemDetails.tsx
│   │   ├── MyOrders.tsx
│   │   ├── MyRFQs.tsx
│   │   ├── BuyerWorkspace/
│   │   │   ├── index.tsx
│   │   │   ├── SavedItems.tsx
│   │   │   ├── CompareLists.tsx
│   │   │   └── PurchaseHistory.tsx
│   │   └── BuyerSettings.tsx
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   ├── RFQForm.tsx
│   │   ├── OrderTimeline.tsx
│   │   ├── SupplierCard.tsx
│   │   └── PriceExpectationBand.tsx
│   ├── services/
│   │   ├── marketplaceService.ts
│   │   ├── rfqService.ts
│   │   ├── orderService.ts
│   │   └── workspaceService.ts
│   ├── hooks/
│   │   ├── useMarketplace.ts
│   │   ├── useRFQ.ts
│   │   └── useBuyerIntelligence.ts
│   └── types/
│       └── buyer.types.ts
│
├── seller/                           # Seller-specific module
│   ├── SellerPortal.tsx              # Seller entry point
│   ├── routes.tsx                    # Seller route definitions
│   ├── pages/
│   │   ├── SellerDashboard.tsx
│   │   ├── Listings/
│   │   │   ├── index.tsx
│   │   │   ├── ListingsTable.tsx
│   │   │   └── ProductIntelligence.tsx
│   │   ├── RFQInbox/
│   │   │   ├── index.tsx
│   │   │   ├── RFQList.tsx
│   │   │   ├── RFQDetail.tsx
│   │   │   └── QuickRespond.tsx
│   │   ├── Orders/
│   │   │   ├── index.tsx
│   │   │   ├── OrderList.tsx
│   │   │   └── OrderFulfillment.tsx
│   │   ├── Analytics/
│   │   │   ├── index.tsx
│   │   │   ├── SalesAnalytics.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   ├── Inventory.tsx
│   │   ├── Customers.tsx
│   │   └── SellerSettings.tsx
│   ├── components/
│   │   ├── AddProductPanel.tsx
│   │   ├── PerformanceSignal.tsx
│   │   ├── DemandGapBadge.tsx
│   │   ├── RFQScoreCard.tsx
│   │   └── ReadinessScore.tsx
│   ├── services/
│   │   ├── itemService.ts
│   │   ├── sellerRFQService.ts
│   │   ├── sellerOrderService.ts
│   │   ├── inventoryService.ts
│   │   └── analyticsService.ts
│   ├── hooks/
│   │   ├── useSellerStats.ts
│   │   ├── useListings.ts
│   │   ├── useRFQInbox.ts
│   │   └── useSellerIntelligence.ts
│   └── types/
│       ├── item.types.ts
│       ├── rfq.types.ts
│       └── seller.types.ts
│
├── public/                           # Public-facing pages (no auth)
│   ├── pages/
│   │   ├── SellerProfile.tsx         # Public seller storefront
│   │   ├── PublicItemDetails.tsx
│   │   └── CategoryBrowse.tsx
│   └── services/
│       └── publicService.ts
│
└── admin/                            # Future: Admin module
    ├── AdminPortal.tsx
    ├── pages/
    └── services/
```

---

## 2. Auth & Role Resolution Flow

### Role Definitions

```typescript
// src/features/portal/core/constants/roles.ts

export type PortalRole = 'buyer' | 'seller' | 'admin' | 'guest';

export interface UserRoles {
  primary: PortalRole;           // Default role on login
  available: PortalRole[];       // All roles user can switch to
  activeRole: PortalRole;        // Currently active role
}

export interface RoleCapabilities {
  canBuy: boolean;
  canSell: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageInventory: boolean;
  canProcessRFQs: boolean;
  canCreateOrders: boolean;
}

export const ROLE_CAPABILITIES: Record<PortalRole, RoleCapabilities> = {
  buyer: {
    canBuy: true,
    canSell: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageInventory: false,
    canProcessRFQs: false,
    canCreateOrders: true,
  },
  seller: {
    canBuy: false,
    canSell: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageInventory: true,
    canProcessRFQs: true,
    canCreateOrders: false,
  },
  admin: {
    canBuy: true,
    canSell: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageInventory: true,
    canProcessRFQs: true,
    canCreateOrders: true,
  },
  guest: {
    canBuy: false,
    canSell: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageInventory: false,
    canProcessRFQs: false,
    canCreateOrders: false,
  },
};
```

### Auth Context Implementation

```typescript
// src/features/portal/core/context/PortalAuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth-adapter';
import { PortalRole, UserRoles, ROLE_CAPABILITIES, RoleCapabilities } from '../constants/roles';

interface PortalAuthState {
  // User info
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  } | null;

  // Role management
  roles: UserRoles;
  capabilities: RoleCapabilities;

  // State
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  switchRole: (role: PortalRole) => Promise<void>;
  hasPermission: (permission: keyof RoleCapabilities) => boolean;
  canAccessRole: (role: PortalRole) => boolean;
}

const PortalAuthContext = createContext<PortalAuthState | null>(null);

export const PortalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSignedIn, getToken } = useAuth();
  const [roles, setRoles] = useState<UserRoles>({
    primary: 'buyer',
    available: ['buyer'],
    activeRole: 'buyer',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user roles from backend on auth
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!isSignedIn || !user) {
        setRoles({ primary: 'guest', available: ['guest'], activeRole: 'guest' });
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch('/api/portal/user/roles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        // Restore last active role from localStorage or use primary
        const savedRole = localStorage.getItem('portal-active-role') as PortalRole;
        const activeRole = savedRole && data.available.includes(savedRole)
          ? savedRole
          : data.primary;

        setRoles({
          primary: data.primary,
          available: data.available,
          activeRole,
        });
      } catch (error) {
        console.error('Failed to fetch user roles:', error);
        setRoles({ primary: 'buyer', available: ['buyer'], activeRole: 'buyer' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoles();
  }, [isSignedIn, user, getToken]);

  // Switch active role
  const switchRole = useCallback(async (newRole: PortalRole) => {
    if (!roles.available.includes(newRole)) {
      throw new Error(`Role ${newRole} is not available for this user`);
    }

    setRoles((prev) => ({ ...prev, activeRole: newRole }));
    localStorage.setItem('portal-active-role', newRole);

    // Optional: Notify backend of role switch for analytics
    try {
      const token = await getToken();
      await fetch('/api/portal/user/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
    } catch (error) {
      console.error('Failed to notify role switch:', error);
    }
  }, [roles.available, getToken]);

  // Check permission
  const hasPermission = useCallback(
    (permission: keyof RoleCapabilities) => {
      return ROLE_CAPABILITIES[roles.activeRole][permission];
    },
    [roles.activeRole]
  );

  // Check if user can access a role
  const canAccessRole = useCallback(
    (role: PortalRole) => roles.available.includes(role),
    [roles.available]
  );

  const value: PortalAuthState = {
    user: user ? { id: user.id, email: user.email || '', name: user.name || '', avatar: user.imageUrl } : null,
    roles,
    capabilities: ROLE_CAPABILITIES[roles.activeRole],
    isAuthenticated: isSignedIn,
    isLoading,
    switchRole,
    hasPermission,
    canAccessRole,
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error('usePortalAuth must be used within PortalAuthProvider');
  }
  return context;
};
```

### Role Guard Component

```typescript
// src/features/portal/core/guards/RoleGuard.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePortalAuth } from '../context/PortalAuthContext';
import { PortalRole } from '../constants/roles';

interface RoleGuardProps {
  allowedRoles: PortalRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  redirectTo = '/portal',
}) => {
  const { roles, isLoading, isAuthenticated } = usePortalAuth();
  const location = useLocation();

  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(roles.activeRole)) {
    // If user has access to an allowed role, suggest switching
    const canSwitch = allowedRoles.some((role) => roles.available.includes(role));

    if (canSwitch) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2>Switch Role Required</h2>
            <p>Please switch to {allowedRoles.join(' or ')} to access this page.</p>
          </div>
        </div>
      );
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
```

### Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTH FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │  User    │───▶│  Clerk Auth   │───▶│  Fetch User Roles    │  │
│  │  Login   │    │  (or Mock)    │    │  from Backend        │  │
│  └──────────┘    └───────────────┘    └──────────┬───────────┘  │
│                                                   │              │
│                                                   ▼              │
│                                       ┌──────────────────────┐  │
│                                       │  Resolve Roles:      │  │
│                                       │  - primary           │  │
│                                       │  - available[]       │  │
│                                       │  - activeRole        │  │
│                                       └──────────┬───────────┘  │
│                                                   │              │
│                        ┌──────────────────────────┼──────────┐  │
│                        │                          │          │  │
│                        ▼                          ▼          ▼  │
│               ┌────────────────┐    ┌────────────────┐ ┌─────┐  │
│               │ Buyer Portal   │    │ Seller Portal  │ │Admin│  │
│               │ (buyer role)   │    │ (seller role)  │ │     │  │
│               └────────────────┘    └────────────────┘ └─────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ROLE SWITCHING                         │   │
│  │  ┌─────────┐      ┌─────────────┐      ┌─────────────┐   │   │
│  │  │ Sidebar │─────▶│ switchRole()│─────▶│ Update State│   │   │
│  │  │ Toggle  │      │             │      │ + localStorage│  │   │
│  │  └─────────┘      └─────────────┘      └─────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Sidebar Dynamic Rendering Logic

### Navigation Configuration

```typescript
// src/features/portal/core/constants/navigation.ts

import {
  House,
  Storefront,
  ShoppingCart,
  FileText,
  Package,
  ChartLine,
  Gear,
  Users,
  Cube,
  Briefcase,
  ClipboardText,
  Warehouse,
  Coins,
} from 'phosphor-react';
import { PortalRole, RoleCapabilities } from './roles';

export interface NavItem {
  id: string;
  label: string;
  labelKey: string;           // i18n key
  icon: React.ElementType;
  path: string;
  roles: PortalRole[];        // Roles that can see this item
  permission?: keyof RoleCapabilities;  // Optional permission check
  badge?: 'count' | 'dot';    // Badge type
  badgeKey?: string;          // Key for badge count in state
  children?: NavItem[];       // Nested items
  dividerAfter?: boolean;     // Add divider after this item
}

export interface NavSection {
  id: string;
  title?: string;
  titleKey?: string;
  roles: PortalRole[];
  items: NavItem[];
}

export const PORTAL_NAVIGATION: NavSection[] = [
  // ─────────────────────────────────────────────────────────────
  // BUYER NAVIGATION
  // ─────────────────────────────────────────────────────────────
  {
    id: 'buyer-main',
    roles: ['buyer'],
    items: [
      {
        id: 'buyer-home',
        label: 'Home',
        labelKey: 'buyer.nav.home',
        icon: House,
        path: '/portal/buyer',
        roles: ['buyer'],
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        labelKey: 'buyer.nav.marketplace',
        icon: Storefront,
        path: '/portal/buyer/marketplace',
        roles: ['buyer'],
      },
      {
        id: 'my-rfqs',
        label: 'My RFQs',
        labelKey: 'buyer.nav.myRfqs',
        icon: FileText,
        path: '/portal/buyer/rfqs',
        roles: ['buyer'],
        badge: 'count',
        badgeKey: 'pendingRfqs',
      },
      {
        id: 'my-orders',
        label: 'My Orders',
        labelKey: 'buyer.nav.myOrders',
        icon: ShoppingCart,
        path: '/portal/buyer/orders',
        roles: ['buyer'],
        badge: 'count',
        badgeKey: 'activeOrders',
        dividerAfter: true,
      },
    ],
  },
  {
    id: 'buyer-workspace',
    titleKey: 'buyer.nav.workspace',
    roles: ['buyer'],
    items: [
      {
        id: 'saved-items',
        label: 'Saved Items',
        labelKey: 'buyer.nav.savedItems',
        icon: Package,
        path: '/portal/buyer/workspace/saved',
        roles: ['buyer'],
      },
      {
        id: 'compare-lists',
        label: 'Compare Lists',
        labelKey: 'buyer.nav.compareLists',
        icon: ClipboardText,
        path: '/portal/buyer/workspace/compare',
        roles: ['buyer'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SELLER NAVIGATION
  // ─────────────────────────────────────────────────────────────
  {
    id: 'seller-main',
    roles: ['seller'],
    items: [
      {
        id: 'seller-dashboard',
        label: 'Dashboard',
        labelKey: 'seller.nav.dashboard',
        icon: House,
        path: '/portal/seller',
        roles: ['seller'],
      },
      {
        id: 'rfq-inbox',
        label: 'RFQ Inbox',
        labelKey: 'seller.nav.rfqInbox',
        icon: FileText,
        path: '/portal/seller/rfqs',
        roles: ['seller'],
        badge: 'count',
        badgeKey: 'pendingRfqs',
      },
      {
        id: 'orders',
        label: 'Orders',
        labelKey: 'seller.nav.orders',
        icon: ShoppingCart,
        path: '/portal/seller/orders',
        roles: ['seller'],
        badge: 'count',
        badgeKey: 'pendingOrders',
        dividerAfter: true,
      },
    ],
  },
  {
    id: 'seller-catalog',
    titleKey: 'seller.nav.catalog',
    roles: ['seller'],
    items: [
      {
        id: 'listings',
        label: 'Listings',
        labelKey: 'seller.nav.listings',
        icon: Cube,
        path: '/portal/seller/listings',
        roles: ['seller'],
        permission: 'canManageInventory',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        labelKey: 'seller.nav.inventory',
        icon: Warehouse,
        path: '/portal/seller/inventory',
        roles: ['seller'],
        permission: 'canManageInventory',
      },
    ],
  },
  {
    id: 'seller-business',
    titleKey: 'seller.nav.business',
    roles: ['seller'],
    items: [
      {
        id: 'customers',
        label: 'Customers',
        labelKey: 'seller.nav.customers',
        icon: Users,
        path: '/portal/seller/customers',
        roles: ['seller'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        labelKey: 'seller.nav.analytics',
        icon: ChartLine,
        path: '/portal/seller/analytics',
        roles: ['seller'],
        permission: 'canViewAnalytics',
      },
      {
        id: 'finances',
        label: 'Finances',
        labelKey: 'seller.nav.finances',
        icon: Coins,
        path: '/portal/seller/finances',
        roles: ['seller'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SHARED NAVIGATION (appears for all roles)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'shared-settings',
    roles: ['buyer', 'seller', 'admin'],
    items: [
      {
        id: 'settings',
        label: 'Settings',
        labelKey: 'common.settings',
        icon: Gear,
        path: '/portal/settings',
        roles: ['buyer', 'seller', 'admin'],
      },
    ],
  },
];
```

### Dynamic Sidebar Component

```typescript
// src/features/portal/shared/components/layout/Sidebar/Sidebar.tsx

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '@/features/portal/core/context/PortalAuthContext';
import { usePortal } from '@/features/portal/core/context/PortalContext';
import { PORTAL_NAVIGATION, NavSection, NavItem } from '@/features/portal/core/constants/navigation';
import { RoleSwitcher } from './RoleSwitcher';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  badges?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  badges = {},
}) => {
  const { roles, hasPermission } = usePortalAuth();
  const { styles, t, direction } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = direction === 'rtl';

  // Filter navigation based on active role and permissions
  const filteredNavigation = useMemo(() => {
    return PORTAL_NAVIGATION
      .filter((section) => section.roles.includes(roles.activeRole))
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // Check role access
          if (!item.roles.includes(roles.activeRole)) return false;

          // Check permission if specified
          if (item.permission && !hasPermission(item.permission)) return false;

          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [roles.activeRole, hasPermission]);

  // Get badge count for an item
  const getBadgeCount = (item: NavItem): number | undefined => {
    if (!item.badge || !item.badgeKey) return undefined;
    return badges[item.badgeKey];
  };

  // Check if path is active
  const isActive = (path: string) => {
    if (path === '/portal/buyer' || path === '/portal/seller') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        flex flex-col h-full border-r transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isRtl ? 'border-l border-r-0' : 'border-r'}
      `}
      style={{
        backgroundColor: styles.bgCard,
        borderColor: styles.border,
      }}
      dir={direction}
    >
      {/* Role Switcher (at top) */}
      {roles.available.length > 1 && (
        <RoleSwitcher isCollapsed={isCollapsed} />
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {filteredNavigation.map((section) => (
          <SidebarSection
            key={section.id}
            title={section.titleKey ? t(section.titleKey) : section.title}
            isCollapsed={isCollapsed}
          >
            {section.items.map((item) => (
              <React.Fragment key={item.id}>
                <SidebarItem
                  icon={item.icon}
                  label={t(item.labelKey)}
                  isActive={isActive(item.path)}
                  isCollapsed={isCollapsed}
                  badge={getBadgeCount(item)}
                  badgeType={item.badge}
                  onClick={() => navigate(item.path)}
                />
                {item.dividerAfter && (
                  <div
                    className="mx-4 my-2 h-px"
                    style={{ backgroundColor: styles.border }}
                  />
                )}
              </React.Fragment>
            ))}
          </SidebarSection>
        ))}
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="p-4 border-t flex items-center justify-center"
          style={{ borderColor: styles.border }}
        >
          {/* Toggle icon */}
        </button>
      )}
    </aside>
  );
};
```

### Role Switcher Component

```typescript
// src/features/portal/shared/components/layout/Sidebar/RoleSwitcher.tsx

import React, { useState } from 'react';
import { CaretDown, Storefront, ShoppingBag, GearSix } from 'phosphor-react';
import { usePortalAuth } from '@/features/portal/core/context/PortalAuthContext';
import { usePortal } from '@/features/portal/core/context/PortalContext';
import { PortalRole } from '@/features/portal/core/constants/roles';

const ROLE_CONFIG: Record<PortalRole, { icon: React.ElementType; label: string; color: string }> = {
  buyer: { icon: ShoppingBag, label: 'Buyer', color: '#3B82F6' },
  seller: { icon: Storefront, label: 'Seller', color: '#10B981' },
  admin: { icon: GearSix, label: 'Admin', color: '#F59E0B' },
  guest: { icon: ShoppingBag, label: 'Guest', color: '#6B7280' },
};

interface RoleSwitcherProps {
  isCollapsed?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isCollapsed }) => {
  const { roles, switchRole, user } = usePortalAuth();
  const { styles, t } = usePortal();
  const [isOpen, setIsOpen] = useState(false);

  const currentRoleConfig = ROLE_CONFIG[roles.activeRole];
  const CurrentIcon = currentRoleConfig.icon;

  const handleRoleSwitch = async (role: PortalRole) => {
    await switchRole(role);
    setIsOpen(false);
    // Navigate to role's home page
    window.location.href = `/portal/${role}`;
  };

  if (isCollapsed) {
    return (
      <div className="p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${currentRoleConfig.color}15` }}
        >
          <CurrentIcon size={20} style={{ color: currentRoleConfig.color }} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b" style={{ borderColor: styles.border }}>
      {/* Current Role Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-lg flex items-center justify-between transition-colors"
        style={{
          backgroundColor: `${currentRoleConfig.color}10`,
          border: `1px solid ${currentRoleConfig.color}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${currentRoleConfig.color}20` }}
          >
            <CurrentIcon size={18} style={{ color: currentRoleConfig.color }} />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium" style={{ color: styles.textMuted }}>
              {t('portal.activeRole')}
            </p>
            <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
              {currentRoleConfig.label}
            </p>
          </div>
        </div>
        <CaretDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: styles.textMuted }}
        />
      </button>

      {/* Role Options Dropdown */}
      {isOpen && (
        <div
          className="mt-2 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
          }}
        >
          {roles.available
            .filter((role) => role !== roles.activeRole)
            .map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className="w-full p-3 flex items-center gap-3 transition-colors"
                  style={{ color: styles.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = styles.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={18} style={{ color: config.color }} />
                  <span className="text-sm font-medium">
                    {t('portal.switchTo')} {config.label}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
```

---

## 4. Shared UI Kit Strategy

### Design Token System

```typescript
// src/features/portal/shared/styles/tokens.ts

export const PORTAL_TOKENS = {
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },

  // Border Radius
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },

  // Typography Scale
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Transitions
  transition: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
};
```

### Component Composition Pattern

```typescript
// src/features/portal/shared/components/ui/Card.tsx

import React from 'react';
import { usePortal } from '@/features/portal/core/context/PortalContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
  onClick?: () => void;
  hoverable?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

// Main Card Component
export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  onClick,
  hoverable = false,
}) => {
  const { styles } = usePortal();

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: {
      backgroundColor: styles.bgCard,
      border: `1px solid ${styles.border}`,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${styles.border}`,
    },
    elevated: {
      backgroundColor: styles.bgCard,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  };

  return (
    <div
      className={`
        rounded-xl transition-all
        ${paddingClasses[padding]}
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={variantStyles[variant]}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.backgroundColor = styles.bgHover;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
        }
      }}
    >
      {children}
    </div>
  );
};

// Card Header
Card.Header = ({ children, action }) => {
  const { styles } = usePortal();
  return (
    <div
      className="flex items-center justify-between pb-4 mb-4 border-b"
      style={{ borderColor: styles.border }}
    >
      <div className="font-semibold" style={{ color: styles.textPrimary }}>
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Card Content
Card.Content = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

// Card Footer
Card.Footer = ({ children, align = 'right' }) => {
  const { styles } = usePortal();
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`flex items-center gap-3 pt-4 mt-4 border-t ${alignClasses[align]}`}
      style={{ borderColor: styles.border }}
    >
      {children}
    </div>
  );
};
```

### Shared Component Exports

```typescript
// src/features/portal/shared/components/index.ts

// Layout
export { Sidebar } from './layout/Sidebar';
export { TopBar } from './layout/TopBar';
export { Container } from './layout/Container';
export { PortalShell } from './layout/PortalShell';

// UI Primitives
export { Button } from './ui/Button';
export { Card } from './ui/Card';
export { Modal } from './ui/Modal';
export { Select } from './ui/Select';
export { Input } from './ui/Input';
export { Checkbox } from './ui/Checkbox';
export { Badge } from './ui/Badge';
export { Tabs } from './ui/Tabs';
export { Tooltip } from './ui/Tooltip';

// Data Display
export { Table } from './ui/Table';
export { DataGrid } from './ui/DataGrid';
export { StatCard } from './data-display/StatCard';
export { TrendIndicator } from './data-display/TrendIndicator';
export { ProgressRing } from './data-display/ProgressRing';
export { EmptyState } from './data-display/EmptyState';
export { PageHeader } from './data-display/PageHeader';

// Feedback
export { Toast, useToast } from './feedback/Toast';
export { Alert } from './feedback/Alert';
export { Skeleton } from './feedback/Skeleton';
export { Spinner } from './feedback/Spinner';

// Forms
export { Form } from './ui/Form';
export { FormField } from './ui/Form/FormField';
export { FormSection } from './ui/Form/FormSection';
```

---

## 5. API Boundaries

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API BOUNDARIES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND SERVICES                         │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │    BUYER     │  │    SELLER    │  │    SHARED    │       │    │
│  │  │  SERVICES    │  │   SERVICES   │  │   SERVICES   │       │    │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤       │    │
│  │  │marketplace   │  │itemService   │  │authService   │       │    │
│  │  │Service       │  │sellerRFQ     │  │notification  │       │    │
│  │  │buyerRFQ      │  │Service       │  │Service       │       │    │
│  │  │Service       │  │orderService  │  │uploadService │       │    │
│  │  │orderService  │  │analytics     │  │i18nService   │       │    │
│  │  │workspace     │  │Service       │  │              │       │    │
│  │  │Service       │  │inventory     │  │              │       │    │
│  │  │              │  │Service       │  │              │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  │         │                 │                 │                │    │
│  └─────────┼─────────────────┼─────────────────┼────────────────┘    │
│            │                 │                 │                     │
│            ▼                 ▼                 ▼                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    API CLIENT (Base)                         │    │
│  │  - Token injection                                           │    │
│  │  - Error handling                                            │    │
│  │  - Request/Response interceptors                             │    │
│  │  - Retry logic                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    BACKEND API                               │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                              │    │
│  │  /api/portal/                                                │    │
│  │  ├── /auth/           # Auth & role management               │    │
│  │  │   ├── /roles       # Get user roles                       │    │
│  │  │   └── /switch-role # Switch active role                   │    │
│  │  │                                                           │    │
│  │  ├── /buyer/          # Buyer-specific endpoints             │    │
│  │  │   ├── /dashboard   # Buyer dashboard data                 │    │
│  │  │   ├── /rfqs        # Buyer RFQ operations                 │    │
│  │  │   ├── /orders      # Buyer order operations               │    │
│  │  │   └── /workspace   # Saved items, compare lists           │    │
│  │  │                                                           │    │
│  │  ├── /seller/         # Seller-specific endpoints            │    │
│  │  │   ├── /dashboard   # Seller dashboard data                │    │
│  │  │   ├── /items       # Item/listing management              │    │
│  │  │   ├── /rfqs        # Seller RFQ inbox                     │    │
│  │  │   ├── /orders      # Seller order management              │    │
│  │  │   ├── /inventory   # Inventory management                 │    │
│  │  │   ├── /analytics   # Sales & performance analytics        │    │
│  │  │   └── /customers   # Customer management                  │    │
│  │  │                                                           │    │
│  │  ├── /marketplace/    # Public marketplace (shared)          │    │
│  │  │   ├── /browse      # Browse items                         │    │
│  │  │   ├── /item/:id    # Get item details                     │    │
│  │  │   ├── /seller/:id  # Get seller public profile            │    │
│  │  │   └── /categories  # Get categories                       │    │
│  │  │                                                           │    │
│  │  └── /shared/         # Shared endpoints                     │    │
│  │      ├── /upload      # File uploads                         │    │
│  │      ├── /notifications                                      │    │
│  │      └── /settings    # User settings                        │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Base API Client

```typescript
// src/features/portal/shared/services/apiClient.ts

import { getToken } from '@/auth-adapter';

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
  }

  private async getHeaders(skipAuth: boolean = false): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (!skipAuth) {
      const token = await getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, skipAuth, ...fetchConfig } = config;
    const url = this.buildURL(endpoint, params);
    const headers = await this.getHeaders(skipAuth);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.message || 'Request failed', error);
      }

      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Network error', error);
    }
  }

  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Export configured instances
export const portalApi = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/portal',
  timeout: 30000,
});

export { ApiError };
```

### Buyer Service Example

```typescript
// src/features/portal/buyer/services/marketplaceService.ts

import { portalApi } from '@/features/portal/shared/services/apiClient';
import { Item, MarketplaceFilters } from '@/features/portal/shared/types';

interface MarketplaceResponse {
  items: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: {
    categories: { key: string; count: number }[];
    manufacturers: { key: string; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
  };
}

export const marketplaceService = {
  /**
   * Browse marketplace items with filters
   */
  async browse(filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    return portalApi.get('/marketplace/browse', { params: filters as any });
  },

  /**
   * Get single item details
   */
  async getItem(itemId: string): Promise<Item> {
    return portalApi.get(`/marketplace/item/${itemId}`);
  },

  /**
   * Get seller public profile
   */
  async getSellerProfile(sellerId: string): Promise<SellerProfile> {
    return portalApi.get(`/marketplace/seller/${sellerId}`);
  },

  /**
   * Get seller's public items
   */
  async getSellerItems(sellerId: string, filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    return portalApi.get(`/marketplace/seller/${sellerId}/items`, { params: filters as any });
  },

  /**
   * Get categories
   */
  async getCategories(): Promise<Category[]> {
    return portalApi.get('/marketplace/categories');
  },

  /**
   * Search items
   */
  async search(query: string, filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    return portalApi.get('/marketplace/browse', {
      params: { ...filters, search: query } as any,
    });
  },
};
```

### Seller Service Example

```typescript
// src/features/portal/seller/services/itemService.ts

import { portalApi } from '@/features/portal/shared/services/apiClient';
import { Item, CreateItemData, UpdateItemData, ItemFilters, ItemStatus, ItemVisibility } from '../types/item.types';

interface SellerStats {
  totalItems: number;
  activeItems: number;
  draftItems: number;
  outOfStockItems: number;
  totalQuotes: number;
  successfulOrders: number;
  conversionRate: number;
  avgResponseTime: number;
}

interface BulkUpdateResult {
  success: boolean;
  count: number;
  failed: string[];
}

export const itemService = {
  // ─────────────────────────────────────────────────────────────
  // LISTINGS MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all seller's items with filters
   */
  async getItems(filters: ItemFilters = {}): Promise<Item[]> {
    return portalApi.get('/seller/items', { params: filters as any });
  },

  /**
   * Get seller statistics
   */
  async getStats(): Promise<SellerStats> {
    return portalApi.get('/seller/items/stats');
  },

  /**
   * Get single item
   */
  async getItem(itemId: string): Promise<Item | null> {
    return portalApi.get(`/seller/items/${itemId}`);
  },

  /**
   * Create new item
   */
  async createItem(data: CreateItemData): Promise<Item> {
    return portalApi.post('/seller/items', data);
  },

  /**
   * Update item
   */
  async updateItem(itemId: string, data: UpdateItemData): Promise<Item> {
    return portalApi.put(`/seller/items/${itemId}`, data);
  },

  /**
   * Delete item
   */
  async deleteItem(itemId: string): Promise<void> {
    return portalApi.delete(`/seller/items/${itemId}`);
  },

  /**
   * Archive item (soft delete)
   */
  async archiveItem(itemId: string): Promise<Item> {
    return portalApi.post(`/seller/items/${itemId}/archive`);
  },

  /**
   * Duplicate item
   */
  async duplicateItem(itemId: string, modifications?: Partial<CreateItemData>): Promise<Item> {
    return portalApi.post(`/seller/items/${itemId}/duplicate`, modifications);
  },

  // ─────────────────────────────────────────────────────────────
  // BULK OPERATIONS
  // ─────────────────────────────────────────────────────────────

  /**
   * Bulk update item status
   */
  async bulkUpdateStatus(itemIds: string[], status: ItemStatus): Promise<BulkUpdateResult> {
    return portalApi.post('/seller/items/bulk/status', { itemIds, status });
  },

  /**
   * Bulk update item visibility
   */
  async bulkUpdateVisibility(itemIds: string[], visibility: ItemVisibility): Promise<BulkUpdateResult> {
    return portalApi.post('/seller/items/bulk/visibility', { itemIds, visibility });
  },

  /**
   * Bulk delete items
   */
  async bulkDelete(itemIds: string[]): Promise<BulkUpdateResult> {
    return portalApi.post('/seller/items/bulk/delete', { itemIds });
  },

  // ─────────────────────────────────────────────────────────────
  // INTELLIGENCE
  // ─────────────────────────────────────────────────────────────

  /**
   * Get item performance metrics
   */
  async getItemPerformance(itemId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<ItemPerformance> {
    return portalApi.get(`/seller/items/${itemId}/performance`, { params: { period } });
  },

  /**
   * Get demand gap analysis
   */
  async getDemandGaps(): Promise<DemandGap[]> {
    return portalApi.get('/seller/items/intelligence/demand-gaps');
  },
};
```

### Backend Route Structure

```typescript
// server/src/routes/portalRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';

// Sub-routers
import buyerRoutes from './portal/buyerRoutes';
import sellerRoutes from './portal/sellerRoutes';
import marketplaceRoutes from './portal/marketplaceRoutes';
import sharedRoutes from './portal/sharedRoutes';

const router = Router();

// ─────────────────────────────────────────────────────────────
// AUTH ROUTES (No role requirement)
// ─────────────────────────────────────────────────────────────
router.get('/auth/roles', authenticateToken, async (req, res) => {
  // Return user's available roles
  const user = req.user;
  const roles = await getUserRoles(user.id);
  res.json(roles);
});

router.post('/auth/switch-role', authenticateToken, async (req, res) => {
  // Log role switch for analytics
  const { role } = req.body;
  await logRoleSwitch(req.user.id, role);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────
// BUYER ROUTES
// ─────────────────────────────────────────────────────────────
router.use(
  '/buyer',
  authenticateToken,
  requireRole(['buyer', 'admin']),
  buyerRoutes
);

// ─────────────────────────────────────────────────────────────
// SELLER ROUTES
// ─────────────────────────────────────────────────────────────
router.use(
  '/seller',
  authenticateToken,
  requireRole(['seller', 'admin']),
  sellerRoutes
);

// ─────────────────────────────────────────────────────────────
// MARKETPLACE ROUTES (Public, some require auth)
// ─────────────────────────────────────────────────────────────
router.use('/marketplace', marketplaceRoutes);

// ─────────────────────────────────────────────────────────────
// SHARED ROUTES
// ─────────────────────────────────────────────────────────────
router.use('/shared', authenticateToken, sharedRoutes);

export default router;
```

---

## Summary

This architecture provides:

1. **Clear Separation** - Buyer and Seller modules are isolated but share core infrastructure
2. **Flexible Role System** - Users can have multiple roles and switch between them
3. **Dynamic Navigation** - Sidebar adapts based on active role and permissions
4. **Consistent UI** - Shared component library ensures visual consistency
5. **Clean API Boundaries** - Services are organized by domain with clear responsibilities
6. **Scalability** - New roles (admin, warehouse, logistics) can be added without restructuring

### Key Principles

- **Composition over Inheritance** - Components compose smaller pieces
- **Co-location** - Keep related code together (types, services, components per domain)
- **Single Source of Truth** - Roles, permissions, and navigation defined once
- **Progressive Enhancement** - Start with buyer/seller, add complexity as needed
