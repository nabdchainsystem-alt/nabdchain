import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface SellerProfileInput {
  displayName: string;
  slug?: string;
  shortDescription?: string;
  logoUrl?: string;
  coverUrl?: string;
}

export interface SellerCompanyInput {
  legalName: string;
  crNumber?: string;
  vatNumber?: string;
  vatDocumentUrl?: string;
  companyType?: string;
  dateOfEstablishment?: string;
}

export interface SellerAddressInput {
  country: string;
  city: string;
  district?: string;
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  additionalInfo?: string;
}

export interface SellerBankInput {
  bankName: string;
  accountHolderName: string;
  iban: string;
  currency?: string;
  bankCountry?: string;
}

export interface SellerContactInput {
  businessEmail: string;
  phoneNumber: string;
  whatsapp?: string;
  supportContactName?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function maskIban(iban: string): string {
  if (iban.length < 8) return iban;
  const prefix = iban.substring(0, 4);
  const suffix = iban.substring(iban.length - 4);
  return `${prefix} ${'*'.repeat(4)} ${'*'.repeat(4)} ${suffix}`;
}

async function checkProfileCompletion(sellerId: string): Promise<void> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      company: true,
      address: true,
      bank: true,
      contact: true,
    },
  });

  if (!profile) return;

  const profileComplete = !!(
    profile.displayName &&
    profile.slug &&
    profile.company?.legalName &&
    profile.address?.city &&
    profile.bank?.iban &&
    profile.contact?.businessEmail
  );

  const canPublish = !!(
    profileComplete &&
    profile.companyVerified &&
    profile.bankVerified
  );

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      profileComplete,
      canPublish,
      status: profileComplete ? 'pending_review' : 'incomplete',
    },
  });
}

async function createAuditLog(
  sellerId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  previousValue: any,
  newValue: any
): Promise<void> {
  await prisma.sellerAuditLog.create({
    data: {
      sellerId,
      userId,
      action,
      entityType,
      entityId,
      previousValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    },
  });
}

// =============================================================================
// Service Methods
// =============================================================================

