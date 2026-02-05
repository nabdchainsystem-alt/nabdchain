-- AlterTable
ALTER TABLE "ItemRFQ" ADD COLUMN     "ignoredAt" TIMESTAMP(3),
ADD COLUMN     "ignoredBy" TEXT,
ADD COLUMN     "ignoredReason" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "priorityLevel" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "priorityScore" INTEGER DEFAULT 50,
ADD COLUMN     "rfqNumber" TEXT,
ADD COLUMN     "underReviewAt" TIMESTAMP(3),
ADD COLUMN     "underReviewBy" TEXT,
ADD COLUMN     "viewedAt" TIMESTAMP(3),
ADD COLUMN     "viewedBy" TEXT;

-- CreateTable
CREATE TABLE "ItemRFQEvent" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemRFQEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT,
    "rfqId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "discount" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "deliveryDays" INTEGER NOT NULL,
    "deliveryTerms" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "internalNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "discount" DOUBLE PRECISION,
    "discountPercent" DOUBLE PRECISION,
    "deliveryDays" INTEGER NOT NULL,
    "deliveryTerms" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteEvent" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "version" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemRFQEvent_rfqId_idx" ON "ItemRFQEvent"("rfqId");

-- CreateIndex
CREATE INDEX "ItemRFQEvent_rfqId_createdAt_idx" ON "ItemRFQEvent"("rfqId", "createdAt");

-- CreateIndex
CREATE INDEX "ItemRFQEvent_eventType_idx" ON "ItemRFQEvent"("eventType");

-- CreateIndex
CREATE INDEX "Quote_rfqId_idx" ON "Quote"("rfqId");

-- CreateIndex
CREATE INDEX "Quote_sellerId_idx" ON "Quote"("sellerId");

-- CreateIndex
CREATE INDEX "Quote_buyerId_idx" ON "Quote"("buyerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_sellerId_status_idx" ON "Quote"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Quote_rfqId_isLatest_idx" ON "Quote"("rfqId", "isLatest");

-- CreateIndex
CREATE INDEX "Quote_validUntil_idx" ON "Quote"("validUntil");

-- CreateIndex
CREATE INDEX "QuoteVersion_quoteId_idx" ON "QuoteVersion"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteVersion_quoteId_version_idx" ON "QuoteVersion"("quoteId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_quoteId_version_key" ON "QuoteVersion"("quoteId", "version");

-- CreateIndex
CREATE INDEX "QuoteEvent_quoteId_idx" ON "QuoteEvent"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteEvent_quoteId_createdAt_idx" ON "QuoteEvent"("quoteId", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteEvent_eventType_idx" ON "QuoteEvent"("eventType");

-- CreateIndex
CREATE INDEX "ItemRFQ_sellerId_priorityLevel_idx" ON "ItemRFQ"("sellerId", "priorityLevel");

-- CreateIndex
CREATE INDEX "ItemRFQ_viewedAt_idx" ON "ItemRFQ"("viewedAt");

-- AddForeignKey
ALTER TABLE "ItemRFQEvent" ADD CONSTRAINT "ItemRFQEvent_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "ItemRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "ItemRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEvent" ADD CONSTRAINT "QuoteEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
