// =============================================================================
// Portal Authentication Service
// Handles Buyer and Seller signup, login, and token management
// =============================================================================

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface BuyerSignupInput {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
}

export interface SellerSignupInput {
  fullName: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  portalType: 'buyer' | 'seller';
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    portalRole: string;
  };
  seller?: {
    id: string;
    displayName: string;
    slug: string;
    status: string;
    onboardingStep: number;
  };
  buyer?: {
    id: string;
    companyName: string;
    status: string;
  };
  accessToken?: string;
  refreshToken?: string;
  redirectTo?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// Password Utilities
// =============================================================================

const SALT_ROUNDS = 10;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// =============================================================================
// Token Utilities
// =============================================================================

function generateAccessToken(): string {
  return `at_${uuidv4().replace(/-/g, '')}${crypto.randomBytes(16).toString('hex')}`;
}

function generateRefreshToken(): string {
  return `rt_${uuidv4().replace(/-/g, '')}${crypto.randomBytes(16).toString('hex')}`;
}

// =============================================================================
// Slug Generation
// =============================================================================

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// =============================================================================
// Validation Functions
// =============================================================================

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address',
      },
    };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters',
      },
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must contain uppercase, lowercase, number, and special character',
      },
    };
  }

  return { valid: true };
}

export function validateCompanyName(companyName: string): ValidationResult {
  if (!companyName || companyName.trim().length < 2) {
    return {
      valid: false,
      error: {
        code: 'INVALID_COMPANY',
        message: 'Company name must be at least 2 characters',
      },
    };
  }

  if (companyName.length > 100) {
    return {
      valid: false,
      error: {
        code: 'INVALID_COMPANY',
        message: 'Company name must not exceed 100 characters',
      },
    };
  }

  return { valid: true };
}

export function validateFullName(fullName: string): ValidationResult {
  if (!fullName || fullName.trim().length < 2) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NAME',
        message: 'Full name must be at least 2 characters',
      },
    };
  }

  return { valid: true };
}

// =============================================================================
// Sanitization
// =============================================================================

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove remaining angle brackets
}

// =============================================================================
// Service Functions
// =============================================================================

