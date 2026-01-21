# NABD Chain System - Deployment & Scaling Guide

## Current Stack Analysis

### What You Have Now
| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | React 19 + Vite + TypeScript | Vercel |
| Backend | Express 5 + Node.js | Render |
| Database | PostgreSQL (Prisma ORM) | Neon (free) |
| Auth | Clerk | Configured |
| AI | Google Gemini | Configured |
| File Storage | None | **Needed for growth** |

### Checklist
- [ ] `VITE_API_URL` set in Vercel to your Render URL
- [ ] `CORS_ORIGIN` in Render set to your Vercel domain
- [ ] Database `DATABASE_URL` configured in Render

---

## How SaaS Companies Offer Free Tiers

### The Business Model
Companies like Notion, Linear, Monday.com offer free tiers because:

1. **Freemium Conversion**: 2-5% of free users convert to paid
2. **Viral Growth**: Free users invite others (network effect)
3. **Usage-Based Limits**: Free tier has caps that push growth
4. **Shared Infrastructure**: 1000 free users cost same as 100 on shared resources

### Common Free Tier Limits
| Resource | Typical Free Limit | Your Recommendation |
|----------|-------------------|---------------------|
| Users | 1-5 per workspace | 3 users |
| Storage | 5-10 GB | 1 GB |
| AI Calls | 50-100/month | 50/month |
| Boards | 3-10 | 5 boards |
| File Upload | 5-25 MB per file | 10 MB |
| API Requests | 1000-10000/day | 5000/day |

### How They Keep Costs Low
1. **Aggressive Caching** - Redis/CDN for repeated data
2. **Lazy Loading** - Only load what users see
3. **Shared Databases** - Multi-tenant architecture
4. **Serverless** - Pay only when code runs
5. **Tiered Storage** - Hot/cold data separation

---

## Recommended Services (Free Tiers)

### Frontend Hosting

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Vercel** | 100GB bandwidth, Unlimited sites | React/Next.js | **Current - Keep it** |
| Netlify | 100GB bandwidth, 300 build min | Static sites | Alternative |
| Cloudflare Pages | Unlimited bandwidth | Global CDN | Best performance |

**Verdict**: Stay with **Vercel** - excellent for React, great DX.

### Backend Hosting

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Railway** | $5 credit/month, auto-sleep | Node.js APIs | **Best choice** |
| **Render** | 750 hours/month, auto-sleep | Simple APIs | Good alternative |
| Fly.io | 3 shared VMs, 160GB transfer | Global edge | More complex |
| Vercel Functions | 100GB-hours | Serverless only | If you convert to serverless |

**Verdict**: Use **Railway** - easiest for Express + Prisma, good free tier.

### Database

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Neon** | 0.5 GB storage, auto-suspend | PostgreSQL | **Best choice** |
| **Supabase** | 500 MB, 2 projects | PostgreSQL + Auth | Great all-in-one |
| PlanetScale | 5 GB storage (MySQL) | MySQL only | If you switch to MySQL |
| Railway | Included in $5 | PostgreSQL | Bundled option |

**Verdict**: Use **Neon** - serverless PostgreSQL, scales to zero, generous free tier.

### File Storage

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Cloudflare R2** | 10 GB + 1M requests | S3-compatible | **Best choice** (no egress fees) |
| **Supabase Storage** | 1 GB | Integrated with Supabase | If using Supabase |
| AWS S3 | 5 GB (12 months) | Enterprise | Expensive long-term |
| Uploadthing | 2 GB | Easy integration | Quick setup |

**Verdict**: Use **Cloudflare R2** - no egress fees ever, S3-compatible.

### AI / LLM

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Google Gemini** | 60 requests/min | General AI | **Current - Keep it** |
| **Groq** | Free tier, very fast | Speed | Best for real-time |
| OpenAI | $5 credit (new accounts) | GPT-4 quality | Most capable |
| Anthropic Claude | API access | Code/reasoning | Best for code |

**Verdict**: Keep **Gemini** for free tier, add **Groq** for speed-critical features.

### Authentication

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Clerk** | 10,000 MAU | Full-featured | **Current - Keep it** |
| Supabase Auth | Unlimited | Bundled with DB | If using Supabase |
| Auth0 | 7,500 MAU | Enterprise | More complex |

**Verdict**: Keep **Clerk** - excellent free tier, great DX.

### Email

