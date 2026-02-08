# PostgreSQL Row-Level Security (RLS) Plan

## Goal
Enforce multi-tenant data isolation at the database level, not just application code.

## Current State
- Tenant isolation relies on `WHERE workspaceId = ?` in application queries
- If any query forgets the filter, cross-tenant data leakage is possible
- Portal users (buyers/sellers) share the same tables with workspace users

## Proposed RLS Policies

### Phase 1: Core Tables
Apply RLS to the highest-risk tables first:

```sql
-- Enable RLS on the table
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see orders in their workspace
CREATE POLICY workspace_isolation ON "Order"
  USING ("workspaceId" = current_setting('app.current_workspace_id')::text);

-- Similar for other core tables:
-- Invoice, Payment, Payout, Dispute, Return, Item, Customer
```

### Phase 2: Portal Tables
```sql
-- Buyer can only see their own purchases
CREATE POLICY buyer_isolation ON "MarketplaceOrder"
  USING ("buyerId" = current_setting('app.current_user_id')::text);

-- Seller can only see orders for their items
CREATE POLICY seller_isolation ON "MarketplaceOrder"
  USING ("sellerId" = current_setting('app.current_user_id')::text);
```

### Phase 3: Audit Tables
```sql
-- Activity logs scoped to workspace
CREATE POLICY activity_isolation ON "Activity"
  USING ("workspaceId" = current_setting('app.current_workspace_id')::text);
```

## Implementation Steps

1. **Prisma middleware** — Set `app.current_workspace_id` and `app.current_user_id` session variables on every request:
   ```typescript
   prisma.$use(async (params, next) => {
     await prisma.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
     return next(params);
   });
   ```

2. **Migration** — Create RLS policies via raw SQL migration (Prisma doesn't support RLS natively):
   ```
   server/prisma/migrations/YYYYMMDD_add_rls_policies/migration.sql
   ```

3. **Testing** — Create integration tests that verify:
   - User A cannot read User B's data
   - Portal buyer cannot see other buyer's orders
   - Admin can see all data (bypass policy)

4. **Bypass for admin** — Create a separate Prisma client for admin operations:
   ```sql
   CREATE ROLE nabd_admin BYPASSRLS;
   ```

## Prerequisites
- PostgreSQL (not SQLite) must be the active database
- All queries must go through Prisma (no raw SQL bypassing the middleware)
- Thorough testing before enabling in production

## Risks
- Performance: RLS adds overhead to every query (mitigated by indexes)
- Prisma compatibility: Some operations may need raw SQL
- Migration complexity: Must be done carefully with zero downtime

## Timeline
- Estimated: 1 week for Phase 1, 3 days for Phase 2, 2 days for Phase 3
- Should be done after migrating fully to PostgreSQL in production
