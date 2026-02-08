// =============================================================================
// Smoke Test: Invoices
// =============================================================================
// Quick script to verify invoice data in database
// Run with: cd server && npx ts-node scripts/smoke-invoices.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== INVOICES SMOKE TEST ===\n');

  // Total invoice count
  const totalInvoices = await prisma.marketplaceInvoice.count();
  console.log(`Total invoices: ${totalInvoices}`);

  // Invoices by status
  const statusCounts = await prisma.marketplaceInvoice.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('\nInvoices by status:');
  for (const s of statusCounts) {
    console.log(`  ${s.status}: ${s._count}`);
  }

  // Paid vs unpaid
  const paidCount = await prisma.marketplaceInvoice.count({
    where: { status: 'paid' },
  });
  const unpaidCount = await prisma.marketplaceInvoice.count({
    where: { status: { in: ['draft', 'issued'] } },
  });
  const overdueCount = await prisma.marketplaceInvoice.count({
    where: { status: 'overdue' },
  });
  console.log(`\nPayment summary:`);
  console.log(`  Paid: ${paidCount}`);
  console.log(`  Unpaid (draft/issued): ${unpaidCount}`);
  console.log(`  Overdue: ${overdueCount}`);

  // Total amounts
  const amounts = await prisma.marketplaceInvoice.aggregate({
    _sum: {
      totalAmount: true,
    },
  });
  console.log(`\nAmount summary:`);
  console.log(`  Total invoiced: ${amounts._sum.totalAmount || 0}`);

  // Latest 5 invoices
  const latestInvoices = await prisma.marketplaceInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      buyerId: true,
      sellerId: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      orderId: true,
    },
  });

  console.log('\nLatest 5 invoices:');
  for (const inv of latestInvoices) {
    console.log(`  ${inv.invoiceNumber || inv.id.slice(0, 8)}`);
    console.log(`    - Status: ${inv.status}`);
    console.log(`    - BuyerId: ${inv.buyerId.slice(0, 12)}...`);
    console.log(`    - SellerId: ${inv.sellerId.slice(0, 12)}...`);
    console.log(`    - Total: ${inv.currency} ${inv.totalAmount}`);
    console.log(`    - Created: ${inv.createdAt.toISOString()}`);
    console.log(`    - OrderId: ${inv.orderId ? inv.orderId.slice(0, 12) + '...' : 'N/A'}`);
  }

  // Orphan invoices (no order)
  const orphanInvoices = await prisma.marketplaceInvoice.count({
    where: { orderId: null },
  });
  if (orphanInvoices > 0) {
    console.log(`\n[INFO] Invoices without orderId: ${orphanInvoices}`);
  }

  console.log('\n=== SMOKE TEST COMPLETE ===\n');
}

main()
  .catch((e) => {
    console.error('Smoke test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
