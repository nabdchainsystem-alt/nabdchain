// =============================================================================
// E2E Test Seed Data Generator
// =============================================================================
// Run: npx ts-node server/scripts/seed-e2e-data.ts
// Or:  cd server && npx ts-node scripts/seed-e2e-data.ts

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// =============================================================================
// Configuration
// =============================================================================

const SELLER_EMAIL = 'seller-e2e@test.nabd.com';
const BUYER_EMAIL = 'buyer-e2e@test.nabd.com';
const PASSWORD = 'TestPass123!';

// =============================================================================
// Helpers
// =============================================================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// =============================================================================
// Seed Functions
// =============================================================================

async function createSeller() {
  console.log('Creating seller...');

  const passwordHash = hashPassword(PASSWORD);
  const userId = `usr_seller_e2e_${Date.now()}`;

  // Check if seller already exists by email
  const existingUser = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
  });

  if (existingUser) {
    console.log(`Seller already exists: ${existingUser.id}`);
    const existingSeller = await prisma.sellerProfile.findUnique({
      where: { userId: existingUser.id },
    });
    return { user: existingUser, seller: existingSeller };
  }

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: SELLER_EMAIL,
      name: 'E2E Test Seller',
      portalRole: 'seller',
      passwordHash,
      emailVerified: true,
      companyName: 'E2E Industrial Supplies',
    },
  });

  const seller = await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      displayName: 'E2E Industrial Supplies',
      slug: 'e2e-industrial-supplies',
      shortDescription: 'Premium industrial supplies for testing',
      status: 'approved', // Fully verified seller
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
      canPublish: true,
    },
  });

  // Create seller company info
  await prisma.sellerCompany.create({
    data: {
      sellerId: seller.id,
      legalName: 'E2E Industrial Supplies LLC',
      crNumber: 'CR-123456789',
      vatNumber: 'VAT-987654321',
      companyType: 'llc',
      verificationStatus: 'approved',
      verifiedAt: new Date(),
    },
  });

  // Create seller bank info
  await prisma.sellerBank.create({
    data: {
      sellerId: seller.id,
      bankName: 'Test Bank',
      accountHolderName: 'E2E Industrial Supplies LLC',
      iban: 'SA0380000000608010167519',
      ibanMasked: 'SA03****7519',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    },
  });

  // Create seller address
  await prisma.sellerAddress.create({
    data: {
      sellerId: seller.id,
      country: 'SA',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: '123 Industrial Ave',
      buildingNumber: '456',
      postalCode: '12345',
    },
  });

  // Create seller contact
  await prisma.sellerContact.create({
    data: {
      sellerId: seller.id,
      businessEmail: SELLER_EMAIL,
      phoneNumber: '+966501234567',
      whatsapp: '+966501234567',
    },
  });

  // Create payout settings
  await prisma.sellerPayoutSettings.create({
    data: {
      sellerId: user.id,
      payoutFrequency: 'weekly',
      minPayoutAmount: 100,
      disputeHoldEnabled: true,
      holdPeriodDays: 7,
      autoPayoutEnabled: false,
    },
  });

  console.log(`Seller created: ${user.id}`);
  return { user, seller };
}

async function createBuyer() {
  console.log('Creating buyer...');

  const passwordHash = hashPassword(PASSWORD);
  const userId = `usr_buyer_e2e_${Date.now()}`;

  // Check if buyer already exists by email
  const existingUser = await prisma.user.findUnique({
    where: { email: BUYER_EMAIL },
  });

  if (existingUser) {
    console.log(`Buyer already exists: ${existingUser.id}`);
    const existingBuyer = await prisma.buyerProfile.findUnique({
      where: { userId: existingUser.id },
    });
    return { user: existingUser, buyer: existingBuyer };
  }

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: BUYER_EMAIL,
      name: 'E2E Test Buyer',
      portalRole: 'buyer',
      passwordHash,
      emailVerified: true,
      companyName: 'E2E Procurement Co.',
    },
  });

  const buyer = await prisma.buyerProfile.create({
    data: {
      userId: user.id,
      fullName: 'E2E Test Buyer',
      companyName: 'E2E Procurement Co.',
      phoneNumber: '+966509876543',
      country: 'SA',
      city: 'Riyadh',
      status: 'active',
    },
  });

  console.log(`Buyer created: ${user.id}`);
  return { user, buyer };
}

