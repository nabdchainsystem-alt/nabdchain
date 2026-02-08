// Fix ALL seller and buyer profiles to be fully complete
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing ALL seller profiles...\n');

  // Get all seller profiles
  const sellerProfiles = await prisma.sellerProfile.findMany({
    include: { company: true, address: true, bank: true, contact: true }
  });

  for (const profile of sellerProfiles) {
    console.log(`Fixing seller: ${profile.displayName || profile.id}`);

    // Update profile to approved status
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        status: 'approved',
        profileComplete: true,
        companyVerified: true,
        bankVerified: true,
        documentsVerified: true,
        canPublish: true,
        approvedAt: new Date(),
        displayName: profile.displayName || 'My Store',
      }
    });

    // Create company if missing
    if (!profile.company) {
      await prisma.sellerCompany.create({
        data: {
          sellerId: profile.id,
          legalName: profile.displayName || 'Company LLC',
          crNumber: 'CR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          companyType: 'LLC',
          verificationStatus: 'approved',
          verifiedAt: new Date(),
        }
      });
      console.log('  + Created company');
    }

    // Create address if missing
    if (!profile.address) {
      await prisma.sellerAddress.create({
        data: {
          sellerId: profile.id,
          country: 'SA',
          city: 'Riyadh',
          district: 'Al Olaya',
        }
      });
      console.log('  + Created address');
    }

    // Create bank if missing
    if (!profile.bank) {
      await prisma.sellerBank.create({
        data: {
          sellerId: profile.id,
          bankName: 'Al Rajhi Bank',
          accountHolderName: profile.displayName || 'Account Holder',
          iban: 'SA03800000006080101675' + Math.floor(Math.random() * 100).toString().padStart(2, '0'),
          ibanMasked: 'SA** **** **** ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        }
      });
      console.log('  + Created bank');
    }

    // Create contact if missing
    if (!profile.contact) {
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      await prisma.sellerContact.create({
        data: {
          sellerId: profile.id,
          businessEmail: user?.email || 'contact@store.com',
          phoneNumber: '+966500000000',
        }
      });
      console.log('  + Created contact');
    }

    console.log('  ✓ Profile complete');
  }

  // Also update all buyer profiles to active
  await prisma.buyerProfile.updateMany({
    data: { status: 'active' }
  });
  console.log('\n✓ All buyer profiles set to active');

  // Verify
  console.log('\n📊 Final seller profiles:');
  const sellers = await prisma.sellerProfile.findMany({
    select: { id: true, userId: true, displayName: true, status: true, canPublish: true }
  });
  console.table(sellers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
