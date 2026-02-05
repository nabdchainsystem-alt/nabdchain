-- Add Buy Now eligibility fields to Item model
-- These fields enable dual purchase flow: Buy Now (instant) + Request Quote (RFQ)

-- Add allowDirectPurchase: Controls whether seller allows direct purchase without RFQ
ALTER TABLE "Item" ADD COLUMN "allowDirectPurchase" BOOLEAN NOT NULL DEFAULT true;

-- Add isFixedPrice: Indicates if price is fixed or requires negotiation
ALTER TABLE "Item" ADD COLUMN "isFixedPrice" BOOLEAN NOT NULL DEFAULT true;