export const portalAuthService = {
  // ---------------------------------------------------------------------------
  // Buyer Signup
  // ---------------------------------------------------------------------------
  async createBuyerAccount(input: BuyerSignupInput): Promise<AuthResponse> {
    // Sanitize inputs
    const email = sanitizeInput(input.email).toLowerCase();
    const fullName = sanitizeInput(input.fullName);
    const companyName = sanitizeInput(input.companyName);
    const phoneNumber = input.phoneNumber ? sanitizeInput(input.phoneNumber) : undefined;
    const country = input.country ? sanitizeInput(input.country) : undefined;
    const city = input.city ? sanitizeInput(input.city) : undefined;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }

    // Validate password
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate full name
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error };
    }

    // Validate company name
    const companyValidation = validateCompanyName(companyName);
    if (!companyValidation.valid) {
      return { success: false, error: companyValidation.error };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      };
    }

    // Hash password
    const passwordHash = hashPassword(input.password);

    // Create user and buyer profile in transaction
    const userId = `usr_${uuidv4().replace(/-/g, '')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          id: userId,
          email,
          name: fullName,
          portalRole: 'buyer',
          emailVerified: false,
          phoneNumber,
          companyName,
          passwordHash,
        },
      });

      // Create buyer profile
      const buyerProfile = await tx.buyerProfile.create({
        data: {
          userId: user.id,
          fullName,
          companyName,
          phoneNumber,
          country,
          city,
          status: 'active',
        },
      });

      return { user, buyerProfile };
    });

    // Generate tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.name || fullName,
        portalRole: 'buyer',
      },
      buyer: {
        id: result.buyerProfile.id,
        companyName: result.buyerProfile.companyName,
        status: result.buyerProfile.status,
      },
      accessToken,
      refreshToken,
      redirectTo: '/portal/buyer/dashboard',
    };
  },

  // ---------------------------------------------------------------------------
  // Seller Signup
  // ---------------------------------------------------------------------------
  async createSellerAccount(input: SellerSignupInput): Promise<AuthResponse> {
    // Sanitize inputs
    const email = sanitizeInput(input.email).toLowerCase();
    const fullName = sanitizeInput(input.fullName);
    const displayName = sanitizeInput(input.displayName);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }

    // Validate password
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate full name
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error };
    }

    // Validate display name (company name)
    const companyValidation = validateCompanyName(displayName);
    if (!companyValidation.valid) {
      return { success: false, error: companyValidation.error };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists',
        },
      };
    }

    // Generate unique slug
    const baseSlug = generateSlug(displayName);
    const slug = await ensureUniqueSlug(baseSlug);

    // Hash password
    const passwordHash = hashPassword(input.password);

    // Create user and seller profile in transaction
    const userId = `usr_${uuidv4().replace(/-/g, '')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          id: userId,
          email,
          name: fullName,
          portalRole: 'seller',
          emailVerified: false,
          companyName: displayName,
          passwordHash,
        },
      });

      // Create seller profile
      const sellerProfile = await tx.sellerProfile.create({
        data: {
          userId: user.id,
          displayName,
          slug,
          status: 'incomplete',
          profileComplete: false,
          companyVerified: false,
          bankVerified: false,
          documentsVerified: false,
          canPublish: false,
        },
      });

      return { user, sellerProfile };
    });

    // Generate tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.name || fullName,
        portalRole: 'seller',
      },
      seller: {
        id: result.sellerProfile.id,
        displayName: result.sellerProfile.displayName,
        slug: result.sellerProfile.slug,
        status: result.sellerProfile.status,
        onboardingStep: 1,
      },
      accessToken,
      refreshToken,
      redirectTo: '/portal/seller/onboarding',
    };
  },

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async login(input: LoginInput): Promise<AuthResponse> {
    const email = sanitizeInput(input.email).toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        buyerProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      };
    }

    // Verify password
    if (!verifyPassword(input.password, user.passwordHash)) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      };
    }

    // Check portal role matches
    if (user.portalRole !== input.portalType) {
      return {
        success: false,
        error: {
          code: 'WRONG_PORTAL',
          message: `This account is registered as a ${user.portalRole}`,
        },
      };
    }

    // Generate tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();

    // Build response based on role
    if (user.portalRole === 'buyer') {
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name || '',
          portalRole: 'buyer',
        },
        buyer: user.buyerProfile ? {
          id: user.buyerProfile.id,
          companyName: user.buyerProfile.companyName,
          status: user.buyerProfile.status,
        } : undefined,
        accessToken,
        refreshToken,
        redirectTo: '/portal/buyer/dashboard',
      };
    }

    // For seller, fetch seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name || '',
        portalRole: 'seller',
      },
      seller: sellerProfile ? {
        id: sellerProfile.id,
        displayName: sellerProfile.displayName,
        slug: sellerProfile.slug,
        status: sellerProfile.status,
        onboardingStep: getOnboardingStep(sellerProfile),
      } : undefined,
      accessToken,
      refreshToken,
      redirectTo: sellerProfile?.status === 'incomplete'
        ? '/portal/seller/onboarding'
        : '/portal/seller/dashboard',
    };
  },

  // ---------------------------------------------------------------------------
  // Get Buyer Profile
  // ---------------------------------------------------------------------------
  async getBuyerProfile(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
    });
  },

  // ---------------------------------------------------------------------------
  // Get Seller Onboarding State
  // ---------------------------------------------------------------------------
  async getOnboardingState(userId: string) {
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        address: true,
        contact: true,
        bank: true,
        documents: true,
      },
    });

    // If no seller profile exists, try to create one
    if (!sellerProfile) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      // Create a new seller profile for this user
      const displayName = user.companyName || user.name || 'My Store';
      const baseSlug = displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.sellerProfile.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId,
          displayName,
          slug,
          status: 'incomplete',
          profileComplete: false,
          companyVerified: false,
          bankVerified: false,
          documentsVerified: false,
          canPublish: false,
        },
        include: {
          company: true,
          address: true,
          contact: true,
          bank: true,
          documents: true,
        },
      });
    }

    return {
      sellerId: sellerProfile.id,
      status: sellerProfile.status,
      currentStep: getOnboardingStep(sellerProfile),
      steps: {
        profile: {
          complete: !!sellerProfile.displayName && !!sellerProfile.slug,
          data: {
            displayName: sellerProfile.displayName,
            slug: sellerProfile.slug,
            shortDescription: sellerProfile.shortDescription,
            logoUrl: sellerProfile.logoUrl,
            coverUrl: sellerProfile.coverUrl,
          },
        },
        company: {
          complete: !!sellerProfile.company?.legalName,
          data: sellerProfile.company,
        },
        address: {
          complete: !!sellerProfile.address?.city,
          data: sellerProfile.address,
        },
        contact: {
          complete: !!sellerProfile.contact?.businessEmail,
          data: sellerProfile.contact,
        },
        bank: {
          complete: !!sellerProfile.bank?.iban,
          data: sellerProfile.bank ? {
            ...sellerProfile.bank,
            iban: sellerProfile.bank.ibanMasked || maskIban(sellerProfile.bank.iban),
          } : null,
        },
        documents: {
          complete: sellerProfile.documents.length > 0,
          data: sellerProfile.documents.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            verificationStatus: doc.verificationStatus,
            uploadedAt: doc.uploadedAt,
          })),
        },
      },
      verification: {
        profileComplete: sellerProfile.profileComplete,
        companyVerified: sellerProfile.companyVerified,
        bankVerified: sellerProfile.bankVerified,
        documentsVerified: sellerProfile.documentsVerified,
        canPublish: sellerProfile.canPublish,
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Save Onboarding Step Data
  // ---------------------------------------------------------------------------
  async saveOnboardingStep(userId: string, stepId: number, stepData: any): Promise<{ success: boolean; error?: string; completedSteps?: number[]; currentStep?: number }> {
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        address: true,
        contact: true,
        bank: true,
        documents: true,
      },
    });

    // If seller profile doesn't exist, try to create one
    if (!sellerProfile) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found. Please log in again.' };
      }

      // Create a new seller profile for this user
      const displayName = user.companyName || user.name || 'My Store';
      const baseSlug = displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.sellerProfile.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId,
          displayName,
          slug,
          status: 'incomplete',
          profileComplete: false,
          companyVerified: false,
          bankVerified: false,
          documentsVerified: false,
          canPublish: false,
        },
        include: {
          company: true,
          address: true,
          contact: true,
          bank: true,
          documents: true,
        },
      });
    }

    try {
      switch (stepId) {
        case 1:
          // Company Legal Info
          await prisma.sellerCompany.upsert({
            where: { sellerId: sellerProfile.id },
            create: {
              sellerId: sellerProfile.id,
              legalName: stepData.legalName,
              crNumber: stepData.crNumber,
              companyType: stepData.companyType,
              vatNumber: stepData.vatNumber,
              dateOfEstablishment: stepData.dateOfEstablishment ? new Date(stepData.dateOfEstablishment) : null,
            },
            update: {
              legalName: stepData.legalName,
              crNumber: stepData.crNumber,
              companyType: stepData.companyType,
              vatNumber: stepData.vatNumber,
              dateOfEstablishment: stepData.dateOfEstablishment ? new Date(stepData.dateOfEstablishment) : null,
            },
          });
          break;

        case 2:
          // National Address
          await prisma.sellerAddress.upsert({
            where: { sellerId: sellerProfile.id },
            create: {
              sellerId: sellerProfile.id,
              country: stepData.country,
              city: stepData.city,
              district: stepData.district,
              street: stepData.street,
              buildingNumber: stepData.buildingNumber,
              postalCode: stepData.postalCode,
            },
            update: {
              country: stepData.country,
              city: stepData.city,
              district: stepData.district,
              street: stepData.street,
              buildingNumber: stepData.buildingNumber,
              postalCode: stepData.postalCode,
            },
          });
          break;

        case 3:
          // Business Contacts
          await prisma.sellerContact.upsert({
            where: { sellerId: sellerProfile.id },
            create: {
              sellerId: sellerProfile.id,
              businessEmail: stepData.businessEmail,
              phoneNumber: stepData.phoneNumber || stepData.phone,
              whatsapp: stepData.whatsapp,
              supportContactName: stepData.supportContactName,
            },
            update: {
              businessEmail: stepData.businessEmail,
              phoneNumber: stepData.phoneNumber || stepData.phone,
              whatsapp: stepData.whatsapp,
              supportContactName: stepData.supportContactName,
            },
          });
          break;

        case 4:
          // Banking & Payout
          await prisma.sellerBank.upsert({
            where: { sellerId: sellerProfile.id },
            create: {
              sellerId: sellerProfile.id,
              bankName: stepData.bankName,
              accountHolderName: stepData.accountHolderName,
              iban: stepData.iban,
              ibanMasked: maskIban(stepData.iban),
            },
            update: {
              bankName: stepData.bankName,
              accountHolderName: stepData.accountHolderName,
              iban: stepData.iban,
              ibanMasked: maskIban(stepData.iban),
            },
          });
          break;

        case 5:
          // Documents - handle file uploads separately
          // For now, just acknowledge the step
          break;

        case 6:
          // Public Storefront
          await prisma.sellerProfile.update({
            where: { id: sellerProfile.id },
            data: {
              shortDescription: stepData.shortDescription,
              slug: stepData.slug || sellerProfile.slug,
              logoUrl: stepData.logoUrl,
              coverUrl: stepData.coverUrl,
            },
          });
          break;
      }

      // Get updated profile to calculate completed steps
      const updatedProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
        include: {
          company: true,
          address: true,
          contact: true,
          bank: true,
          documents: true,
        },
      });

      const completedSteps = this.calculateCompletedSteps(updatedProfile);
      const currentStep = getOnboardingStep(updatedProfile);

      return {
        success: true,
        completedSteps,
        currentStep,
      };
    } catch (error) {
      console.error('Save onboarding step error:', error);
      return { success: false, error: 'Failed to save step data' };
    }
  },

  // Calculate which steps are completed
  calculateCompletedSteps(profile: any): number[] {
    const completed: number[] = [];
    if (profile?.company?.legalName && profile?.company?.crNumber) completed.push(1);
    if (profile?.address?.city && profile?.address?.street) completed.push(2);
    if (profile?.contact?.businessEmail && profile?.contact?.phoneNumber) completed.push(3);
    if (profile?.bank?.iban) completed.push(4);
    if (profile?.documents?.length > 0) completed.push(5);
    if (profile?.shortDescription && profile?.slug) completed.push(6);
    return completed;
  },

  // ---------------------------------------------------------------------------
  // Submit Onboarding for Review
  // ---------------------------------------------------------------------------
  async submitForReview(userId: string): Promise<{ success: boolean; error?: string }> {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        company: true,
        address: true,
        contact: true,
        bank: true,
        documents: true,
      },
    });

    if (!sellerProfile) {
      return { success: false, error: 'Seller profile not found' };
    }

    // Check minimum requirements
    if (!sellerProfile.company?.legalName) {
      return { success: false, error: 'Company information is required' };
    }

    if (!sellerProfile.address?.city) {
      return { success: false, error: 'Business address is required' };
    }

    if (!sellerProfile.contact?.businessEmail) {
      return { success: false, error: 'Contact information is required' };
    }

    if (!sellerProfile.bank?.iban) {
      return { success: false, error: 'Banking information is required' };
    }

    // Update status to pending review
    await prisma.sellerProfile.update({
      where: { userId },
      data: {
        status: 'pending_review',
        profileComplete: true,
      },
    });

    return { success: true };
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getOnboardingStep(profile: any): number {
  if (!profile.displayName) return 1;
  if (!profile.company?.legalName) return 1;
  if (!profile.address?.city) return 2;
  if (!profile.contact?.businessEmail) return 3;
  if (!profile.bank?.iban) return 4;
  if (!profile.documents || profile.documents.length === 0) return 5;
  return 6;
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban;
  const prefix = iban.substring(0, 4);
  const suffix = iban.substring(iban.length - 4);
  return `${prefix}${'*'.repeat(iban.length - 8)}${suffix}`;
}

export default portalAuthService;
