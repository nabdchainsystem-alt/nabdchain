// =============================================================================
// Portal Authentication Routes
// Handles Buyer and Seller signup, login endpoints
// =============================================================================

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { portalAuthService } from '../services/portalAuthService';

const router = Router();

// =============================================================================
// Rate Limiting
// =============================================================================

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many signup attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================================================
// Buyer Signup
// =============================================================================

/**
 * POST /api/auth/portal/buyer/signup
 *
 * Create a new buyer account
 *
 * Request body:
 * {
 *   fullName: string,
 *   email: string,
 *   password: string,
 *   companyName: string,
 *   phoneNumber?: string,
 *   country?: string,
 *   city?: string
 * }
 */
router.post('/buyer/signup', signupLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, companyName, phoneNumber, country, city } = req.body;

    // Basic required field validation
    if (!fullName || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Full name, email, password, and company name are required',
        },
      });
    }

    const result = await portalAuthService.createBuyerAccount({
      fullName,
      email,
      password,
      companyName,
      phoneNumber,
      country,
      city,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Buyer signup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Seller Signup
// =============================================================================

/**
 * POST /api/auth/portal/seller/signup
 *
 * Create a new seller account (Layer A - Account Creation)
 *
 * Request body:
 * {
 *   fullName: string,
 *   email: string,
 *   password: string,
 *   displayName: string
 * }
 */
router.post('/seller/signup', signupLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, displayName } = req.body;

    // Basic required field validation
    if (!fullName || !email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Full name, email, password, and display name are required',
        },
      });
    }

    const result = await portalAuthService.createSellerAccount({
      fullName,
      email,
      password,
      displayName,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Seller signup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Login
// =============================================================================

/**
 * POST /api/auth/portal/login
 *
 * Login to portal
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   portalType: 'buyer' | 'seller'
 * }
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, portalType } = req.body;

    // Basic required field validation
    if (!email || !password || !portalType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, and portal type are required',
        },
      });
    }

    if (portalType !== 'buyer' && portalType !== 'seller') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PORTAL_TYPE',
          message: 'Portal type must be "buyer" or "seller"',
        },
      });
    }

    const result = await portalAuthService.login({
      email,
      password,
      portalType,
    });

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Get Onboarding State (for sellers)
// =============================================================================

/**
 * GET /api/auth/portal/seller/onboarding
 *
 * Get seller onboarding state
 *
 * Headers:
 *   Authorization: Bearer <accessToken>
 */
router.get('/seller/onboarding', async (req: Request, res: Response) => {
  try {
    // In production, extract userId from JWT token
    // For now, get from query param or header
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
      });
    }

    const state = await portalAuthService.getOnboardingState(userId);

    if (!state) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Seller profile not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Get onboarding state error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Save Onboarding Step Data
// =============================================================================

/**
 * PUT /api/auth/portal/seller/onboarding/step/:stepId
 *
 * Save seller onboarding step data (partial update)
 *
 * Headers:
 *   x-user-id: string (userId)
 *
 * Request body:
 *   Step-specific data
 */
router.put('/seller/onboarding/step/:stepId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const stepId = parseInt(req.params.stepId, 10);
    const stepData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
      });
    }

    if (isNaN(stepId) || stepId < 1 || stepId > 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STEP',
          message: 'Step ID must be between 1 and 6',
        },
      });
    }

    const result = await portalAuthService.saveOnboardingStep(userId, stepId, stepData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: result.error,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Step ${stepId} saved successfully`,
      completedSteps: result.completedSteps,
      currentStep: result.currentStep,
    });
  } catch (error) {
    console.error('Save onboarding step error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Submit Onboarding for Review
// =============================================================================

/**
 * POST /api/auth/portal/seller/onboarding/submit
 *
 * Submit seller onboarding for review
 *
 * Headers:
 *   Authorization: Bearer <accessToken>
 */
router.post('/seller/onboarding/submit', async (req: Request, res: Response) => {
  try {
    // In production, extract userId from JWT token
    const userId = req.headers['x-user-id'] as string || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID is required',
        },
      });
    }

    const result = await portalAuthService.submitForReview(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding submitted for review',
      redirectTo: '/portal/seller/dashboard',
    });
  } catch (error) {
    console.error('Submit onboarding error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  }
});

// =============================================================================
// Check Email Availability
// =============================================================================

/**
 * GET /api/auth/portal/check-email
 *
 * Check if email is available
 *
 * Query params:
 *   email: string
 */
router.get('/check-email', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required',
        },
      });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    res.status(200).json({
      success: true,
      available: !existingUser,
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
});

export default router;