export const sellerService = {
  // =========================================================================
  // GET FULL SELLER PROFILE
  // =========================================================================
  async getSellerProfile(userId: string) {
    let profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        address: true,
        bank: true,
        contact: true,
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    // If no profile exists, create a default one
    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: {
          userId,
          displayName: '',
          slug: `seller-${Date.now()}`,
          status: 'incomplete',
        },
        include: {
          company: true,
          address: true,
          bank: true,
          contact: true,
          documents: true,
        },
      });
    }

    // Mask IBAN if exists
    if (profile.bank?.iban) {
      return {
        ...profile,
        bank: {
          ...profile.bank,
          iban: profile.bank.ibanMasked || maskIban(profile.bank.iban),
          ibanFull: undefined, // Never expose full IBAN
        },
      };
    }

    return profile;
  },

  // =========================================================================
  // UPDATE SELLER PROFILE
  // =========================================================================
  async updateSellerProfile(userId: string, data: SellerProfileInput) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Create new profile
      const slug = data.slug || generateSlug(data.displayName);
      const profile = await prisma.sellerProfile.create({
        data: {
          userId,
          displayName: data.displayName,
          slug,
          shortDescription: data.shortDescription,
          logoUrl: data.logoUrl,
          coverUrl: data.coverUrl,
        },
      });

      await createAuditLog(profile.id, userId, 'create', 'profile', profile.id, null, data);
      await checkProfileCompletion(profile.id);
      return profile;
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.sellerProfile.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists && slugExists.id !== existing.id) {
        throw new Error('Slug already in use');
      }
    }

    const updated = await prisma.sellerProfile.update({
      where: { userId },
      data: {
        displayName: data.displayName,
        slug: data.slug || existing.slug,
        shortDescription: data.shortDescription,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
      },
    });

    await createAuditLog(updated.id, userId, 'update', 'profile', updated.id, existing, data);
    await checkProfileCompletion(updated.id);
    return updated;
  },

  // =========================================================================
  // UPDATE COMPANY INFO
  // =========================================================================
  async updateCompanyInfo(userId: string, data: SellerCompanyInput) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { company: true },
    });

    if (!profile) {
      throw new Error('Seller profile not found');
    }

    if (profile.company) {
      const updated = await prisma.sellerCompany.update({
        where: { sellerId: profile.id },
        data: {
          legalName: data.legalName,
          crNumber: data.crNumber,
          vatNumber: data.vatNumber,
          vatDocumentUrl: data.vatDocumentUrl,
          companyType: data.companyType,
          dateOfEstablishment: data.dateOfEstablishment ? new Date(data.dateOfEstablishment) : null,
          verificationStatus: 'pending', // Reset verification on update
        },
      });

      await createAuditLog(profile.id, userId, 'update', 'company', updated.id, profile.company, data);
      await checkProfileCompletion(profile.id);
      return updated;
    }

    const created = await prisma.sellerCompany.create({
      data: {
        sellerId: profile.id,
        legalName: data.legalName,
        crNumber: data.crNumber,
        vatNumber: data.vatNumber,
        vatDocumentUrl: data.vatDocumentUrl,
        companyType: data.companyType,
        dateOfEstablishment: data.dateOfEstablishment ? new Date(data.dateOfEstablishment) : null,
      },
    });

    await createAuditLog(profile.id, userId, 'create', 'company', created.id, null, data);
    await checkProfileCompletion(profile.id);
    return created;
  },

  // =========================================================================
  // UPDATE ADDRESS
  // =========================================================================
  async updateAddress(userId: string, data: SellerAddressInput) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { address: true },
    });

    if (!profile) {
      throw new Error('Seller profile not found');
    }

    if (profile.address) {
      const updated = await prisma.sellerAddress.update({
        where: { sellerId: profile.id },
        data: {
          country: data.country,
          city: data.city,
          district: data.district,
          street: data.street,
          buildingNumber: data.buildingNumber,
          postalCode: data.postalCode,
          additionalInfo: data.additionalInfo,
        },
      });

      await createAuditLog(profile.id, userId, 'update', 'address', updated.id, profile.address, data);
      await checkProfileCompletion(profile.id);
      return updated;
    }

    const created = await prisma.sellerAddress.create({
      data: {
        sellerId: profile.id,
        country: data.country,
        city: data.city,
        district: data.district,
        street: data.street,
        buildingNumber: data.buildingNumber,
        postalCode: data.postalCode,
        additionalInfo: data.additionalInfo,
      },
    });

    await createAuditLog(profile.id, userId, 'create', 'address', created.id, null, data);
    await checkProfileCompletion(profile.id);
    return created;
  },

  // =========================================================================
  // UPDATE BANK INFO
  // =========================================================================
  async updateBankInfo(userId: string, data: SellerBankInput) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { bank: true },
    });

    if (!profile) {
      throw new Error('Seller profile not found');
    }

    const ibanMasked = maskIban(data.iban);

    if (profile.bank) {
      const updated = await prisma.sellerBank.update({
        where: { sellerId: profile.id },
        data: {
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          iban: data.iban,
          ibanMasked,
          currency: data.currency || 'SAR',
          bankCountry: data.bankCountry || 'SA',
          verificationStatus: 'pending', // Reset verification on update
        },
      });

      // Don't log full IBAN in audit
      const sanitizedData = { ...data, iban: ibanMasked };
      await createAuditLog(profile.id, userId, 'update', 'bank', updated.id, { ...profile.bank, iban: profile.bank.ibanMasked }, sanitizedData);
      await checkProfileCompletion(profile.id);

      return { ...updated, iban: ibanMasked };
    }

    const created = await prisma.sellerBank.create({
      data: {
        sellerId: profile.id,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        iban: data.iban,
        ibanMasked,
        currency: data.currency || 'SAR',
        bankCountry: data.bankCountry || 'SA',
      },
    });

    const sanitizedData = { ...data, iban: ibanMasked };
    await createAuditLog(profile.id, userId, 'create', 'bank', created.id, null, sanitizedData);
    await checkProfileCompletion(profile.id);

    return { ...created, iban: ibanMasked };
  },

  // =========================================================================
  // UPDATE CONTACT INFO
  // =========================================================================
  async updateContactInfo(userId: string, data: SellerContactInput) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { contact: true },
    });

    if (!profile) {
      throw new Error('Seller profile not found');
    }

    if (profile.contact) {
      const updated = await prisma.sellerContact.update({
        where: { sellerId: profile.id },
        data: {
          businessEmail: data.businessEmail,
          phoneNumber: data.phoneNumber,
          whatsapp: data.whatsapp,
          supportContactName: data.supportContactName,
        },
      });

      await createAuditLog(profile.id, userId, 'update', 'contact', updated.id, profile.contact, data);
      await checkProfileCompletion(profile.id);
      return updated;
    }

    const created = await prisma.sellerContact.create({
      data: {
        sellerId: profile.id,
        businessEmail: data.businessEmail,
        phoneNumber: data.phoneNumber,
        whatsapp: data.whatsapp,
        supportContactName: data.supportContactName,
      },
    });

    await createAuditLog(profile.id, userId, 'create', 'contact', created.id, null, data);
    await checkProfileCompletion(profile.id);
    return created;
  },

  // =========================================================================
  // UPLOAD DOCUMENT
  // =========================================================================
  async uploadDocument(
    userId: string,
    documentType: string,
    fileName: string,
    fileUrl: string,
    fileSize?: number,
    mimeType?: string
  ) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Seller profile not found');
    }

    const document = await prisma.sellerDocument.create({
      data: {
        sellerId: profile.id,
        documentType,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
      },
    });

    await createAuditLog(profile.id, userId, 'create', 'document', document.id, null, {
      documentType,
      fileName,
    });

    return document;
  },

  // =========================================================================
  // GET DOCUMENTS
  // =========================================================================
  async getDocuments(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return [];
    }

    return prisma.sellerDocument.findMany({
      where: { sellerId: profile.id },
      orderBy: { uploadedAt: 'desc' },
    });
  },

  // =========================================================================
  // GET VERIFICATION STATUS
  // =========================================================================
  async getVerificationStatus(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        bank: true,
        documents: true,
      },
    });

    if (!profile) {
      return {
        profileStatus: 'incomplete',
        documentsStatus: 'pending',
        payoutStatus: 'not_verified',
        canPublish: false,
      };
    }

    return {
      profileStatus: profile.profileComplete ? 'complete' : 'incomplete',
      documentsStatus: profile.documentsVerified ? 'approved' :
        profile.documents.some(d => d.verificationStatus === 'rejected') ? 'rejected' : 'pending',
      payoutStatus: profile.bankVerified ? 'verified' : 'not_verified',
      canPublish: profile.canPublish,
      companyVerified: profile.companyVerified,
      bankVerified: profile.bankVerified,
    };
  },

  // =========================================================================
  // CHECK SLUG AVAILABILITY
  // =========================================================================
  async checkSlugAvailability(slug: string, currentUserId?: string) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { slug },
    });

    if (!existing) {
      return { available: true };
    }

    if (currentUserId && existing.userId === currentUserId) {
      return { available: true };
    }

    return { available: false };
  },
};

export default sellerService;
