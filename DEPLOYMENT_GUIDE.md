# NABD Chain System - Deployment & Scaling Guide

## Current Stack Analysis

### What You Have Now
| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | React 19 + Vite + TypeScript | Deployed on Vercel |
| Backend | Express 5 + Node.js | **Not deployed** (localhost:3001) |
| Database | PostgreSQL (Prisma ORM) | **Not deployed** |
| Auth | Clerk | Configured |
| AI | Google Gemini | Configured |
| File Storage | None | **Missing** |

### Critical Issue
Your Vault keeps loading because your backend is not deployed. The frontend tries to connect to `localhost:3001` which doesn't exist in production.

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

### Free Tier Stack (Starting Out)
```
Frontend:     Vercel (free)
Backend:      Railway ($5/month credit)
Database:     Neon PostgreSQL (free)
Storage:      Cloudflare R2 (free 10GB)
Auth:         Clerk (free 10K MAU)
AI:           Google Gemini (free)
Email:        Resend (free 3K/month)
Analytics:    Plausible/Umami (self-host free)

Estimated Cost: $0/month
```

### Growth Stack (100-1000 users)
```
Frontend:     Vercel Pro ($20/month)
Backend:      Railway Hobby ($5/month)
Database:     Neon Launch ($19/month)
Storage:      Cloudflare R2 ($0.015/GB)
Auth:         Clerk Pro ($25/month)
AI:           Gemini + Groq ($10-50/month)
Email:        Resend ($20/month)
CDN:          Cloudflare (free)

Estimated Cost: $100-150/month
```

### Scale Stack (1000+ users)
```
Frontend:     Vercel Enterprise or self-host
Backend:      Railway Team or AWS ECS
Database:     Neon Scale or AWS RDS
Storage:      Cloudflare R2
Auth:         Clerk Business
AI:           Custom routing (cheapest per request)
Cache:        Upstash Redis
Queue:        Upstash QStash

Estimated Cost: $500-2000/month
```

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
