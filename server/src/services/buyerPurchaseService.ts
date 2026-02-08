// =============================================================================
// Buyer Purchase Service - Purchase Intelligence & Analytics
// =============================================================================

import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export type OrderHealthStatus = 'on_track' | 'at_risk' | 'delayed' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type SavingsCategory = 'good_deal' | 'average' | 'overpaying';
export type PriceTrend = 'up' | 'down' | 'stable';

export interface PurchaseFilters {
  status?: string;
  healthStatus?: OrderHealthStatus | 'all';
  urgency?: UrgencyLevel | 'all';
  savings?: SavingsCategory | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
}

export interface PriceComparison {
  currentPrice: number;
  historicalAvg: number;
  historicalMin: number;
  historicalMax: number;
  variance: number;
  trend: PriceTrend;
  recommendation: SavingsCategory;
  purchaseCount: number;
}

export interface SupplierMetrics {
  sellerId: string;
  sellerName: string;
  onTimeDeliveryRate: number;
  qualityScore: number;
  totalOrders: number;
  issueCount: number;
  avgDeliveryDays: number | null;
  reliabilityTier: 'excellent' | 'good' | 'average' | 'poor';
}

export interface PurchaseTimelineEvent {
  id: string;
  state: 'created' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered';
  label: string;
  actualDate?: string;
  expectedDate?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isDelayed: boolean;
  delayDays?: number;
}

export interface PurchaseStats {
  totalSpend: number;
  activeOrders: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  potentialSavings: number;
  currency: string;
}

// =============================================================================
// Core Queries
// =============================================================================

/**
 * Get buyer purchases with intelligence data
 */
export async function getBuyerPurchases(buyerId: string, filters: PurchaseFilters = {}) {
  const where: Record<string, unknown> = { buyerId };

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  if (filters.healthStatus && filters.healthStatus !== 'all') {
    where.healthStatus = filters.healthStatus;
  }

  if (filters.sellerId) {
    where.sellerId = filters.sellerId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, Date>).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, Date>).lte = new Date(filters.dateTo);
    }
  }

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { itemName: { contains: filters.search, mode: 'insensitive' } },
      { itemSku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const orders = await prisma.marketplaceOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Apply urgency and savings filters in memory (calculated fields)
  let filteredOrders = orders;

  if (filters.urgency && filters.urgency !== 'all') {
    filteredOrders = filteredOrders.filter(order => {
      const urgency = calculateUrgencyLevel(order);
      return urgency === filters.urgency;
    });
  }

  if (filters.savings && filters.savings !== 'all') {
    filteredOrders = filteredOrders.filter(order => {
      const savings = getSavingsCategory(order.priceVariance);
      return savings === filters.savings;
    });
  }

  // Enrich with calculated urgency
  return filteredOrders.map(order => ({
    ...order,
    calculatedUrgency: calculateUrgencyLevel(order),
    savingsCategory: getSavingsCategory(order.priceVariance),
  }));
}

/**
 * Get single purchase with full details
 */
export async function getBuyerPurchase(buyerId: string, orderId: string) {
  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, buyerId },
  });

  if (!order) return null;

  // Get audit log for timeline
  const auditLog = await prisma.marketplaceOrderAudit.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });

  return {
    ...order,
    calculatedUrgency: calculateUrgencyLevel(order),
    savingsCategory: getSavingsCategory(order.priceVariance),
    auditLog,
  };
}

/**
 * Get purchase statistics for buyer dashboard
 */
