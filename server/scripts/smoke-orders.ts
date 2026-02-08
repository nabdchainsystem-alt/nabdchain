// =============================================================================
// Smoke Test: Orders
// =============================================================================
// Quick script to verify orders data in database
// Run with: cd server && npx ts-node scripts/smoke-orders.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== ORDERS SMOKE TEST ===\n');

  // Total order count
  const totalOrders = await prisma.marketplaceOrder.count();
  console.log(`Total orders: ${totalOrders}`);

  // Orders by status
  const statusCounts = await prisma.marketplaceOrder.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('\nOrders by status:');
  for (const s of statusCounts) {
    console.log(`  ${s.status}: ${s._count}`);
  }

  // Unique buyers with orders
  const buyerIds = await prisma.marketplaceOrder.findMany({
    distinct: ['buyerId'],
    select: { buyerId: true },
  });
  console.log(`\nUnique buyers with orders: ${buyerIds.length}`);

  // Unique sellers with orders
  const sellerIds = await prisma.marketplaceOrder.findMany({
    distinct: ['sellerId'],
    select: { sellerId: true },
  });
  console.log(`Unique sellers with orders: ${sellerIds.length}`);

  // Latest 5 orders
  const latestOrders = await prisma.marketplaceOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      buyerId: true,
      sellerId: true,
      totalPrice: true,
      currency: true,
      createdAt: true,
    },
  });

  console.log('\nLatest 5 orders:');
  for (const order of latestOrders) {
    console.log(`  ${order.orderNumber || order.id.slice(0, 8)}`);
    console.log(`    - Status: ${order.status}`);
    console.log(`    - BuyerId: ${order.buyerId.slice(0, 12)}...`);
    console.log(`    - SellerId: ${order.sellerId.slice(0, 12)}...`);
    console.log(`    - Total: ${order.currency} ${order.totalPrice}`);
    console.log(`    - Created: ${order.createdAt.toISOString()}`);
  }

  // Orders with invoices (check via MarketplaceInvoice table)
  const ordersWithInvoices = await prisma.marketplaceInvoice.count();
  console.log(`\nInvoices created: ${ordersWithInvoices}`);

  // Orders in delivered status
  const deliveredCount = await prisma.marketplaceOrder.count({
    where: { status: 'delivered' },
  });
  if (deliveredCount > 0) {
    console.log(`  Delivered orders: ${deliveredCount}`);
  }

  console.log('\n=== SMOKE TEST COMPLETE ===\n');
}

main()
  .catch((e) => {
    console.error('Smoke test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
