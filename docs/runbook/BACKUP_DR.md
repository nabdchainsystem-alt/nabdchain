# Backup & Disaster Recovery Runbook

## Database Backup

### Automated Daily Backups (PostgreSQL)

Set up a cron job or use your hosting provider's backup feature:

```bash
# Daily backup at 2 AM UTC
0 2 * * * pg_dump "$DATABASE_URL" --format=custom --compress=9 \
  --file="/backups/nabd-$(date +%Y%m%d-%H%M%S).dump"
```

### Manual Backup

```bash
# Full database dump
pg_dump "$DATABASE_URL" --format=custom --compress=9 --file=nabd-backup.dump

# Schema only (for migration planning)
pg_dump "$DATABASE_URL" --schema-only --file=nabd-schema.sql

# Data only
pg_dump "$DATABASE_URL" --data-only --format=custom --file=nabd-data.dump
```

### Backup Verification

```bash
# Verify backup integrity
pg_restore --list nabd-backup.dump > /dev/null && echo "Backup OK" || echo "Backup CORRUPT"

# Restore to a test database to verify
createdb nabd_test_restore
pg_restore --dbname=nabd_test_restore nabd-backup.dump
dropdb nabd_test_restore
```

## Restore Procedures

### Full Restore

```bash
# 1. Stop the application
# 2. Create fresh database
dropdb nabd_production
createdb nabd_production

# 3. Restore from backup
pg_restore --dbname=nabd_production --clean --if-exists nabd-backup.dump

# 4. Verify data
psql nabd_production -c "SELECT count(*) FROM \"User\";"

# 5. Restart application
```

### Point-in-Time Recovery (if WAL archiving is enabled)

```bash
# Restore to specific timestamp
pg_restore --dbname=nabd_production --target-time="2026-02-07 15:00:00" nabd-backup.dump
```

## Recovery Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | 24 hours | Daily backups |
| **RTO** (Recovery Time Objective) | 1 hour | Restore + restart |
| **Backup Retention** | 30 days | Keep last 30 daily backups |

To achieve **RPO < 1 hour**, enable WAL archiving for continuous backups.

## File Storage (R2/S3)

Cloudflare R2 handles its own replication. For additional safety:

```bash
# Sync R2 bucket to backup location
aws s3 sync s3://nabd-uploads s3://nabd-uploads-backup --source-region auto
```

## Environment Recovery

Critical environment variables to restore:
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` — Authentication
- `ENCRYPTION_KEY` — Data encryption (CRITICAL: without this, encrypted data is lost)
- `PORTAL_JWT_SECRET` — Portal authentication
- `SENTRY_DSN` — Error tracking
- `REDIS_URL` — Cache/queue/sockets

**Store these in a secrets manager** (AWS Secrets Manager, Doppler, or Vault).

## Incident Response

### Database Down
1. Check hosting provider status page
2. Verify connection: `pnpm db:ping`
3. If corrupted: restore from latest backup
4. If hosting issue: failover to replica (if configured)

### Application Crash Loop
1. Check logs: `docker logs nabd-server --tail 100`
2. Check health: `curl localhost:3001/health`
3. Rollback deployment if recent deploy caused it
4. Check environment variables are set correctly

### Data Breach
1. Rotate all secrets immediately (ENCRYPTION_KEY, JWT secrets, API keys)
2. Invalidate all sessions (Clerk dashboard)
3. Review audit logs for unauthorized access
4. Notify affected users per GDPR/compliance requirements
5. Document timeline in incident report

## Monitoring Alerts

Set up alerts for:
- [ ] Database backup job failures
- [ ] Backup file size anomalies (sudden drop = incomplete backup)
- [ ] Database replication lag (if replicas configured)
- [ ] Disk space on backup storage
- [ ] Health check failures (`/health` endpoint)