export async function getBuyerPurchaseStats(buyerId: string): Promise<PurchaseStats> {
  const orders = await prisma.marketplaceOrder.findMany({
    where: { buyerId },
  });

  const activeStatuses = ['pending_confirmation', 'confirmed', 'in_progress', 'shipped'];
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status));

  const totalSpend = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const onTrack = orders.filter(o => o.healthStatus === 'on_track' && activeStatuses.includes(o.status)).length;
  const atRisk = orders.filter(o => o.healthStatus === 'at_risk').length;
  const delayed = orders.filter(o => o.healthStatus === 'delayed').length;
  const critical = orders.filter(o => o.healthStatus === 'critical').length;

  // Calculate potential savings (sum of positive variance * price for overpaying orders)
  const potentialSavings = orders
    .filter(o => (o.priceVariance ?? 0) > 5 && activeStatuses.includes(o.status))
    .reduce((sum, o) => {
      const variance = o.priceVariance ?? 0;
      return sum + (o.totalPrice * variance / 100);
    }, 0);

  return {
    totalSpend,
    activeOrders: activeOrders.length,
    onTrack,
    atRisk,
    delayed,
    critical,
    potentialSavings: Math.round(potentialSavings),
    currency: 'SAR',
  };
}

// =============================================================================
// Price Intelligence
// =============================================================================

/**
 * Calculate price comparison for an item SKU
 */
export async function calculatePriceComparison(
  buyerId: string,
  itemSku: string,
  currentPrice: number
): Promise<PriceComparison | null> {
  const history = await prisma.buyerPriceHistory.findMany({
    where: { buyerId, itemSku },
    orderBy: { orderDate: 'desc' },
  });

  if (history.length === 0) {
    return null;
  }

  const prices = history.map(h => h.unitPrice);
  const historicalAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const historicalMin = Math.min(...prices);
  const historicalMax = Math.max(...prices);

  const variance = ((currentPrice - historicalAvg) / historicalAvg) * 100;
  const trend = calculatePriceTrend(history);
  const recommendation = getSavingsCategory(variance);

  return {
    currentPrice,
    historicalAvg: Math.round(historicalAvg * 100) / 100,
    historicalMin,
    historicalMax,
    variance: Math.round(variance * 10) / 10,
    trend,
    recommendation,
    purchaseCount: history.length,
  };
}

/**
 * Get price history for an item SKU
 */
export async function getPriceHistory(buyerId: string, itemSku: string) {
  return prisma.buyerPriceHistory.findMany({
    where: { buyerId, itemSku },
    orderBy: { orderDate: 'desc' },
    take: 20,
  });
}

/**
 * Record price history entry when order is delivered
 */
export async function recordPriceHistory(
  buyerId: string,
  order: {
    id: string;
    itemSku: string;
    itemName: string;
    sellerId: string;
    unitPrice: number;
    quantity: number;
    currency: string;
    createdAt: Date;
  },
  sellerName: string
) {
  return prisma.buyerPriceHistory.create({
    data: {
      buyerId,
      itemSku: order.itemSku,
      itemName: order.itemName,
      sellerId: order.sellerId,
      sellerName,
      unitPrice: order.unitPrice,
      quantity: order.quantity,
      currency: order.currency,
      orderId: order.id,
      orderDate: order.createdAt,
    },
  });
}

// =============================================================================
// Supplier Intelligence
// =============================================================================

/**
 * Get supplier metrics for a specific seller
 */
export async function getSupplierMetrics(buyerId: string, sellerId: string): Promise<SupplierMetrics | null> {
  const metrics = await prisma.buyerSupplierMetrics.findUnique({
    where: { buyerId_sellerId: { buyerId, sellerId } },
  });

  if (!metrics) {
    // Calculate on-the-fly if not stored
    return calculateSupplierMetrics(buyerId, sellerId);
  }

  return {
    sellerId: metrics.sellerId,
    sellerName: metrics.sellerName,
    onTimeDeliveryRate: metrics.onTimeDeliveryRate,
    qualityScore: metrics.qualityScore,
    totalOrders: metrics.totalOrders,
    issueCount: metrics.issueCount,
    avgDeliveryDays: metrics.avgDeliveryDays,
    reliabilityTier: getReliabilityTier(metrics),
  };
}

/**
 * Calculate supplier metrics from order history
 */
