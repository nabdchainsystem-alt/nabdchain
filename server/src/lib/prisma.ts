import { PrismaClient } from '@prisma/client';

// Use PostgreSQL via DATABASE_URL environment variable
const prisma = new PrismaClient();

export { prisma };

// Export for type inference
export type { PrismaClient };
