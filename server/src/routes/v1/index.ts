/**
 * V1 API Routes Aggregator
 *
 * This file aggregates all v1 API routes for versioned API access.
 * Mount under /api/v1 for explicit versioning.
 *
 * The original /api/* routes remain mounted for backward compatibility.
 */

import { Router } from 'express';

// Import all route modules
import authRoutes from '../authRoutes';
import portalAuthRoutes from '../portalAuthRoutes';
import emailRoutes from '../emailRoutes';
import inviteRoutes from '../inviteRoutes';
import teamRoutes from '../teamRoutes';
import boardRoutes from '../boardRoutes';
import roomRoutes from '../roomRoutes';
import vaultRoutes from '../vaultRoutes';
import docRoutes from '../docRoutes';
import talkRoutes from '../talkRoutes';
import assignmentRoutes from '../assignmentRoutes';
import adminRoutes from '../adminRoutes';
import userRoutes from '../userRoutes';
import uploadRoutes from '../uploadRoutes';
import aiRoutes from '../aiRoutes';
import gtdRoutes from '../gtdRoutes';
import notesRoutes from '../notesRoutes';
import mobileRoutes from '../mobileRoutes';
import commentsRoutes from '../commentsRoutes';
import notificationsRoutes from '../notificationsRoutes';
import timeTrackingRoutes from '../timeTrackingRoutes';
import templatesRoutes from '../templatesRoutes';
import portalRoutes from '../portalRoutes';
import itemRoutes from '../itemRoutes';
import orderRoutes from '../orderRoutes';
import orderTimelineRoutes from '../orderTimelineRoutes';
import dashboardRoutes from '../dashboardRoutes';
import customerRoutes from '../customerRoutes';
import inventoryRoutes from '../inventoryRoutes';
import expenseRoutes from '../expenseRoutes';
import buyerWorkspaceRoutes from '../buyerWorkspaceRoutes';
import sellerSettingsRoutes from '../sellerSettingsRoutes';
import sellerWorkspaceRoutes from '../sellerWorkspaceRoutes';
import sellerHomeRoutes from '../sellerHomeRoutes';
import publicSellerRoutes from '../publicSellerRoutes';
import buyerPurchasesRoutes from '../buyerPurchasesRoutes';
import buyerCartRoutes from '../buyerCartRoutes';
import invoiceRoutes from '../invoiceRoutes';
import paymentRoutes from '../paymentRoutes';
import disputeRoutes from '../disputeRoutes';
import returnRoutes from '../returnRoutes';
import payoutRoutes from '../payoutRoutes';
import automationRoutes from '../automationRoutes';
import trustRoutes from '../trustRoutes';
import featureGatingRoutes from '../featureGatingRoutes';
import analyticsRoutes from '../analyticsRoutes';
import rfqMarketplaceRoutes from '../rfqMarketplaceRoutes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);
router.use('/auth/portal', portalAuthRoutes);

// Core workspace routes
router.use('/email', emailRoutes);
router.use('/invite', inviteRoutes);
router.use('/team', teamRoutes);
router.use('/boards', boardRoutes);
router.use('/', roomRoutes);  // Handles /rooms, /rows, /columns at root
router.use('/vault', vaultRoutes);
router.use('/docs', docRoutes);
router.use('/talk', talkRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/gtd', gtdRoutes);
router.use('/notes', notesRoutes);
router.use('/mobile', mobileRoutes);
router.use('/comments', commentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/time-entries', timeTrackingRoutes);
router.use('/templates', templatesRoutes);

// Portal routes
router.use('/portal', portalRoutes);

// Marketplace routes
router.use('/items', itemRoutes);
router.use('/orders', orderRoutes);
router.use('/orders', orderTimelineRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/expenses', expenseRoutes);

// Buyer routes
router.use('/buyer', buyerWorkspaceRoutes);
router.use('/purchases', buyerPurchasesRoutes);
router.use('/buyer-cart', buyerCartRoutes);

// Seller routes
router.use('/seller', sellerSettingsRoutes);
router.use('/seller', sellerWorkspaceRoutes);
router.use('/seller', sellerHomeRoutes);
router.use('/public', publicSellerRoutes);

// Financial routes
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/payouts', payoutRoutes);

// Dispute & Returns
router.use('/disputes', disputeRoutes);
router.use('/returns', returnRoutes);

// System routes
router.use('/automation', automationRoutes);
router.use('/trust', trustRoutes);
router.use('/gating', featureGatingRoutes);
router.use('/analytics', analyticsRoutes);

// RFQ Marketplace routes
router.use('/rfq-marketplace', rfqMarketplaceRoutes);

export default router;