export async function calculateSupplierMetrics(buyerId: string, sellerId: string): Promise<SupplierMetrics | null> {
  const orders = await prisma.marketplaceOrder.findMany({
    where: { buyerId, sellerId },
  });

  if (orders.length === 0) return null;

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Calculate on-time delivery rate
  let onTimeCount = 0;
  let deliveryDaysTotal = 0;
  let deliveryDaysCount = 0;

  for (const order of deliveredOrders) {
    if (order.deliveredAt && order.deliveryDeadline) {
      if (new Date(order.deliveredAt) <= new Date(order.deliveryDeadline)) {
        onTimeCount++;
      }
    }
    if (order.daysToDeliver) {
      deliveryDaysTotal += order.daysToDeliver;
      deliveryDaysCount++;
    }
  }

  const onTimeDeliveryRate = deliveredOrders.length > 0
    ? (onTimeCount / deliveredOrders.length) * 100
    : 0;

  const avgDeliveryDays = deliveryDaysCount > 0
    ? deliveryDaysTotal / deliveryDaysCount
    : null;

  // Count orders with exceptions
  const issueCount = orders.filter(o => o.hasException).length;

  // Get seller name from first order
  const sellerName = orders[0]?.itemName ? 'Supplier' : 'Unknown'; // Would need to join with seller profile

  const totalSpend = deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const metrics = {
    sellerId,
    sellerName,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    qualityScore: calculateQualityScore(orders),
    totalOrders: orders.length,
    issueCount,
    avgDeliveryDays: avgDeliveryDays ? Math.round(avgDeliveryDays * 10) / 10 : null,
    reliabilityTier: 'average' as 'excellent' | 'good' | 'average' | 'poor',
  };

  metrics.reliabilityTier = getReliabilityTier({
    onTimeDeliveryRate: metrics.onTimeDeliveryRate,
    qualityScore: metrics.qualityScore,
    issueCount: metrics.issueCount,
  });

  // Upsert metrics for caching
  await prisma.buyerSupplierMetrics.upsert({
    where: { buyerId_sellerId: { buyerId, sellerId } },
    create: {
      buyerId,
      sellerId,
      sellerName: metrics.sellerName,
      totalOrders: metrics.totalOrders,
      completedOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalSpend,
      onTimeDeliveryRate: metrics.onTimeDeliveryRate,
      avgDeliveryDays: metrics.avgDeliveryDays,
      qualityScore: metrics.qualityScore,
      issueCount: metrics.issueCount,
      lastOrderDate: orders[0]?.createdAt,
      firstOrderDate: orders[orders.length - 1]?.createdAt,
      avgOrderValue: orders.length > 0 ? totalSpend / deliveredOrders.length : 0,
    },
    update: {
      totalOrders: metrics.totalOrders,
      completedOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalSpend,
      onTimeDeliveryRate: metrics.onTimeDeliveryRate,
      avgDeliveryDays: metrics.avgDeliveryDays,
      qualityScore: metrics.qualityScore,
      issueCount: metrics.issueCount,
      lastOrderDate: orders[0]?.createdAt,
      avgOrderValue: deliveredOrders.length > 0 ? totalSpend / deliveredOrders.length : 0,
    },
  });

  return metrics;
}

/**
 * Update supplier metrics when order status changes
 */
export async function updateSupplierMetricsOnOrderChange(buyerId: string, sellerId: string) {
  return calculateSupplierMetrics(buyerId, sellerId);
}

// =============================================================================
// Timeline
// =============================================================================

/**
 * Get purchase timeline with actual vs expected dates
 */
