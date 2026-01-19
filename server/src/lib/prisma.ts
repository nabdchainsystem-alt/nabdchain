import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

// In production, use PostgreSQL directly (no adapter needed)
// In development, use SQLite with better-sqlite3 adapter
let prisma: PrismaClient;

if (isProduction) {
    // PostgreSQL in production - no adapter needed, uses DATABASE_URL from env
    prisma = new PrismaClient();
} else {
    // SQLite in development
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../prisma/dev.db');
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });
}

export { prisma };

// Export for type inference
export type { PrismaClient };
