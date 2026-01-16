import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Path to the SQLite database
const dbPath = path.join(__dirname, '../../prisma/dev.db');

// Create the Prisma adapter factory
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

// Create the Prisma client with the adapter
export const prisma = new PrismaClient({ adapter });

// Export for type inference
export type { PrismaClient };
