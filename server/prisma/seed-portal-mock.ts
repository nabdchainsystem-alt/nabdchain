// =============================================================================
// Portal Mock Data Seed Script
// =============================================================================
// Creates mock seller and buyer profiles for development/testing
// Run with: npx tsx prisma/seed-portal-mock.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Hash password using same algorithm as portalAuthService (PBKDF2-SHA512, 100k iterations)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `v2:${salt}:${hash}`;
}

// Default test password for all mock users
const TEST_PASSWORD = '2450';
const TEST_PASSWORD_HASH = hashPassword(TEST_PASSWORD);

// Mock User IDs - these match the auth.ts dev tokens
const MOCK_USERS = {
  seller: {
    userId: 'user_seller_portal',
    email: 'sell@nabdchain.com',
    name: 'Test Seller',
  },
  buyer: {
    userId: 'user_buyer_portal',
    email: 'buy@nabdchain.com',
    name: 'Test Buyer',
  },
  master: {
    userId: 'user_master_local_admin',
    email: 'master@nabd.com',
    name: 'Master Admin',
  },
};

async function main() {
  console.log('🌱 Seeding portal mock data...\n');

  // ==========================================================================
  // 1. Create/Update Mock Users
  // ==========================================================================
  console.log('Creating mock users...');

  // Seller User (upsert by email to handle existing accounts)
  const sellerUser = await prisma.user.upsert({
    where: { email: MOCK_USERS.seller.email },
    update: {
      name: MOCK_USERS.seller.name,
      portalRole: 'seller',
      portalStatus: 'active',
      emailVerified: true,
      passwordHash: TEST_PASSWORD_HASH,
    },
    create: {
      id: MOCK_USERS.seller.userId,
      email: MOCK_USERS.seller.email,
      name: MOCK_USERS.seller.name,
      portalRole: 'seller',
      portalStatus: 'active',
      emailVerified: true,
      passwordHash: TEST_PASSWORD_HASH,
    },
  });
  console.log(`  ✓ Seller user: ${sellerUser.id} (${sellerUser.email})`);

  // Buyer User (upsert by email to handle existing accounts)
  const buyerUser = await prisma.user.upsert({
    where: { email: MOCK_USERS.buyer.email },
    update: {
      name: MOCK_USERS.buyer.name,
      portalRole: 'buyer',
      portalStatus: 'active',
      emailVerified: true,
      companyName: 'Test Buyer Company',
      passwordHash: TEST_PASSWORD_HASH,
    },
    create: {
      id: MOCK_USERS.buyer.userId,
      email: MOCK_USERS.buyer.email,
      name: MOCK_USERS.buyer.name,
      portalRole: 'buyer',
      portalStatus: 'active',
      emailVerified: true,
      companyName: 'Test Buyer Company',
      passwordHash: TEST_PASSWORD_HASH,
    },
  });
  console.log(`  ✓ Buyer user: ${buyerUser.id} (${buyerUser.email})`);

  // Master User
  const masterUser = await prisma.user.upsert({
    where: { email: MOCK_USERS.master.email },
    update: {
      name: MOCK_USERS.master.name,
      portalRole: 'admin',
      portalStatus: 'active',
      emailVerified: true,
      passwordHash: TEST_PASSWORD_HASH,
    },
    create: {
      id: MOCK_USERS.master.userId,
      email: MOCK_USERS.master.email,
      name: MOCK_USERS.master.name,
      portalRole: 'admin',
      portalStatus: 'active',
      emailVerified: true,
      passwordHash: TEST_PASSWORD_HASH,
    },
  });
  console.log(`  ✓ Master user: ${masterUser.id} (${masterUser.email})`);

  // ==========================================================================
  // 2. Create Seller Profile with all related data
  // ==========================================================================
  console.log('\nCreating seller profile...');

  // Check if seller profile exists (use actual userId from DB, not static ID)
  let sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerUser.id },
  });

  if (!sellerProfile) {
    sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: sellerUser.id,
        displayName: 'Test Auto Parts',
        slug: 'test-auto-parts',
        shortDescription: 'Your trusted source for quality auto parts',
        status: 'approved',
        profileComplete: true,
        companyVerified: true,
        bankVerified: true,
        documentsVerified: true,
        canPublish: true,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Created seller profile: ${sellerProfile.id}`);
  } else {
    // Update existing profile to be approved
    sellerProfile = await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        status: 'approved',
        profileComplete: true,
        companyVerified: true,
        bankVerified: true,
        documentsVerified: true,
        canPublish: true,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Updated seller profile: ${sellerProfile.id}`);
  }

  // Create Seller Company
  await prisma.sellerCompany.upsert({
    where: { sellerId: sellerProfile.id },
    update: {
      legalName: 'Test Auto Parts Trading LLC',
      crNumber: 'CR-1234567890',
      vatNumber: 'VAT-987654321',
      companyType: 'LLC',
      verificationStatus: 'approved',
      verifiedAt: new Date(),
    },
    create: {
      sellerId: sellerProfile.id,
      legalName: 'Test Auto Parts Trading LLC',
      crNumber: 'CR-1234567890',
      vatNumber: 'VAT-987654321',
      companyType: 'LLC',
      verificationStatus: 'approved',
      verifiedAt: new Date(),
    },
  });
  console.log('  ✓ Seller company info');

  // Create Seller Address
  await prisma.sellerAddress.upsert({
    where: { sellerId: sellerProfile.id },
    update: {
      country: 'SA',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'King Fahd Road',
      buildingNumber: '123',
      postalCode: '12345',
    },
    create: {
      sellerId: sellerProfile.id,
      country: 'SA',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'King Fahd Road',
      buildingNumber: '123',
      postalCode: '12345',
    },
  });
  console.log('  ✓ Seller address');

  // Create Seller Bank
  await prisma.sellerBank.upsert({
    where: { sellerId: sellerProfile.id },
    update: {
      bankName: 'Al Rajhi Bank',
      accountHolderName: 'Test Auto Parts Trading LLC',
      iban: 'SA0380000000608010167519',
      ibanMasked: 'SA** **** **** 7519',
      currency: 'SAR',
      bankCountry: 'SA',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    },
    create: {
      sellerId: sellerProfile.id,
      bankName: 'Al Rajhi Bank',
      accountHolderName: 'Test Auto Parts Trading LLC',
      iban: 'SA0380000000608010167519',
      ibanMasked: 'SA** **** **** 7519',
      currency: 'SAR',
      bankCountry: 'SA',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
    },
  });
  console.log('  ✓ Seller bank info');

  // Create Seller Contact
  await prisma.sellerContact.upsert({
    where: { sellerId: sellerProfile.id },
    update: {
      businessEmail: 'sales@testautoparts.com',
      phoneNumber: '+966501234567',
      whatsapp: '+966501234567',
      supportContactName: 'Ahmed Support',
    },
    create: {
      sellerId: sellerProfile.id,
      businessEmail: 'sales@testautoparts.com',
      phoneNumber: '+966501234567',
      whatsapp: '+966501234567',
      supportContactName: 'Ahmed Support',
    },
  });
  console.log('  ✓ Seller contact info');

  // ==========================================================================
  // 3. Create Buyer Profile
  // ==========================================================================
  console.log('\nCreating buyer profile...');

  const buyerProfile = await prisma.buyerProfile.upsert({
    where: { userId: buyerUser.id },
    update: {
      fullName: 'Test Buyer',
      companyName: 'Test Buyer Company Ltd',
      phoneNumber: '+966509876543',
      country: 'SA',
      city: 'Jeddah',
      status: 'active',
    },
    create: {
      userId: buyerUser.id,
      fullName: 'Test Buyer',
      companyName: 'Test Buyer Company Ltd',
      phoneNumber: '+966509876543',
      country: 'SA',
      city: 'Jeddah',
      status: 'active',
    },
  });
  console.log(`  ✓ Buyer profile: ${buyerProfile.id}`);

  // ==========================================================================
  // 4. Create profiles for Master user (optional - for testing both roles)
  // ==========================================================================
  console.log('\nCreating master user profiles...');

  // Master as Seller
  let masterSellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: masterUser.id },
  });

  if (!masterSellerProfile) {
    masterSellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: masterUser.id,
        displayName: 'Master Seller',
        slug: 'master-seller',
        shortDescription: 'Master admin seller profile',
        status: 'approved',
        profileComplete: true,
        companyVerified: true,
        bankVerified: true,
        documentsVerified: true,
        canPublish: true,
        approvedAt: new Date(),
      },
    });

    // Create supporting records
    await prisma.sellerCompany.create({
      data: {
        sellerId: masterSellerProfile.id,
        legalName: 'Master Trading LLC',
        crNumber: 'CR-0000000001',
        companyType: 'LLC',
        verificationStatus: 'approved',
        verifiedAt: new Date(),
      },
    });

    await prisma.sellerAddress.create({
      data: {
        sellerId: masterSellerProfile.id,
        country: 'SA',
        city: 'Riyadh',
        district: 'Al Malaz',
      },
    });

    await prisma.sellerBank.create({
      data: {
        sellerId: masterSellerProfile.id,
        bankName: 'Al Rajhi Bank',
        accountHolderName: 'Master Trading LLC',
        iban: 'SA0380000000608010167520',
        ibanMasked: 'SA** **** **** 7520',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
      },
    });

    await prisma.sellerContact.create({
      data: {
        sellerId: masterSellerProfile.id,
        businessEmail: 'master@nabd.com',
        phoneNumber: '+966500000000',
      },
    });

    console.log(`  ✓ Master seller profile: ${masterSellerProfile.id}`);
  } else {
    console.log(`  ✓ Master seller profile exists: ${masterSellerProfile.id}`);
  }

  // Master as Buyer
  const masterBuyerProfile = await prisma.buyerProfile.upsert({
    where: { userId: masterUser.id },
    update: {
      fullName: 'Master Admin',
      companyName: 'Master Company',
      status: 'active',
    },
    create: {
      userId: masterUser.id,
      fullName: 'Master Admin',
      companyName: 'Master Company',
      country: 'SA',
      city: 'Riyadh',
      status: 'active',
    },
  });
  console.log(`  ✓ Master buyer profile: ${masterBuyerProfile.id}`);

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n✅ Portal mock data seeded successfully!\n');
  console.log('Mock accounts ready for testing:');
  console.log('┌──────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Role    │ Email                  │ Password │ User ID                     │');
  console.log('├──────────────────────────────────────────────────────────────────────────┤');
  console.log(`│ Seller  │ ${MOCK_USERS.seller.email.padEnd(22)} │ ${TEST_PASSWORD.padEnd(8)} │ ${MOCK_USERS.seller.userId.padEnd(27)} │`);
  console.log(`│ Buyer   │ ${MOCK_USERS.buyer.email.padEnd(22)} │ ${TEST_PASSWORD.padEnd(8)} │ ${MOCK_USERS.buyer.userId.padEnd(27)} │`);
  console.log(`│ Admin   │ ${MOCK_USERS.master.email.padEnd(22)} │ ${TEST_PASSWORD.padEnd(8)} │ ${masterUser.id.padEnd(27)} │`);
  console.log('└──────────────────────────────────────────────────────────────────────────┘');
  console.log('\nSeller Profile ID:', sellerProfile.id);
  console.log('Master Seller Profile ID:', masterSellerProfile?.id);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
