// =============================================================================
// RBAC Seed Script - Initialize Roles and Permissions
// =============================================================================
// Run with: npx ts-node scripts/seedRbac.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Permission Definitions
// =============================================================================

const permissions = [
  // Orders
  { code: 'orders:view_own', name: 'View Own Orders', resource: 'orders', action: 'view_own', description: 'View orders where user is buyer or seller' },
  { code: 'orders:view_team', name: 'View Team Orders', resource: 'orders', action: 'view_team', description: 'View orders from team members' },
  { code: 'orders:view_all', name: 'View All Orders', resource: 'orders', action: 'view_all', description: 'View all orders in the system' },
  { code: 'orders:create', name: 'Create Orders', resource: 'orders', action: 'create', description: 'Create new orders' },
  { code: 'orders:update_status', name: 'Update Order Status', resource: 'orders', action: 'update_status', description: 'Update order status (confirm, ship, deliver)' },
  { code: 'orders:cancel', name: 'Cancel Orders', resource: 'orders', action: 'cancel', description: 'Cancel orders' },
  { code: 'orders:approve', name: 'Approve Orders', resource: 'orders', action: 'approve', description: 'Approve high-value orders' },

  // RFQs
  { code: 'rfqs:view_own', name: 'View Own RFQs', resource: 'rfqs', action: 'view_own', description: 'View RFQs created by or sent to user' },
  { code: 'rfqs:view_all', name: 'View All RFQs', resource: 'rfqs', action: 'view_all', description: 'View all RFQs in the system' },
  { code: 'rfqs:create', name: 'Create RFQs', resource: 'rfqs', action: 'create', description: 'Create new RFQ requests' },
  { code: 'rfqs:respond', name: 'Respond to RFQs', resource: 'rfqs', action: 'respond', description: 'Respond to RFQs with quotes' },

  // Invoices
  { code: 'invoices:view_own', name: 'View Own Invoices', resource: 'invoices', action: 'view_own', description: 'View invoices where user is buyer or seller' },
  { code: 'invoices:view_all', name: 'View All Invoices', resource: 'invoices', action: 'view_all', description: 'View all invoices in the system' },
  { code: 'invoices:create', name: 'Create Invoices', resource: 'invoices', action: 'create', description: 'Create new invoices' },
  { code: 'invoices:issue', name: 'Issue Invoices', resource: 'invoices', action: 'issue', description: 'Issue invoices to buyers' },
  { code: 'invoices:mark_paid', name: 'Mark Invoices Paid', resource: 'invoices', action: 'mark_paid', description: 'Mark invoices as paid' },
  { code: 'invoices:export', name: 'Export Invoices', resource: 'invoices', action: 'export', description: 'Export invoice data' },

  // Payouts
  { code: 'payouts:view_own', name: 'View Own Payouts', resource: 'payouts', action: 'view_own', description: 'View own payout records' },
  { code: 'payouts:view_all', name: 'View All Payouts', resource: 'payouts', action: 'view_all', description: 'View all payout records' },
  { code: 'payouts:initiate', name: 'Initiate Payouts', resource: 'payouts', action: 'initiate', description: 'Initiate payout processing' },
  { code: 'payouts:approve', name: 'Approve Payouts', resource: 'payouts', action: 'approve', description: 'Approve payout requests' },

  // Items
  { code: 'items:view_public', name: 'View Public Items', resource: 'items', action: 'view_public', description: 'View publicly listed items' },
  { code: 'items:view_own', name: 'View Own Items', resource: 'items', action: 'view_own', description: 'View own item listings' },
  { code: 'items:create', name: 'Create Items', resource: 'items', action: 'create', description: 'Create new item listings' },
  { code: 'items:update', name: 'Update Items', resource: 'items', action: 'update', description: 'Update item listings' },
  { code: 'items:publish', name: 'Publish Items', resource: 'items', action: 'publish', description: 'Publish items to marketplace' },

  // Analytics
  { code: 'analytics:view_own', name: 'View Own Analytics', resource: 'analytics', action: 'view_own', description: 'View own analytics and reports' },
  { code: 'analytics:view_all', name: 'View All Analytics', resource: 'analytics', action: 'view_all', description: 'View all analytics and reports' },
  { code: 'analytics:export', name: 'Export Analytics', resource: 'analytics', action: 'export', description: 'Export analytics data' },

  // Disputes
  { code: 'disputes:view_own', name: 'View Own Disputes', resource: 'disputes', action: 'view_own', description: 'View disputes involving user' },
  { code: 'disputes:create', name: 'Create Disputes', resource: 'disputes', action: 'create', description: 'Create new dispute cases' },
  { code: 'disputes:respond', name: 'Respond to Disputes', resource: 'disputes', action: 'respond', description: 'Respond to dispute cases' },
  { code: 'disputes:resolve', name: 'Resolve Disputes', resource: 'disputes', action: 'resolve', description: 'Resolve and close dispute cases' },
];

