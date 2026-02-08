// =============================================================================
// Portal Authentication Routes
// Handles Buyer and Seller signup, login endpoints
// =============================================================================

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { portalAuthService } from '../services/portalAuthService';
import {
  requirePortalAuth,
  requirePortalUser,
  PortalAuthRequest,
} from '../middleware/portalAdminMiddleware';
import { refreshAccessToken } from '../auth/portalToken';
import { apiLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { setCsrfCookie } from '../middleware/security';

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
    apiLogger.error('Buyer signup error:', error);
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
    apiLogger.error('Seller signup error:', error);
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
    apiLogger.error('Login error:', error);
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
// Token Refresh
// =============================================================================

/**
 * POST /api/auth/portal/refresh
 *
 * Refresh access token using refresh token
 *
 * Request body:
 * {
 *   refreshToken: string
 * }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    const result = await refreshAccessToken(
      refreshToken,
      portalAuthService.getUserForTokenRefresh
    );

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error) {
    apiLogger.error('Token refresh error:', error);
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
// Get Current User / Session Validation
// =============================================================================

/**
 * GET /api/auth/portal/me
 *
 * Validate session and return current user info
 * Use this endpoint to check if the user's session is still valid
 *
 * Headers:
 *   Authorization: Bearer <accessToken>
 *
 * Returns:
 *   - success: boolean
 *   - user: { id, email, name, portalRole, portalStatus }
 *   - seller?: { id, displayName, slug, status, onboardingStep }
 *   - buyer?: { id, companyName, status }
 *   - tokenInfo: { expiresAt }
 */
router.get(
  '/me',
  requirePortalAuth(),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const user = req.portalUser!;
      const tokenPayload = req.portalAuth;

      // Build response with user info
      const response: Record<string, unknown> = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          portalRole: user.portalRole,
          portalStatus: user.portalStatus,
        },
        tokenInfo: {
          expiresAt: tokenPayload?.exp ? tokenPayload.exp * 1000 : null,
        },
      };

      // Fetch seller info if applicable
      if (user.portalRole === 'seller') {
        const seller = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            displayName: true,
            slug: true,
            status: true,
          },
        });
        if (seller) {
          response.seller = seller;
        }
      }

      // Fetch buyer info if applicable
      if (user.portalRole === 'buyer') {
        const buyer = await prisma.buyerProfile.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        });
        if (buyer) {
          response.buyer = buyer;
        }
      }

      res.status(200).json(response);
    } catch (error) {
      apiLogger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  }
);

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
router.get(
  '/seller/onboarding',
  requirePortalAuth(),
  requirePortalUser(),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const userId = req.portalUser!.id;

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
      apiLogger.error('Get onboarding state error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      });
    }
  }
);

// =============================================================================
// Save Onboarding Step Data
// =============================================================================

/**
 * PUT /api/auth/portal/seller/onboarding/step/:stepId
 *
 * Save seller onboarding step data (partial update)
 *
 * Headers:
 *   Authorization: Bearer <accessToken>
 *
 * Request body:
 *   Step-specific data
 */
router.put(
  '/seller/onboarding/step/:stepId',
  requirePortalAuth(),
  requirePortalUser(),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const userId = req.portalUser!.id;
      const stepId = parseInt(req.params.stepId as string, 10);
      const stepData = req.body;

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
      apiLogger.error('Save onboarding step error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      });
    }
  }
);

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
router.post(
  '/seller/onboarding/submit',
  requirePortalAuth(),
  requirePortalUser(),
  async (req: PortalAuthRequest, res: Response) => {
    try {
      const userId = req.portalUser!.id;

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
      apiLogger.error('Submit onboarding error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      });
    }
  }
);

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

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    res.status(200).json({
      success: true,
      available: !existingUser,
    });
  } catch (error) {
    apiLogger.error('Check email error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
});

// =============================================================================
// CSRF Token
// =============================================================================

router.get('/csrf-token', (_req: Request, res: Response) => {
  const token = setCsrfCookie(res);
  res.json({ csrfToken: token });
});

export default router;