async function createItems(sellerId: string) {
  console.log('Creating 10 items...');

  const categories = ['Industrial Parts', 'Electronics', 'Raw Materials', 'Safety Equipment', 'Tools'];
  const items = [];

  for (let i = 1; i <= 10; i++) {
    const sku = `E2E-ITEM-${i.toString().padStart(3, '0')}`;

    // Check if item already exists
    const existingItem = await prisma.item.findUnique({
      where: {
        userId_sku: {
          userId: sellerId,
          sku: sku,
        },
      },
    });

    if (existingItem) {
      console.log(`  Item ${i}: ${sku} (already exists)`);
      items.push(existingItem);
      continue;
    }

    const item = await prisma.item.create({
      data: {
        userId: sellerId,
        name: `E2E Test Item ${i}`,
        nameAr: `منتج اختبار ${i}`,
        sku: sku,
        partNumber: `PN-${i.toString().padStart(5, '0')}`,
        description: `Test item ${i} for E2E testing. High quality industrial component.`,
        itemType: 'part',
        category: categories[(i - 1) % categories.length],
        visibility: 'public',
        status: 'active',
        price: 100 + i * 50,
        currency: 'SAR',
        stock: 100,
        minOrderQty: 1,
        maxOrderQty: 50,
        leadTimeDays: 3 + (i % 5),
        manufacturer: 'E2E Manufacturing',
        brand: 'E2E Brand',
        origin: 'Saudi Arabia',
      },
    });

    items.push(item);
    console.log(`  Item ${i}: ${item.sku} - ${item.name} (SAR ${item.price})`);
  }

  return items;
}

async function cleanup() {
  console.log('\n=== Cleanup Mode ===');
  console.log('Removing E2E test data...\n');

  // Find seller user
  const sellerUser = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
  });

  // Find buyer user
  const buyerUser = await prisma.user.findUnique({
    where: { email: BUYER_EMAIL },
  });

  // Delete items created by seller
  if (sellerUser) {
    const deletedItems = await prisma.item.deleteMany({
      where: { userId: sellerUser.id, sku: { startsWith: 'E2E-ITEM-' } },
    });
    console.log(`Deleted ${deletedItems.count} items`);

    // Delete seller profile and related data (cascade will handle related tables)
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerUser.id },
    });
    if (sellerProfile) {
      await prisma.sellerCompany.deleteMany({ where: { sellerId: sellerProfile.id } });
      await prisma.sellerBank.deleteMany({ where: { sellerId: sellerProfile.id } });
      await prisma.sellerAddress.deleteMany({ where: { sellerId: sellerProfile.id } });
      await prisma.sellerContact.deleteMany({ where: { sellerId: sellerProfile.id } });
      await prisma.sellerProfile.delete({ where: { id: sellerProfile.id } });
      console.log('Deleted seller profile');
    }

    // Delete payout settings
    await prisma.sellerPayoutSettings.deleteMany({ where: { sellerId: sellerUser.id } });

    // Delete seller user
    await prisma.user.delete({ where: { id: sellerUser.id } });
    console.log(`Deleted seller user: ${sellerUser.email}`);
  }

  // Delete buyer profile and user
  if (buyerUser) {
    await prisma.buyerProfile.deleteMany({ where: { userId: buyerUser.id } });
    await prisma.user.delete({ where: { id: buyerUser.id } });
    console.log(`Deleted buyer user: ${buyerUser.email}`);
  }

  console.log('\n=== Cleanup Complete ===\n');
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--cleanup') || args.includes('-c')) {
    await cleanup();
    return;
  }

  console.log('===========================================');
  console.log('       E2E Seed Data Generator');
  console.log('===========================================\n');

  try {
    const { user: sellerUser, seller } = await createSeller();
    const { user: buyerUser, buyer } = await createBuyer();
    const items = await createItems(sellerUser.id);

    console.log('\n===========================================');
    console.log('           Seed Data Summary');
    console.log('===========================================');
    console.log(`\nSeller Account:`);
    console.log(`  Email:    ${SELLER_EMAIL}`);
    console.log(`  User ID:  ${sellerUser.id}`);
    console.log(`  Seller:   ${seller?.displayName || 'E2E Industrial Supplies'}`);
    console.log(`  Status:   ${seller?.status || 'approved'}`);

    console.log(`\nBuyer Account:`);
    console.log(`  Email:    ${BUYER_EMAIL}`);
    console.log(`  User ID:  ${buyerUser.id}`);
    console.log(`  Company:  ${buyer?.companyName || 'E2E Procurement Co.'}`);
    console.log(`  Status:   ${buyer?.status || 'active'}`);

    console.log(`\nItems Created: ${items.length}`);
    console.log(`  SKU Range: E2E-ITEM-001 to E2E-ITEM-010`);
    console.log(`  Price Range: SAR 150 - SAR 600`);
    console.log(`  Categories: Industrial Parts, Electronics, Raw Materials, Safety Equipment, Tools`);

    console.log(`\nLogin Credentials:`);
    console.log(`  Password: ${PASSWORD}`);

    console.log('\n===========================================');
    console.log('       Ready for E2E Testing!');
    console.log('===========================================');
    console.log('\nUsage:');
    console.log('  Run again:   npx ts-node scripts/seed-e2e-data.ts');
    console.log('  Cleanup:     npx ts-node scripts/seed-e2e-data.ts --cleanup');
    console.log('');
  } catch (error) {
    console.error('\n[ERROR] Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