| Service | Free Tier | Best For | Recommendation |
|---------|-----------|----------|----------------|
| **Resend** | 3,000 emails/month | Transactional | **Best choice** |
| Postmark | 100 emails/month | Reliability | Very limited |
| SendGrid | 100 emails/day | Marketing | Good alternative |

---

## Recommended Stack for NABD

## Scaling Path: From Free to Enterprise

### Stage 1: Free Tier (0-100 users) - $0/month
```
Frontend:     Vercel (free)           → Keep
Backend:      Render (free)           → Keep
Database:     Neon (free 0.5GB)       → Keep
Storage:      Cloudflare R2 (10GB)    → Add this
Auth:         Clerk (10K MAU)         → Keep
AI:           Google Gemini (free)    → Keep
Email:        Resend (3K/month)       → Add this

Total: $0/month
```

### Stage 2: Early Growth (100-500 users) - $50-100/month
```
Frontend:     Vercel (free)           → Still free
Backend:      Render Starter ($7)     → Upgrade (no sleep)
Database:     Neon Launch ($19)       → Upgrade (more storage)
Storage:      Cloudflare R2 (~$5)     → Pay as you grow
Auth:         Clerk (free)            → Still free under 10K
AI:           Gemini (free)           → Still free
Email:        Resend ($20)            → Upgrade for more sends
Cache:        Upstash Redis (free)    → Add this

Total: ~$50-70/month
```

### Stage 3: Growth (500-2000 users) - $150-300/month
```
Frontend:     Vercel Pro ($20)        → Upgrade (analytics, more bandwidth)
Backend:      Render Standard ($25)   → Upgrade (more RAM, always on)
Database:     Neon Scale ($69)        → Upgrade (autoscaling, more compute)
Storage:      Cloudflare R2 (~$15)    → Scales automatically
Auth:         Clerk Pro ($25)         → Upgrade (custom branding)
AI:           Gemini + Groq (~$30)    → Add Groq for speed
Email:        Resend Pro ($40)        → Upgrade
Cache:        Upstash Pro ($10)       → Upgrade

Total: ~$250/month
```

### Stage 4: Scale (2000-10000 users) - $500-1500/month
```
Frontend:     Vercel Pro ($20)        → Keep (or Cloudflare Pages)
Backend:      Render Pro ($85) or     → OR migrate to:
              AWS ECS (~$100-200)     → Better for high traffic
Database:     Neon Business ($300) or → OR migrate to:
              AWS RDS (~$150-300)     → More control
Storage:      Cloudflare R2 (~$50)    → Scales beautifully
Auth:         Clerk Business (~$100)  → Volume pricing
AI:           OpenRouter (~$100-300)  → Route to cheapest provider
Email:        Resend Scale ($100)     → Or AWS SES ($0.10/1K)
Cache:        Upstash Pay-as-go       → Or Redis Cloud
Queue:        Upstash QStash ($20)    → Add for background jobs

Total: ~$800-1500/month
```

### Stage 5: Enterprise (10000+ users) - $2000+/month
```
Frontend:     Self-host on AWS/GCP or Vercel Enterprise
Backend:      AWS ECS/EKS or GCP Cloud Run (auto-scaling)
Database:     AWS RDS or GCP Cloud SQL (multi-region)
Storage:      Cloudflare R2 or AWS S3
Auth:         Clerk Enterprise or build custom with Auth0
AI:           Self-host open models + API fallback
Email:        AWS SES (cheapest at scale)
Cache:        AWS ElastiCache or Redis Cloud
Queue:        AWS SQS or BullMQ
CDN:          Cloudflare Enterprise

Total: $2000-10000/month (depends on usage)
```

---

## When to Migrate Services

| Trigger | Action |
|---------|--------|
| Render free tier sleeping causes issues | Upgrade to Render Starter ($7) |
| Database >500MB | Upgrade Neon or move to Supabase |
| >10K monthly active users | Upgrade Clerk |
| Need file uploads | Add Cloudflare R2 |
| API response slow | Add Upstash Redis cache |
| >50 AI calls/user/month | Add usage limits or upgrade |
| Need background jobs | Add Upstash QStash or BullMQ |
| Global users, slow load | Add Cloudflare CDN |
| >$500/month on Render | Consider AWS/GCP migration |

---

## Service Comparison by Category

### Backend Hosting - Best Options