export async function getPurchaseTimeline(
  buyerId: string,
  orderId: string
): Promise<PurchaseTimelineEvent[]> {
  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, buyerId },
  });

  if (!order) return [];

  const auditLog = await prisma.marketplaceOrderAudit.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });

  const timeline: PurchaseTimelineEvent[] = [];

  // Created
  timeline.push({
    id: 'created',
    state: 'created',
    label: 'Order Placed',
    actualDate: order.createdAt.toISOString(),
    isCompleted: true,
    isCurrent: order.status === 'pending_confirmation',
    isDelayed: false,
  });

  // Confirmed
  const confirmedEvent = auditLog.find(a => a.action === 'confirmed');
  const isConfirmed = ['confirmed', 'in_progress', 'shipped', 'delivered'].includes(order.status);
  const confirmationDelayed = order.confirmationDeadline && !confirmedEvent &&
    new Date() > new Date(order.confirmationDeadline);

  timeline.push({
    id: 'confirmed',
    state: 'confirmed',
    label: 'Confirmed',
    actualDate: confirmedEvent?.createdAt?.toISOString() || order.confirmedAt?.toISOString(),
    expectedDate: order.confirmationDeadline?.toISOString(),
    isCompleted: isConfirmed,
    isCurrent: order.status === 'confirmed',
    isDelayed: !!confirmationDelayed,
    delayDays: confirmationDelayed && order.confirmationDeadline
      ? Math.ceil((Date.now() - new Date(order.confirmationDeadline).getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  });

  // Processing
  const processingEvent = auditLog.find(a => a.newValue === 'in_progress');
  const isProcessing = ['in_progress', 'shipped', 'delivered'].includes(order.status);

  timeline.push({
    id: 'processing',
    state: 'processing',
    label: 'Processing',
    actualDate: processingEvent?.createdAt?.toISOString(),
    isCompleted: isProcessing,
    isCurrent: order.status === 'in_progress',
    isDelayed: false,
  });

  // Shipped
  const shippedEvent = auditLog.find(a => a.action === 'shipped');
  const isShipped = ['shipped', 'delivered'].includes(order.status);
  const shippingDelayed = order.shippingDeadline && !shippedEvent &&
    new Date() > new Date(order.shippingDeadline);

  timeline.push({
    id: 'shipped',
    state: 'shipped',
    label: 'Shipped',
    actualDate: shippedEvent?.createdAt?.toISOString() || order.shippedAt?.toISOString(),
    expectedDate: order.shippingDeadline?.toISOString(),
    isCompleted: isShipped,
    isCurrent: order.status === 'shipped',
    isDelayed: !!shippingDelayed,
    delayDays: shippingDelayed && order.shippingDeadline
      ? Math.ceil((Date.now() - new Date(order.shippingDeadline).getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  });

  // Delivered
  const deliveredEvent = auditLog.find(a => a.action === 'delivered');
  const deliveryDelayed = order.deliveryDeadline && order.status !== 'delivered' &&
    new Date() > new Date(order.deliveryDeadline);

  timeline.push({
    id: 'delivered',
    state: 'delivered',
    label: 'Delivered',
    actualDate: deliveredEvent?.createdAt?.toISOString() || order.deliveredAt?.toISOString(),
    expectedDate: order.deliveryDeadline?.toISOString(),
    isCompleted: order.status === 'delivered',
    isCurrent: order.status === 'delivered',
    isDelayed: !!deliveryDelayed,
    delayDays: deliveryDelayed && order.deliveryDeadline
      ? Math.ceil((Date.now() - new Date(order.deliveryDeadline).getTime()) / (1000 * 60 * 60 * 24))
      : undefined,
  });

  return timeline;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate urgency level based on SLA proximity
 */
function calculateUrgencyLevel(order: {
  status: string;
  confirmationDeadline?: Date | null;
  shippingDeadline?: Date | null;
  deliveryDeadline?: Date | null;
  createdAt: Date;
}): UrgencyLevel {
  // Terminal states have no urgency
  if (['delivered', 'cancelled', 'failed', 'refunded'].includes(order.status)) {
    return 'low';
  }

  const now = Date.now();
  let deadline: Date | null = null;
  let startTime = order.createdAt.getTime();

  // Determine relevant deadline based on status
  if (order.status === 'pending_confirmation' && order.confirmationDeadline) {
    deadline = new Date(order.confirmationDeadline);
  } else if (['confirmed', 'in_progress'].includes(order.status) && order.shippingDeadline) {
    deadline = new Date(order.shippingDeadline);
  } else if (order.status === 'shipped' && order.deliveryDeadline) {
    deadline = new Date(order.deliveryDeadline);
  }

  if (!deadline) return 'low';

  const totalTime = deadline.getTime() - startTime;
  const elapsedTime = now - startTime;
  const percentElapsed = (elapsedTime / totalTime) * 100;

  if (percentElapsed >= 90) return 'critical';
  if (percentElapsed >= 75) return 'high';
  if (percentElapsed >= 50) return 'medium';
  return 'low';
}

/**
 * Get savings category from price variance
 */
function getSavingsCategory(variance: number | null | undefined): SavingsCategory {
  if (variance === null || variance === undefined) return 'average';
  if (variance < -5) return 'good_deal';
  if (variance > 5) return 'overpaying';
  return 'average';
}

/**
 * Calculate price trend from history
 */
function calculatePriceTrend(history: { unitPrice: number; orderDate: Date }[]): PriceTrend {
  if (history.length < 2) return 'stable';

  // Compare last 3 prices (or less if not enough history)
  const recentPrices = history.slice(0, Math.min(3, history.length)).map(h => h.unitPrice);
  const olderPrices = history.slice(Math.min(3, history.length)).map(h => h.unitPrice);

  if (olderPrices.length === 0) return 'stable';

  const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Calculate quality score (1-5) based on order history
 */
function calculateQualityScore(orders: { hasException: boolean; status: string }[]): number {
  const completedOrders = orders.filter(o => o.status === 'delivered');
  if (completedOrders.length === 0) return 3; // Default neutral score

  const issueRate = completedOrders.filter(o => o.hasException).length / completedOrders.length;

  // 5 stars: < 5% issues
  // 4 stars: 5-10% issues
  // 3 stars: 10-20% issues
  // 2 stars: 20-30% issues
  // 1 star: > 30% issues
  if (issueRate < 0.05) return 5;
  if (issueRate < 0.10) return 4;
  if (issueRate < 0.20) return 3;
  if (issueRate < 0.30) return 2;
  return 1;
}

/**
 * Get reliability tier from metrics
 */
function getReliabilityTier(metrics: {
  onTimeDeliveryRate: number;
  qualityScore: number;
  issueCount: number;
}): 'excellent' | 'good' | 'average' | 'poor' {
  const score =
    (metrics.onTimeDeliveryRate * 0.4) +
    (metrics.qualityScore * 20 * 0.3) +
    ((metrics.issueCount === 0 ? 100 : Math.max(0, 100 - metrics.issueCount * 10)) * 0.3);

  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'average';
  return 'poor';
}

/**
 * Populate price intelligence on order creation
 */
export async function populatePriceIntelligence(
  buyerId: string,
  itemSku: string,
  currentPrice: number
): Promise<{
  historicalAvgPrice: number | null;
  priceVariance: number | null;
  priceTrend: string | null;
}> {
  const comparison = await calculatePriceComparison(buyerId, itemSku, currentPrice);

  if (!comparison) {
    return {
      historicalAvgPrice: null,
      priceVariance: null,
      priceTrend: null,
    };
  }

  return {
    historicalAvgPrice: comparison.historicalAvg,
    priceVariance: comparison.variance,
    priceTrend: comparison.trend,
  };
}

/**
 * Populate supplier snapshot on order creation
 */
export async function populateSupplierSnapshot(
  buyerId: string,
  sellerId: string
): Promise<{
  supplierOnTimeRate: number | null;
  supplierQualityScore: number | null;
  supplierTotalOrders: number | null;
}> {
  const metrics = await getSupplierMetrics(buyerId, sellerId);

  if (!metrics) {
    return {
      supplierOnTimeRate: null,
      supplierQualityScore: null,
      supplierTotalOrders: null,
    };
  }

  return {
    supplierOnTimeRate: metrics.onTimeDeliveryRate,
    supplierQualityScore: metrics.qualityScore,
    supplierTotalOrders: metrics.totalOrders,
  };
}
