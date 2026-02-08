/**
 * Test Setup — Prisma Mock
 *
 * Exports a deep-mocked PrismaClient. Test files should:
 *   1. Call vi.mock() for prisma and logger DIRECTLY (for hoisting)
 *   2. Import prismaMock from this file for configuring return values
 *   3. Call resetMocks() in beforeEach
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Build a generic model mock
// ---------------------------------------------------------------------------

function createModelMock() {
  return {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    createMany: vi.fn(),
    groupBy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// The mock prisma instance — tests configure per-scenario
// ---------------------------------------------------------------------------

export const prismaMock = {
  marketplaceOrder: createModelMock(),
  marketplaceOrderAudit: createModelMock(),
  item: createModelMock(),
  user: createModelMock(),
  sellerProfile: createModelMock(),
  buyerProfile: createModelMock(),
  workspace: createModelMock(),
  board: createModelMock(),
  room: createModelMock(),
  row: createModelMock(),
  rfq: createModelMock(),
  quote: createModelMock(),
  dispute: createModelMock(),
  invoice: createModelMock(),
  // Dispute models
  marketplaceDispute: createModelMock(),
  marketplaceDisputeEvent: createModelMock(),
  // Invoice model (marketplace)
  marketplaceInvoice: createModelMock(),
  // Payout models
  sellerPayout: createModelMock(),
  payoutEvent: createModelMock(),
  payoutLineItem: createModelMock(),
  sellerPayoutSettings: createModelMock(),
  // Seller onboarding models
  sellerBank: createModelMock(),
  sellerCompany: createModelMock(),
  sellerAddress: createModelMock(),
  sellerContact: createModelMock(),
  // Item RFQ
  itemRFQ: createModelMock(),
  itemRFQEvent: createModelMock(),
  // Quote models
  quoteEvent: createModelMock(),
  quoteVersion: createModelMock(),
  // Counter-offer models
  counterOffer: createModelMock(),
  counterOfferEvent: createModelMock(),
  // Return models
  marketplaceReturn: createModelMock(),
  marketplaceReturnEvent: createModelMock(),
  // Legacy migration
  portalProduct: createModelMock(),
  // Automation models
  automationRule: createModelMock(),
  automationExecution: createModelMock(),
  // Trust models
  trustScore: createModelMock(),
  // RFQ model (Prisma uses rFQ for model named RFQ)
  rFQ: createModelMock(),
  // Seller audit
  sellerAuditLog: createModelMock(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn((fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock)),
};

// ---------------------------------------------------------------------------
// Reset helper — call in beforeEach
// ---------------------------------------------------------------------------

export function resetMocks(): void {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    } else if (typeof model === 'function' && 'mockReset' in model) {
      (model as ReturnType<typeof vi.fn>).mockReset();
    }
  });
  prismaMock.$transaction.mockImplementation(
    (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
  );
}