| Service | Free Tier | Paid Starting | Best For | Migrate When |
|---------|-----------|---------------|----------|--------------|
| **Render** | 750 hrs/mo (sleeps) | $7/mo | Current setup | >$85/mo → AWS |
| Railway | $5 credit/mo | $5/mo | Fast deploys | Similar to Render |
| Fly.io | 3 VMs | $2/mo | Global edge | Need low latency worldwide |
| AWS ECS | None | ~$30/mo | High scale | >2000 users |
| GCP Cloud Run | 2M req/mo | Pay-per-use | Serverless | Variable traffic |
| **Recommendation** | Render → AWS ECS at scale |

### Database - Best Options

| Service | Free Tier | Paid Starting | Best For | Migrate When |
|---------|-----------|---------------|----------|--------------|
| **Neon** | 0.5 GB, auto-suspend | $19/mo | Serverless Postgres | Best for most |
| Supabase | 500 MB, 2 projects | $25/mo | Postgres + extras | Want built-in auth/storage |
| PlanetScale | 5 GB (MySQL) | $29/mo | MySQL needed | MySQL-only apps |
| AWS RDS | None | ~$15/mo | Full control | Enterprise needs |
| **Recommendation** | Neon (best free) → Supabase (if want all-in-one) → AWS RDS (enterprise) |

### File Storage - Best Options

| Service | Free Tier | Pricing | Best For | Why |
|---------|-----------|---------|----------|-----|
| **Cloudflare R2** | 10 GB + 1M ops | $0.015/GB | **Best choice** | NO egress fees ever |
| Supabase Storage | 1 GB | $0.021/GB | Integrated | If using Supabase |
| AWS S3 | 5 GB (12 mo) | $0.023/GB + egress | Enterprise | Most features |
| Uploadthing | 2 GB | $10/mo | Quick setup | Easiest integration |
| **Recommendation** | Cloudflare R2 (no egress fees = huge savings at scale) |

### AI/LLM - Best Options

| Service | Free Tier | Cost per 1M tokens | Best For |
|---------|-----------|-------------------|----------|
| **Gemini** | 60 req/min | ~$0.25-1.00 | General use (current) |
| **Groq** | Free tier | ~$0.27 | Speed (very fast) |
| OpenAI GPT-4 | $5 credit | ~$30 | Best quality |
| Claude | API access | ~$15 | Code/reasoning |
| OpenRouter | Pay-per-use | Varies | Route to cheapest |
| **Recommendation** | Gemini (free) → Add Groq (speed) → OpenRouter (smart routing at scale) |

### Authentication - Best Options

| Service | Free Tier | Paid Starting | Best For |
|---------|-----------|---------------|----------|
| **Clerk** | 10K MAU | $25/mo | Best DX (current) |
| Supabase Auth | Unlimited | Included | If using Supabase |
| Auth0 | 7.5K MAU | $23/mo | Enterprise features |
| Firebase Auth | 50K MAU | Pay-per-use | Google ecosystem |
| **Recommendation** | Keep Clerk - excellent DX, generous free tier |

### Caching - Add When Slow

| Service | Free Tier | Paid Starting | Best For |
|---------|-----------|---------------|----------|
| **Upstash Redis** | 10K cmd/day | $0.2/100K cmd | Serverless Redis |
| Redis Cloud | 30 MB | $5/mo | Traditional Redis |
| Cloudflare KV | 100K reads/day | $5/mo | Edge caching |
| **Recommendation** | Upstash Redis (serverless, scales to zero) |

### Email - Add for Notifications

| Service | Free Tier | Paid Starting | Best For |
|---------|-----------|---------------|----------|
| **Resend** | 3K/month | $20/mo | Modern, great DX |
| SendGrid | 100/day | $20/mo | Marketing emails |
| AWS SES | None | $0.10/1K | Cheapest at scale |
| Postmark | 100/month | $15/mo | Deliverability |
| **Recommendation** | Resend (start) → AWS SES (>100K emails/mo) |

---

## Step-by-Step Deployment Guide

### Step 1: Deploy Database (Neon)

1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy the connection string
4. It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Step 2: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repo, set root directory to `/server`
4. Add environment variables:
   ```
   DATABASE_URL=your_neon_connection_string
   CLERK_SECRET_KEY=your_clerk_secret
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. Railway will auto-detect Node.js and deploy
6. Copy your Railway URL (e.g., `https://nabd-server.up.railway.app`)

