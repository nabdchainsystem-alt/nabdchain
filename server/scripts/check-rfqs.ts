// Quick script to check RFQ data in database
// Run with: cd server && npx ts-node scripts/check-rfqs.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Checking ItemRFQ table ===\n');

  // Get all RFQs
  const allRfqs = await prisma.itemRFQ.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      rfqNumber: true,
      buyerId: true,
      sellerId: true,
      status: true,
      quantity: true,
      message: true,
      createdAt: true,
    },
  });

  console.log(`Total RFQs found: ${allRfqs.length}\n`);

  for (const rfq of allRfqs) {
    console.log(`RFQ: ${rfq.rfqNumber || rfq.id.slice(0, 8)}`);
    console.log(`  - buyerId: ${rfq.buyerId}`);
    console.log(`  - sellerId: ${rfq.sellerId || 'NULL (broadcast)'}`);
    console.log(`  - status: ${rfq.status}`);
    console.log(`  - quantity: ${rfq.quantity}`);
    console.log(`  - createdAt: ${rfq.createdAt}`);
    console.log(`  - message: ${rfq.message?.slice(0, 50)}...`);
    console.log('');
  }

  // Check for broadcast RFQs specifically
  const broadcastRfqs = await prisma.itemRFQ.count({
    where: { sellerId: null },
  });
  console.log(`\nBroadcast RFQs (sellerId=null): ${broadcastRfqs}`);

  // Check for RFQs with 'new' status
  const newRfqs = await prisma.itemRFQ.count({
    where: { status: 'new' },
  });
  console.log(`RFQs with status='new': ${newRfqs}`);

  // Check for broadcast RFQs with 'new' status (should appear in marketplace)
  const marketplaceEligible = await prisma.itemRFQ.count({
    where: {
      sellerId: null,
      status: { in: ['new', 'viewed', 'under_review'] },
    },
  });
  console.log(`\nMarketplace-eligible RFQs: ${marketplaceEligible}`);

  // Check BuyerProfile
  console.log('\n=== Checking BuyerProfile table ===\n');
  const buyers = await prisma.buyerProfile.findMany({
    take: 5,
    select: {
      id: true,
      userId: true,
      companyName: true,
    },
  });
  console.log(`Buyer profiles found: ${buyers.length}`);
  for (const buyer of buyers) {
    console.log(`  - id: ${buyer.id}, userId: ${buyer.userId}, company: ${buyer.companyName}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
