/**
 * Test Data Factories
 *
 * Helpers that return realistic-looking domain objects with sensible
 * defaults.  Every field can be overridden via a partial argument.
 */

let counter = 0;
function nextId(): string {
  counter += 1;
  return `test-id-${counter}`;
}

// ---------------------------------------------------------------------------
// Marketplace Order
// ---------------------------------------------------------------------------

export interface MockOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  itemId: string;
  itemName: string;
  itemSku: string | null;
  itemImage: string | null;
  rfqId: string | null;
  rfqNumber: string | null;
  quoteId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  source: string;
  shippingAddress: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  internalNotes: string | null;
  buyerName: string;
  buyerEmail: string | null;
  buyerCompany: string | null;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  const id = overrides.id ?? nextId();
  return {
    id,
    orderNumber: `ORD-2026-0001`,
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    itemId: 'item-1',
    itemName: 'Test Widget',
    itemSku: 'TW-001',
    itemImage: null,
    rfqId: null,
    rfqNumber: null,
    quoteId: null,
    quantity: 10,
    unitPrice: 25,
    totalPrice: 250,
    currency: 'SAR',
    status: 'pending_confirmation',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'not_started',
    source: 'direct_buy',
    shippingAddress: null,
    trackingNumber: null,
    carrier: null,
    estimatedDelivery: null,
    buyerNotes: null,
    sellerNotes: null,
    internalNotes: null,
    buyerName: 'Test Buyer',
    buyerEmail: 'buyer@test.com',
    buyerCompany: 'Test Corp',
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Marketplace Order Audit
// ---------------------------------------------------------------------------

export interface MockAudit {
  id: string;
  orderId: string;
  action: string;
  actor: string;
  actorId: string;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: Date;
}

export function createMockAudit(overrides: Partial<MockAudit> = {}): MockAudit {
  return {
    id: nextId(),
    orderId: 'order-1',
    action: 'created',
    actor: 'buyer',
    actorId: 'buyer-1',
    previousValue: null,
    newValue: null,
    metadata: null,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Item (used by createOrder)
// ---------------------------------------------------------------------------

export interface MockItem {
  id: string;
  name: string;
  sku: string;
  userId: string;
  status: string;
  images: string | null;
  currency: string;
  price: number;
  successfulOrders: number;
}

export function createMockItem(overrides: Partial<MockItem> = {}): MockItem {
  return {
    id: 'item-1',
    name: 'Test Widget',
    sku: 'TW-001',
    userId: 'seller-1',
    status: 'active',
    images: JSON.stringify(['https://example.com/img1.jpg']),
    currency: 'SAR',
    price: 25,
    successfulOrders: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Full Item (used by itemService tests)
// ---------------------------------------------------------------------------

export interface MockFullItem {
  id: string;
  userId: string;
  name: string;
  nameAr: string | null;
  sku: string;
  partNumber: string | null;
  description: string | null;
  descriptionAr: string | null;
  itemType: string;
  category: string;
  subcategory: string | null;
  visibility: string;
  status: string;
  price: number;
  currency: string;
  priceUnit: string | null;
  stock: number;
  minOrderQty: number;
  maxOrderQty: number | null;
  leadTimeDays: number | null;
  manufacturer: string | null;
  brand: string | null;
  origin: string | null;
  specifications: string | null;
  compatibility: string | null;
  packaging: string | null;
  images: string | null;
  documents: string | null;
  totalQuotes: number;
  successfulOrders: number;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockFullItem(overrides: Partial<MockFullItem> = {}): MockFullItem {
  const id = overrides.id ?? nextId();
  return {
    id,
    userId: 'seller-1',
    name: 'Industrial Bearing',
    nameAr: null,
    sku: 'BRG-001',
    partNumber: 'PN-001',
    description: 'High-quality bearing',
    descriptionAr: null,
    itemType: 'part',
    category: 'Bearings',
    subcategory: 'Ball Bearings',
    visibility: 'public',
    status: 'active',
    price: 150,
    currency: 'SAR',
    priceUnit: 'piece',
    stock: 100,
    minOrderQty: 1,
    maxOrderQty: 500,
    leadTimeDays: 5,
    manufacturer: 'SKF',
    brand: 'SKF',
    origin: 'SE',
    specifications: null,
    compatibility: null,
    packaging: null,
    images: JSON.stringify(['https://example.com/bearing.jpg']),
    documents: null,
    totalQuotes: 3,
    successfulOrders: 10,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-10T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Dispute
// ---------------------------------------------------------------------------

export interface MockDispute {
  id: string;
  disputeNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerCompany: string | null;
  sellerName: string;
  sellerCompany: string | null;
  itemId: string;
  itemName: string;
  itemSku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  reason: string;
  description: string;
  requestedResolution: string | null;
  requestedAmount: number | null;
  evidence: string | null;
  status: string;
  priorityLevel: string;
  sellerResponseType: string | null;
  sellerResponse: string | null;
  sellerProposedResolution: string | null;
  sellerProposedAmount: number | null;
  resolution: string | null;
  resolutionAmount: number | null;
  resolvedBy: string | null;
  respondedAt: Date | null;
  responseDeadline: Date | null;
  resolutionDeadline: Date | null;
  closedAt: Date | null;
  isEscalated: boolean;
  escalatedAt: Date | null;
  escalationReason: string | null;
  hasException: boolean;
  exceptionType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockDispute(overrides: Partial<MockDispute> = {}): MockDispute {
  const id = overrides.id ?? nextId();
  return {
    id,
    disputeNumber: 'DSP-2026-0001',
    orderId: 'order-1',
    orderNumber: 'ORD-2026-0001',
    invoiceId: null,
    invoiceNumber: null,
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    buyerName: 'Test Buyer',
    buyerEmail: 'buyer@test.com',
    buyerCompany: 'Test Corp',
    sellerName: 'Test Seller',
    sellerCompany: 'Seller Corp',
    itemId: 'item-1',
    itemName: 'Test Widget',
    itemSku: 'TW-001',
    quantity: 10,
    unitPrice: 25,
    totalPrice: 250,
    currency: 'SAR',
    reason: 'damaged_goods',
    description: 'Items arrived damaged',
    requestedResolution: 'full_refund',
    requestedAmount: 250,
    evidence: null,
    status: 'open',
    priorityLevel: 'medium',
    sellerResponseType: null,
    sellerResponse: null,
    sellerProposedResolution: null,
    sellerProposedAmount: null,
    resolution: null,
    resolutionAmount: null,
    resolvedBy: null,
    respondedAt: null,
    responseDeadline: new Date('2026-01-17T10:00:00Z'),
    resolutionDeadline: new Date('2026-01-22T10:00:00Z'),
    closedAt: null,
    isEscalated: false,
    escalatedAt: null,
    escalationReason: null,
    hasException: false,
    exceptionType: null,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Seller Payout
// ---------------------------------------------------------------------------

export interface MockPayout {
  id: string;
  payoutNumber: string;
  sellerId: string;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  platformFeeTotal: number;
  netAmount: number;
  currency: string;
  status: string;
  bankName: string;
  accountHolder: string;
  ibanMasked: string;
  bankReference: string | null;
  bankConfirmationDate: Date | null;
  initiatedAt: Date | null;
  initiatedBy: string | null;
  settledAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  holdReason: string | null;
  holdUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockPayout(overrides: Partial<MockPayout> = {}): MockPayout {
  const id = overrides.id ?? nextId();
  return {
    id,
    payoutNumber: 'PAY-OUT-2026-0001',
    sellerId: 'seller-1',
    periodStart: new Date('2026-01-01T00:00:00Z'),
    periodEnd: new Date('2026-01-07T00:00:00Z'),
    grossAmount: 5000,
    platformFeeTotal: 125,
    netAmount: 4875,
    currency: 'SAR',
    status: 'pending',
    bankName: 'Al Rajhi Bank',
    accountHolder: 'Test Seller',
    ibanMasked: '****1234',
    bankReference: null,
    bankConfirmationDate: null,
    initiatedAt: null,
    initiatedBy: null,
    settledAt: null,
    failedAt: null,
    failureReason: null,
    holdReason: null,
    holdUntil: null,
    createdAt: new Date('2026-01-08T00:00:00Z'),
    updatedAt: new Date('2026-01-08T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// User (for portal auth tests)
// ---------------------------------------------------------------------------

export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  portalRole: string | null;
  portalStatus: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  companyName: string | null;
  passwordHash: string | null;
  avatarUrl: string | null;
  buyerProfile: MockBuyerProfile | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = overrides.id ?? `usr_${nextId()}`;
  return {
    id,
    email: 'user@test.com',
    name: 'Test User',
    portalRole: 'buyer',
    portalStatus: 'active',
    emailVerified: false,
    phoneNumber: null,
    companyName: 'Test Corp',
    passwordHash: null,
    avatarUrl: null,
    buyerProfile: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Buyer Profile
// ---------------------------------------------------------------------------

export interface MockBuyerProfile {
  id: string;
  userId: string;
  fullName: string;
  companyName: string;
  phoneNumber: string | null;
  country: string | null;
  city: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockBuyerProfile(overrides: Partial<MockBuyerProfile> = {}): MockBuyerProfile {
  const id = overrides.id ?? nextId();
  return {
    id,
    userId: 'usr-1',
    fullName: 'Test Buyer',
    companyName: 'Test Corp',
    phoneNumber: null,
    country: 'SA',
    city: 'Riyadh',
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Seller Profile
// ---------------------------------------------------------------------------

export interface MockSellerProfile {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
  profileComplete: boolean;
  companyVerified: boolean;
  bankVerified: boolean;
  documentsVerified: boolean;
  canPublish: boolean;
  company: any;
  address: any;
  contact: any;
  bank: any;
  documents: any[];
  createdAt: Date;
  updatedAt: Date;
}

export function createMockSellerProfile(overrides: Partial<MockSellerProfile> = {}): MockSellerProfile {
  const id = overrides.id ?? nextId();
  return {
    id,
    userId: 'usr-1',
    displayName: 'Test Seller Store',
    slug: 'test-seller-store',
    shortDescription: null,
    logoUrl: null,
    coverUrl: null,
    status: 'incomplete',
    profileComplete: false,
    companyVerified: false,
    bankVerified: false,
    documentsVerified: false,
    canPublish: false,
    company: null,
    address: null,
    contact: null,
    bank: null,
    documents: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset counter between test files
// ---------------------------------------------------------------------------

export function resetFactoryCounter(): void {
  counter = 0;
}