### Step 3: Configure Frontend (Vercel)

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```
3. Redeploy

### Step 4: Setup File Storage (Cloudflare R2)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. R2 → Create bucket → Name it `nabd-files`
3. Create API token with R2 read/write permissions
4. Add to Railway environment:
   ```
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=nabd-files
   ```

---

## Implementing Usage Limits (Free Tier)

### Database Schema Addition
```prisma
model UsageQuota {
  id            String   @id @default(uuid())
  userId        String   @unique
  plan          String   @default("free") // free, pro, business

  // Limits
  storageUsedMB Int      @default(0)
  aiCallsUsed   Int      @default(0)
  boardsCreated Int      @default(0)

  // Reset period
  periodStart   DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### Plan Limits Configuration
```typescript
// src/config/plans.ts
export const PLAN_LIMITS = {
  free: {
    maxBoards: 5,
    maxStorageMB: 1024, // 1 GB
    maxAICallsPerMonth: 50,
    maxFileUploadMB: 10,
    maxUsersPerWorkspace: 3,
  },
  pro: {
    maxBoards: 50,
    maxStorageMB: 10240, // 10 GB
    maxAICallsPerMonth: 500,
    maxFileUploadMB: 100,
    maxUsersPerWorkspace: 20,
  },
  business: {
    maxBoards: -1, // unlimited
    maxStorageMB: 102400, // 100 GB
    maxAICallsPerMonth: 5000,
    maxFileUploadMB: 500,
    maxUsersPerWorkspace: -1,
  },
};
```

### Usage Check Middleware
```typescript
// server/src/middleware/usageLimit.ts
export const checkUsageLimit = (resource: 'boards' | 'storage' | 'ai') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const quota = await prisma.usageQuota.findUnique({
      where: { userId: req.auth.userId }
    });

    const limits = PLAN_LIMITS[quota?.plan || 'free'];

    if (resource === 'boards' && quota.boardsCreated >= limits.maxBoards) {
      return res.status(403).json({
        error: 'Board limit reached',
        upgrade: true
      });
    }

    next();
  };
};
```

---

## Cost Optimization Tips

### 1. Implement Caching
```typescript
// Use Upstash Redis (free 10K commands/day)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache expensive queries
const getCachedBoards = async (userId: string) => {
  const cached = await redis.get(`boards:${userId}`);
  if (cached) return cached;

  const boards = await prisma.board.findMany({ where: { userId } });
  await redis.set(`boards:${userId}`, boards, { ex: 300 }); // 5 min cache
  return boards;
};
```

### 2. Optimize Database Queries
```typescript
// Bad - N+1 queries
const boards = await prisma.board.findMany();
for (const board of boards) {
  board.tasks = await prisma.task.findMany({ where: { boardId: board.id } });
}

// Good - Single query with include
const boards = await prisma.board.findMany({
  include: { tasks: true }
});
```

### 3. Compress Images on Upload
```typescript
// Use Sharp for image compression
import sharp from 'sharp';

const compressImage = async (buffer: Buffer) => {
  return sharp(buffer)
    .resize(1920, 1080, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer();
};
```

### 4. Use CDN for Static Assets
- Cloudflare (free) in front of your app
- Cache API responses that don't change often

### 5. Serverless for Spiky Workloads
- Convert heavy endpoints to Vercel Functions
- Use Cloudflare Workers for edge processing

---

## Monitoring (Free Tools)

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| **Sentry** | Error tracking | 5K errors/month |
| **Uptime Robot** | Uptime monitoring | 50 monitors |
| **Plausible** | Privacy-friendly analytics | Self-host free |
| **Axiom** | Logs | 500GB ingest/month |

---

## Quick Start Commands

### Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in server directory
cd server
railway init

# Add environment variables
railway variables set DATABASE_URL="your_neon_url"
railway variables set CLERK_SECRET_KEY="your_key"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

### Run Database Migrations
```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

---

## Summary: Your Action Items

1. **Today**: Sign up for Neon (database) and Railway (backend)
2. **Deploy Backend**: Follow Step 2 above
3. **Update Vercel**: Add `VITE_API_URL` environment variable
4. **Test**: Verify Vault and all features work
5. **Later**: Add Cloudflare R2 for file storage
6. **Growth**: Implement usage limits when you have paying users

---

## Useful Links

- [Neon PostgreSQL](https://neon.tech) - Serverless Postgres
- [Railway](https://railway.app) - Backend hosting
- [Cloudflare R2](https://developers.cloudflare.com/r2) - Object storage
- [Upstash](https://upstash.com) - Serverless Redis
- [Resend](https://resend.com) - Email API

---

*Last updated: January 2025*
