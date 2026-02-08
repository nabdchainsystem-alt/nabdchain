-- Schema Optimization: Add Missing Indexes
-- Generated: February 2026
-- Purpose: Improve query performance on frequently filtered columns

-- Activity: Add type index for filtering by activity type
CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"("type");

-- Quote: Add createdAt index for time-series queries
CREATE INDEX IF NOT EXISTS "Quote_createdAt_idx" ON "Quote"("createdAt");

-- CounterOffer: Add createdAt index for time-series queries
CREATE INDEX IF NOT EXISTS "CounterOffer_createdAt_idx" ON "CounterOffer"("createdAt");

-- MarketplaceDispute: Add createdAt index for time-series queries
CREATE INDEX IF NOT EXISTS "MarketplaceDispute_createdAt_idx" ON "MarketplaceDispute"("createdAt");

-- MarketplaceReturn: Add createdAt index for time-series queries
CREATE INDEX IF NOT EXISTS "MarketplaceReturn_createdAt_idx" ON "MarketplaceReturn"("createdAt");

-- MarketplaceOrder: Add createdAt index for time-series dashboard queries
CREATE INDEX IF NOT EXISTS "MarketplaceOrder_createdAt_idx" ON "MarketplaceOrder"("createdAt");

-- SellerInvoice: Add dueDate index for filtering overdue invoices
CREATE INDEX IF NOT EXISTS "SellerInvoice_dueDate_idx" ON "SellerInvoice"("dueDate");

-- SellerInvoice: Add createdAt index for time-series queries
CREATE INDEX IF NOT EXISTS "SellerInvoice_createdAt_idx" ON "SellerInvoice"("createdAt");
