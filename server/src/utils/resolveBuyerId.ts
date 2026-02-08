// =============================================================================
// Shared helper: Resolve buyerId from request
// =============================================================================
// Handles all auth scenarios:
// 1. Portal JWT with buyerId in payload
// 2. Clerk/dev-token auth with userId → lookup BuyerProfile
// 3. Auto-creates User + BuyerProfile if missing (dev/portal flows)
// =============================================================================

import { Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { apiLogger } from './logger';

export async function resolveBuyerId(req: Request): Promise<string | null> {
  // 1. Check portal JWT token for buyerId
  const portalAuth = (req as any).portalAuth;
  if (portalAuth?.buyerId) {
    // Verify the profile still exists (could have been deleted by a reset)
    const existing = await prisma.buyerProfile.findUnique({
      where: { id: portalAuth.buyerId },
      select: { id: true },
    });
    if (existing) return existing.id;
    // Profile was deleted — fall through to re-create below
  }

  // 2. Get userId from auth
  const userId = (req as AuthRequest).auth?.userId;
  if (!userId) return null;

  // 3. Look up existing BuyerProfile by userId
  const buyer = await prisma.buyerProfile.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (buyer) return buyer.id;

  // 4. Ensure User record exists (may have been deleted by reset, or never created for dev tokens)
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    // Derive email from portalAuth or generate a placeholder
    const email = portalAuth?.email || `${userId}@portal.local`;
    const name = portalAuth?.email?.split('@')[0] || 'Portal User';

    user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        portalRole: 'buyer',
        portalStatus: 'active',
        lastActiveAt: new Date(),
      },
    });
    apiLogger.info('[resolveBuyerId] Auto-created User for userId:', userId);
  }

  // 5. Create BuyerProfile
  const newProfile = await prisma.buyerProfile.create({
    data: {
      userId: user.id,
      fullName: user.name || 'Buyer',
      companyName: user.name || 'My Company',
      status: 'active',
    },
  });

  apiLogger.info('[resolveBuyerId] Auto-created BuyerProfile for userId:', userId);
  return newProfile.id;
}
