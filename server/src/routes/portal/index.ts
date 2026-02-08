// =============================================================================
// Portal Routes - Consolidated API Surface
// =============================================================================
// This file provides a clean, organized API surface for the Portal:
//   - /api/portal/buyer/*   - Buyer operations
//   - /api/portal/seller/*  - Seller operations
//   - /api/portal/admin/*   - Admin operations
//   - /api/portal/auth/*    - Authentication (aliased from existing)
//
// All routes call existing services without refactoring internals.
// Backward compatibility aliases are maintained for old paths.
// =============================================================================

import { Router } from 'express';

// Import consolidated portal routes
import buyerRoutes from './buyerRoutes';
import sellerRoutes from './sellerRoutes';
import adminRoutes from './adminRoutes';

// Import existing routes for aliasing
import portalAuthRoutes from '../portalAuthRoutes';
import permissionRoutes from '../permissionRoutes';

const router = Router();

// =============================================================================
// MOUNT CONSOLIDATED PORTAL ROUTES
// =============================================================================

// Buyer routes: /api/portal/buyer/*
router.use('/buyer', buyerRoutes);

// Seller routes: /api/portal/seller/*
router.use('/seller', sellerRoutes);

// Admin routes: /api/portal/admin/*
router.use('/admin', adminRoutes);

// Auth routes: /api/portal/auth/*
router.use('/auth', portalAuthRoutes);

// Permission routes: /api/portal/permissions/*
router.use('/permissions', permissionRoutes);

// =============================================================================
// BACKWARD COMPATIBILITY - Old path aliases
// =============================================================================
// These aliases ensure old API paths continue to work while
// clients migrate to the new /api/portal/* structure.
// =============================================================================

// The following routes are mounted separately in index.ts for backward compat:
// - /api/items/* -> itemRoutes (contains marketplace, rfq, quotes, orders)
// - /api/buyer/* -> buyerWorkspaceRoutes
// - /api/seller/* -> sellerSettingsRoutes, sellerWorkspaceRoutes, sellerHomeRoutes
// - /api/invoices/* -> invoiceRoutes
// - /api/purchases/* -> buyerPurchasesRoutes
// - /api/buyer-cart/* -> buyerCartRoutes
// - /api/portal-admin/* -> portalAdminRoutes

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'NABD Portal API',
    version: '1.0.0',
    endpoints: {
      buyer: '/api/portal/buyer/*',
      seller: '/api/portal/seller/*',
      admin: '/api/portal/admin/*',
      auth: '/api/portal/auth/*',
      permissions: '/api/portal/permissions/*',
    },
    documentation: '/docs/runbook/PORTAL_API_SURFACE.md',
  });
});

export default router;