// =============================================================================
// Role Definitions
// =============================================================================

const roles = [
  {
    code: 'buyer',
    name: 'Buyer',
    description: 'Marketplace buyer - can view/create orders, RFQs, view invoices',
    isSystem: true,
    permissions: [
      'orders:view_own',
      'orders:create',
      'orders:cancel',
      'rfqs:view_own',
      'rfqs:create',
      'invoices:view_own',
      'items:view_public',
      'analytics:view_own',
      'disputes:view_own',
      'disputes:create',
    ],
  },
  {
    code: 'approver',
    name: 'Approver',
    description: 'Buyer with approval authority - can approve high-value orders, view team analytics',
    isSystem: true,
    permissions: [
      'orders:view_own',
      'orders:view_team',
      'orders:create',
      'orders:cancel',
      'orders:approve',
      'rfqs:view_own',
      'rfqs:create',
      'invoices:view_own',
      'invoices:export',
      'items:view_public',
      'analytics:view_own',
      'analytics:export',
      'disputes:view_own',
      'disputes:create',
    ],
  },
  {
    code: 'finance',
    name: 'Finance',
    description: 'Financial oversight - can view all financial data, manage payouts, resolve disputes',
    isSystem: true,
    permissions: [
      'orders:view_all',
      'rfqs:view_all',
      'invoices:view_own',
      'invoices:view_all',
      'invoices:mark_paid',
      'invoices:export',
      'payouts:view_all',
      'payouts:initiate',
      'payouts:approve',
      'items:view_public',
      'analytics:view_own',
      'analytics:view_all',
      'analytics:export',
      'disputes:resolve',
    ],
  },
  {
    code: 'seller',
    name: 'Seller',
    description: 'Marketplace seller - can manage listings, respond to RFQs, fulfill orders, view payouts',
    isSystem: true,
    permissions: [
      'orders:view_own',
      'orders:update_status',
      'orders:cancel',
      'rfqs:view_own',
      'rfqs:respond',
      'invoices:view_own',
      'invoices:create',
      'invoices:issue',
      'invoices:mark_paid',
      'invoices:export',
      'payouts:view_own',
      'items:view_public',
      'items:view_own',
      'items:create',
      'items:update',
      'items:publish',
      'analytics:view_own',
      'analytics:export',
      'disputes:view_own',
      'disputes:respond',
    ],
  },
];

// =============================================================================
// Seed Functions
// =============================================================================

async function seedPermissions() {
  console.log('Seeding permissions...');

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: {
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  console.log(`  Created/updated ${permissions.length} permissions`);
}

async function seedRoles() {
  console.log('Seeding roles...');

  for (const roleData of roles) {
    // Create or update the role
    const role = await prisma.role.upsert({
      where: { code: roleData.code },
      create: {
        code: roleData.code,
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
      update: {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
    });

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Assign permissions to the role
    for (const permCode of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permCode },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      } else {
        console.warn(`  Warning: Permission '${permCode}' not found for role '${roleData.code}'`);
      }
    }

    console.log(`  Created/updated role '${roleData.code}' with ${roleData.permissions.length} permissions`);
  }
}

async function migrateExistingUsers() {
  console.log('Migrating existing users...');

  // Get all users with portalRole
  const users = await prisma.user.findMany({
    where: {
      portalRole: { not: null },
    },
    select: {
      id: true,
      portalRole: true,
    },
  });

  let migratedCount = 0;

  for (const user of users) {
    if (!user.portalRole) continue;

    // Find the corresponding role
    const role = await prisma.role.findUnique({
      where: { code: user.portalRole },
    });

    if (!role) {
      console.warn(`  Warning: Role '${user.portalRole}' not found for user '${user.id}'`);
      continue;
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: 'system_migration',
          isActive: true,
        },
      });
      migratedCount++;
    }
  }

  console.log(`  Migrated ${migratedCount} users to RBAC system`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('RBAC Seed Script - Starting...');
  console.log('='.repeat(60));

  try {
    await seedPermissions();
    await seedRoles();
    await migrateExistingUsers();

    console.log('='.repeat(60));
    console.log('RBAC Seed Script - Completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
