#!/usr/bin/env tsx
/**
 * Database Connectivity Check
 *
 * Run with: pnpm db:ping
 *
 * Checks if the database is reachable and responsive.
 * Exits with 0 if successful, 1 if failed.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const TIMEOUT_MS = 10000;

async function checkDatabaseConnectivity(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  console.log('🔍 Checking database connectivity...\n');

  // Check if DATABASE_URL is set
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.log('\nTips:');
    console.log('  - Copy server/.env.example to server/.env');
    console.log('  - Set DATABASE_URL to your PostgreSQL connection string');
    console.log('  - Run `pnpm db:up` to start local PostgreSQL via Docker');
    process.exit(1);
  }

  // Parse and display connection info (without password)
  try {
    const url = new URL(databaseUrl);
    console.log(`📍 Host: ${url.hostname}`);
    console.log(`📍 Port: ${url.port || '5432'}`);
    console.log(`📍 Database: ${url.pathname.slice(1)}`);
    console.log(`📍 User: ${url.username || 'postgres'}`);
    console.log('');
  } catch {
    console.log(`📍 Connection: ${databaseUrl.substring(0, 30)}...`);
  }

  // Create Prisma client
  const prisma = new PrismaClient();

  // Set up timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Connection timeout')), TIMEOUT_MS);
  });

  try {
    // Try to connect
    console.log('⏳ Connecting...');
    const startTime = Date.now();

    await Promise.race([
      prisma.$connect(),
      timeoutPromise,
    ]);

    // Test query
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      timeoutPromise,
    ]);

    const responseTime = Date.now() - startTime;

    console.log(`✅ Database is reachable (${responseTime}ms)\n`);

    // Try to get some stats
    try {
      const tableCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      console.log(`📊 Tables in public schema: ${tableCount[0].count}`);
    } catch {
      // Ignore if we can't get stats
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    await prisma.$disconnect().catch(() => {});

    console.error('❌ Database connection failed\n');

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);

      // Provide helpful tips based on error type
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Tips:');
        console.log('  - Is PostgreSQL running?');
        console.log('  - Run `pnpm db:up` to start local PostgreSQL via Docker');
        console.log('  - Check if the port in DATABASE_URL matches your PostgreSQL port');
      } else if (error.message.includes('authentication')) {
        console.log('\n💡 Tips:');
        console.log('  - Check the username and password in DATABASE_URL');
        console.log('  - Make sure the database user exists and has correct permissions');
      } else if (error.message.includes('does not exist')) {
        console.log('\n💡 Tips:');
        console.log('  - The database might not exist yet');
        console.log('  - Run `pnpm prisma:migrate` to create the database and tables');
      } else if (error.message.includes('timeout')) {
        console.log('\n💡 Tips:');
        console.log('  - The database might be slow to respond');
        console.log('  - Check network connectivity if using a remote database');
        console.log('  - Increase timeout if needed');
      }
    } else {
      console.error('Unknown error:', error);
    }

    process.exit(1);
  }
}

checkDatabaseConnectivity();
