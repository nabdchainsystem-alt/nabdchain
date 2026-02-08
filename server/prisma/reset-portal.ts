// =============================================================================
// Portal Data Reset Script
// =============================================================================
// Removes ALL portal-related data from the database so you can start fresh.
// Run with: npx tsx prisma/reset-portal.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetPortalData() {
  console.log('🧹 Resetting all portal data...\n');

  // =========================================================================
  // Phase 1: Event/audit tables (leaf nodes, no dependents)
  // =========================================================================
  console.log('Phase 1: Clearing event & audit logs...');

  const phase1 = await Promise.all([
    prisma.itemRFQEvent.deleteMany(),
    prisma.marketplaceRFQEvent.deleteMany(),
    prisma.marketplaceRFQMessage.deleteMany(),
    prisma.quoteEvent.deleteMany(),
    prisma.quoteVersion.deleteMany(),
    prisma.quoteAttachment.deleteMany(),
    prisma.counterOfferEvent.deleteMany(),
    prisma.marketplaceOrderAudit.deleteMany(),
    prisma.marketplaceInvoiceEvent.deleteMany(),
    prisma.marketplaceDisputeEvent.deleteMany(),
    prisma.marketplaceReturnEvent.deleteMany(),
    prisma.payoutEvent.deleteMany(),
    prisma.sellerAuditLog.deleteMany(),
    prisma.portalAdminAuditLog.deleteMany(),
    prisma.auditAlert.deleteMany(),
    prisma.automationExecution.deleteMany(),
    prisma.sLARecord.deleteMany(),
    prisma.trustEvent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.notificationPreference.deleteMany(),
  ]);
  console.log(`  Deleted from ${phase1.length} event/audit tables`);

  // =========================================================================
  // Phase 2: Child records (depend on main entities)
  // =========================================================================
  console.log('Phase 2: Clearing child records...');

  const phase2 = await Promise.all([
    // RFQ inbox management
    prisma.rFQLabelAssignment.deleteMany(),
    prisma.rFQNote.deleteMany(),
    prisma.rFQSnooze.deleteMany(),
    prisma.rFQLabel.deleteMany(),
    prisma.savedReply.deleteMany(),

    // Cart items
    prisma.buyerCartItem.deleteMany(),

    // Purchase order items
    prisma.buyerPurchaseOrderItem.deleteMany(),

    // Payout line items
    prisma.payoutLineItem.deleteMany(),

    // Stock & cost tracking
    prisma.stockAdjustment.deleteMany(),
    prisma.itemCostTag.deleteMany(),

    // Intelligence & analytics
    prisma.buyerPriceHistory.deleteMany(),
    prisma.buyerSupplierMetrics.deleteMany(),
    prisma.buyerIntelligenceProfile.deleteMany(),
    prisma.sellerIntelligenceProfile.deleteMany(),
    prisma.priceFairnessSnapshot.deleteMany(),
    prisma.trustFeatureGate.deleteMany(),
    prisma.relationshipTrust.deleteMany(),
    prisma.trustScore.deleteMany(),

    // Seller documents
    prisma.sellerDocument.deleteMany(),
  ]);
  console.log(`  Deleted from ${phase2.length} child tables`);

  // =========================================================================
  // Phase 3: Returns & Disputes (depend on orders)
  // =========================================================================
  console.log('Phase 3: Clearing returns & disputes...');

  // Returns first (depend on disputes)
  await prisma.marketplaceReturn.deleteMany();
  await prisma.marketplaceDispute.deleteMany();
  console.log('  Cleared returns & disputes');

  // =========================================================================
  // Phase 4: Payments & Invoices (depend on orders)
  // =========================================================================
  console.log('Phase 4: Clearing payments & invoices...');

  await prisma.marketplacePayment.deleteMany();
  await prisma.marketplaceInvoice.deleteMany();
  await prisma.sellerInvoice.deleteMany();
  console.log('  Cleared payments & invoices');

  // =========================================================================
  // Phase 5: Counter offers & Quotes (depend on RFQs)
  // =========================================================================
  console.log('Phase 5: Clearing counter offers & quotes...');

  await prisma.counterOffer.deleteMany();
  await prisma.quote.deleteMany();
  console.log('  Cleared counter offers & quotes');

  // =========================================================================
  // Phase 6: Orders (depend on items, buyers, sellers)
  // =========================================================================
  console.log('Phase 6: Clearing orders...');

  await prisma.marketplaceOrder.deleteMany();
  console.log('  Cleared orders');

  // =========================================================================
  // Phase 7: Payouts
  // =========================================================================
  console.log('Phase 7: Clearing payouts...');

  await prisma.sellerPayout.deleteMany();
  await prisma.sellerPayoutSettings.deleteMany();
  console.log('  Cleared payouts');

  // =========================================================================
  // Phase 8: RFQs (depend on items, buyers)
  // =========================================================================
  console.log('Phase 8: Clearing RFQs...');

  await prisma.itemRFQ.deleteMany();
  await prisma.marketplaceRFQ.deleteMany();
  console.log('  Cleared RFQs');

  // =========================================================================
  // Phase 9: Items & Products
  // =========================================================================
  console.log('Phase 9: Clearing items & products...');

  await prisma.item.deleteMany();
  await prisma.portalProduct.deleteMany();
  console.log('  Cleared items & products');

  // =========================================================================
  // Phase 10: Buyer workspace data
  // =========================================================================
  console.log('Phase 10: Clearing buyer workspace...');

  await Promise.all([
    prisma.buyerCart.deleteMany(),
    prisma.buyerExpense.deleteMany(),
    prisma.buyerInventory.deleteMany(),
    prisma.buyerSupplier.deleteMany(),
    prisma.buyerPurchaseOrder.deleteMany(),
  ]);
  console.log('  Cleared buyer workspace');

  // =========================================================================
  // Phase 11: Seller config & health
  // =========================================================================
  console.log('Phase 11: Clearing seller config & health...');

  await Promise.all([
    prisma.automationRule.deleteMany(),
    prisma.rFQScoringConfig.deleteMany(),
    prisma.sellerRateLimit.deleteMany(),
    prisma.sellerHealthScore.deleteMany(),
    prisma.sellerBuyerProfile.deleteMany(),
    prisma.matchingWeightsConfig.deleteMany(),
  ]);
  console.log('  Cleared seller config & health');

  // =========================================================================
  // Phase 12: Profiles (depend on users)
  // =========================================================================
  console.log('Phase 12: Clearing profiles...');

  // Seller sub-profiles first
  await Promise.all([
    prisma.sellerCompany.deleteMany(),
    prisma.sellerAddress.deleteMany(),
    prisma.sellerBank.deleteMany(),
    prisma.sellerContact.deleteMany(),
  ]);

  await prisma.sellerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  console.log('  Cleared all buyer & seller profiles');

  // =========================================================================
  // Phase 13: Portal users (users with portalRole set)
  // =========================================================================
  console.log('Phase 13: Clearing portal users...');

  const portalUsers = await prisma.user.deleteMany({
    where: {
      portalRole: { not: null },
    },
  });
  console.log(`  Deleted ${portalUsers.count} portal users`);

  // =========================================================================
  // Phase 14: System tables cleanup
  // =========================================================================
  console.log('Phase 14: Clearing system tables...');

  await Promise.all([
    prisma.idempotencyKey.deleteMany(),
    prisma.eventOutboxDLQ.deleteMany(),
    prisma.eventOutbox.deleteMany(),
    prisma.jobQueueDLQ.deleteMany(),
    prisma.jobQueue.deleteMany(),
  ]);
  console.log('  Cleared system tables');

  console.log('\n✅ Portal data reset complete! Database is clean and ready for fresh testing.');
}

resetPortalData()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
