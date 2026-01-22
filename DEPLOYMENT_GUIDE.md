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

---

# Implementation Guides

## 1. Cloudflare R2 - File Storage

Cloudflare R2 provides S3-compatible object storage with **zero egress fees** - meaning you don't pay when users download files.

### Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **R2** in the sidebar
3. Click **Create bucket**
4. Name it `nabd-files` (or your preferred name)
5. Select your preferred location (Auto is fine)
6. Click **Create bucket**

### Step 2: Create API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Give it a name like `nabd-server`
4. Permissions: **Object Read & Write**
5. Specify bucket: `nabd-files`
6. Click **Create API Token**
7. **SAVE THESE VALUES** (shown only once):
   - Access Key ID
   - Secret Access Key
8. Also note your **Account ID** from the R2 dashboard URL

### Step 3: Install Dependencies

```bash
cd server
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 4: Add Environment Variables

Add to your `.env` file and Render/Railway:

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET_NAME=nabd-files
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

### Step 5: Create Storage Service

Create `server/src/services/storageService.ts`:

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export const storageService = {
  /**
   * Upload a file to R2
   * @param key - The file path/name in the bucket (e.g., "users/123/avatar.jpg")
   * @param body - The file buffer or stream
   * @param contentType - MIME type (e.g., "image/jpeg")
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
  ): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    return {
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`,
    };
  },

  /**
   * Get a signed URL for temporary access (1 hour default)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  },

  /**
   * Get a signed URL for uploading (client-side upload)
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  },

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  },

  /**
   * List files in a directory
   */
  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);
    return response.Contents?.map((item) => item.Key!) || [];
  },

  /**
   * Generate a unique file key
   */
  generateKey(userId: string, filename: string, folder = 'uploads'): string {
    const timestamp = Date.now();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${userId}/${timestamp}-${sanitizedName}`;
  },
};
```

### Step 6: Create Upload Route

Create `server/src/routes/upload.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get presigned URL for client-side upload
router.post('/presigned-url', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filename, contentType, folder = 'uploads' } = req.body;
    const userId = req.auth!.userId;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType required' });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    const key = storageService.generateKey(userId, filename, folder);
    const uploadUrl = await storageService.getUploadUrl(key, contentType);

    res.json({
      uploadUrl,
      key,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Get signed URL for viewing private files
router.get('/signed-url/:key(*)', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const url = await storageService.getSignedUrl(key);
    res.json({ url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Delete a file
router.delete('/:key(*)', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const userId = req.auth!.userId;

    // Security: Only allow deleting own files
    if (!key.includes(`/${userId}/`)) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    await storageService.deleteFile(key);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
```

### Step 7: Register Route in Server

Update `server/src/index.ts`:

```typescript
import uploadRoutes from './routes/upload';

// Add after other routes
app.use('/api/upload', uploadRoutes);
```

### Step 8: Frontend Upload Service

Create `src/services/uploadService.ts`:

```typescript
import { API_URL } from '../config/api';

export const uploadService = {
  /**
   * Upload a file using presigned URL (recommended for large files)
   */
  async uploadFile(
    token: string,
    file: File,
    folder = 'uploads',
    onProgress?: (percent: number) => void
  ): Promise<{ key: string; url: string }> {
    // 1. Get presigned URL from server
    const response = await fetch(`${API_URL}/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        folder,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, key, publicUrl } = await response.json();

    // 2. Upload directly to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    return { key, url: publicUrl };
  },

  /**
   * Delete a file
   */
  async deleteFile(token: string, key: string): Promise<void> {
    const response = await fetch(`${API_URL}/upload/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  },

  /**
   * Get a signed URL for private file access
   */
  async getSignedUrl(token: string, key: string): Promise<string> {
    const response = await fetch(`${API_URL}/upload/signed-url/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get file URL');
    }

    const { url } = await response.json();
    return url;
  },
};
```

### Step 9: Example Usage in React Component

```tsx
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { uploadService } from '../services/uploadService';

function FileUploader() {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = await getToken();
      const { url } = await uploadService.uploadFile(token!, file, 'vault');
      setUploadedUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && <img src={uploadedUrl} alt="Uploaded" />}
    </div>
  );
}
```

### Optional: Enable Public Access for Bucket

If you want files to be publicly accessible without signed URLs:

1. In Cloudflare Dashboard → R2 → Your bucket
2. Click **Settings**
3. Under **Public access**, enable **Allow Access**
4. You'll get a public URL like `https://pub-xxx.r2.dev`

---

## 2. Upstash Redis - Caching

Upstash provides serverless Redis with a generous free tier (10K commands/day). Perfect for:
- Caching expensive database queries
- Rate limiting
- Session storage
- Real-time features

### Step 1: Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up with GitHub or email
3. Click **Create Database**
4. Choose **Regional** (lower latency)
5. Select region closest to your server (e.g., US-East-1 if on Render US)
6. Name it `nabd-cache`
7. Click **Create**

### Step 2: Get Credentials

1. Click on your database
2. Copy the **REST URL** and **REST Token** (under REST API section)
3. These look like:
   - URL: `https://xxx.upstash.io`
   - Token: `AXxxxxxxxxxxxx`

### Step 3: Install Dependencies

```bash
cd server
pnpm add @upstash/redis
```

### Step 4: Add Environment Variables

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx
```

### Step 5: Create Cache Service

Create `server/src/services/cacheService.ts`:

```typescript
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Default cache TTL (5 minutes)
const DEFAULT_TTL = 300;

export const cacheService = {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set a cached value with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * Delete a cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  },

  /**
   * Get or set - returns cached value or fetches and caches
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = DEFAULT_TTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  /**
   * Increment a counter (useful for rate limiting)
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const count = await redis.incr(key);
      if (ttlSeconds && count === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  },

  /**
   * Check rate limit
   * Returns true if within limit, false if exceeded
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `ratelimit:${identifier}`;
    const count = await this.increment(key, windowSeconds);
    const ttl = await redis.ttl(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    };
  },
};

// Cache key generators for consistency
export const cacheKeys = {
  userBoards: (userId: string) => `boards:user:${userId}`,
  board: (boardId: string) => `board:${boardId}`,
  boardRooms: (boardId: string) => `rooms:board:${boardId}`,
  userWorkspaces: (userId: string) => `workspaces:user:${userId}`,
  vaultItems: (userId: string) => `vault:user:${userId}`,
};
```

### Step 6: Usage in Routes

Example: Caching boards in `server/src/routes/boards.ts`:

```typescript
import { cacheService, cacheKeys } from '../services/cacheService';

// GET /api/boards - with caching
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const workspaceId = req.query.workspaceId as string;

    const cacheKey = cacheKeys.userBoards(userId);

    // Try cache first, otherwise fetch from DB
    const boards = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return prisma.board.findMany({
          where: { workspaceId, userId },
          orderBy: { createdAt: 'desc' },
        });
      },
      300 // Cache for 5 minutes
    );

    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// POST /api/boards - invalidate cache on create
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth!.userId;

    const board = await prisma.board.create({
      data: { ...req.body, userId },
    });

    // Invalidate user's boards cache
    await cacheService.delete(cacheKeys.userBoards(userId));

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// DELETE /api/boards/:id - invalidate cache on delete
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const { id } = req.params;

    await prisma.board.delete({ where: { id } });

    // Invalidate caches
    await cacheService.delete(cacheKeys.userBoards(userId));
    await cacheService.delete(cacheKeys.board(id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete board' });
  }
});
```

### Step 7: Rate Limiting Middleware

Create `server/src/middleware/rateLimit.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { AuthRequest } from './auth';

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyGenerator?: (req: Request) => string;
}

export const rateLimit = (options: RateLimitOptions) => {
  const { limit, windowSeconds, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on IP or user
    const identifier = keyGenerator
      ? keyGenerator(req)
      : (req as AuthRequest).auth?.userId || req.ip || 'anonymous';

    const { allowed, remaining, resetIn } = await cacheService.checkRateLimit(
      identifier,
      limit,
      windowSeconds
    );

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + resetIn);

    if (!allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: resetIn,
      });
    }

    next();
  };
};

// Pre-configured rate limiters
export const rateLimiters = {
  // General API: 100 requests per minute
  api: rateLimit({ limit: 100, windowSeconds: 60 }),

  // AI endpoints: 10 requests per minute
  ai: rateLimit({ limit: 10, windowSeconds: 60 }),

  // Auth endpoints: 5 requests per minute
  auth: rateLimit({ limit: 5, windowSeconds: 60 }),

  // Upload endpoints: 20 requests per minute
  upload: rateLimit({ limit: 20, windowSeconds: 60 }),
};
```

### Step 8: Apply Rate Limiting

In `server/src/index.ts`:

```typescript
import { rateLimiters } from './middleware/rateLimit';

// Apply to all API routes
app.use('/api', rateLimiters.api);

// Apply stricter limits to specific routes
app.use('/api/ai', rateLimiters.ai);
app.use('/api/upload', rateLimiters.upload);
```

---

## 3. Resend - Email Notifications

Resend provides a modern email API with 3,000 free emails/month. Perfect for:
- Welcome emails
- Password reset
- Notifications
- Digests

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with GitHub or email
3. Verify your email

### Step 2: Add Domain (Optional but Recommended)

1. Go to **Domains** → **Add Domain**
2. Enter your domain (e.g., `nabd.app`)
3. Add the DNS records shown to your domain registrar
4. Wait for verification (usually 5-30 minutes)

**Without a custom domain**: You can still send emails from `onboarding@resend.dev` for testing.

### Step 3: Get API Key

1. Go to **API Keys**
2. Click **Create API Key**
3. Name it `nabd-server`
4. Select permissions: **Sending access** → **Full access** (or specific domain)
5. Copy the API key (starts with `re_`)

### Step 4: Install Dependencies

```bash
cd server
pnpm add resend
```

### Step 5: Add Environment Variables

```env
# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=NABD <notifications@yourdomain.com>
# Or for testing without custom domain:
# EMAIL_FROM=NABD <onboarding@resend.dev>
```

### Step 6: Create Email Service

Create `server/src/services/emailService.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'NABD <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export const emailService = {
  /**
   * Send an email
   */
  async send(options: SendEmailOptions): Promise<{ id: string } | null> {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      });

      if (error) {
        console.error('Email send error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      return null;
    }
  },

  /**
   * Send welcome email
   */
  async sendWelcome(to: string, userName: string): Promise<boolean> {
    const result = await this.send({
      to,
      subject: 'Welcome to NABD! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to NABD!</h1>
            </div>
            <p>Hi ${userName},</p>
            <p>Thanks for joining NABD! We're excited to have you on board.</p>
            <p>With NABD, you can:</p>
            <ul>
              <li>Manage projects with customizable boards</li>
              <li>Track your supply chain operations</li>
              <li>Collaborate with your team in real-time</li>
              <li>Store and organize documents in the Vault</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://nabd.app'}" class="button">
                Get Started
              </a>
            </p>
            <p>If you have any questions, just reply to this email!</p>
            <p>Best,<br>The NABD Team</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} NABD. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to NABD!\n\nHi ${userName},\n\nThanks for joining! Get started at ${process.env.FRONTEND_URL || 'https://nabd.app'}\n\nBest,\nThe NABD Team`,
    });

    return result !== null;
  },

  /**
   * Send task notification
   */
  async sendTaskNotification(
    to: string,
    taskTitle: string,
    boardName: string,
    action: 'assigned' | 'completed' | 'due_soon'
  ): Promise<boolean> {
    const subjects = {
      assigned: `You've been assigned: ${taskTitle}`,
      completed: `Task completed: ${taskTitle}`,
      due_soon: `Due soon: ${taskTitle}`,
    };

    const messages = {
      assigned: 'A task has been assigned to you',
      completed: 'A task you were following has been completed',
      due_soon: 'A task is due soon and needs your attention',
    };

    const result = await this.send({
      to,
      subject: subjects[action],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .task-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .task-title { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
            .task-board { color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <p>${messages[action]}:</p>
            <div class="task-card">
              <p class="task-title">${taskTitle}</p>
              <p class="task-board">Board: ${boardName}</p>
            </div>
            <p>
              <a href="${process.env.FRONTEND_URL || 'https://nabd.app'}" class="button">
                View Task
              </a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return result !== null;
  },

  /**
   * Send weekly digest
   */
  async sendWeeklyDigest(
    to: string,
    userName: string,
    stats: {
      tasksCompleted: number;
      tasksCreated: number;
      boardsActive: number;
    }
  ): Promise<boolean> {
    const result = await this.send({
      to,
      subject: `Your NABD Weekly Summary`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat { text-align: center; }
            .stat-number { font-size: 32px; font-weight: 700; color: #4F46E5; }
            .stat-label { font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Your Week in Review</h2>
            <p>Hi ${userName}, here's what you accomplished this week:</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${stats.tasksCompleted}</div>
                <div class="stat-label">Tasks Completed</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.tasksCreated}</div>
                <div class="stat-label">Tasks Created</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.boardsActive}</div>
                <div class="stat-label">Active Boards</div>
              </div>
            </div>
            <p>Keep up the great work! 💪</p>
          </div>
        </body>
        </html>
      `,
    });

    return result !== null;
  },
};
```

### Step 7: Create Email Routes

Create `server/src/routes/email.ts`:

```typescript
import { Router, Response } from 'express';
import { emailService } from '../services/emailService';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// Send test email (for development)
router.post('/test', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const result = await emailService.send({
      to,
      subject: 'NABD Test Email',
      html: '<h1>Test Email</h1><p>If you received this, email is working!</p>',
    });

    if (result) {
      res.json({ success: true, id: result.id });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Email service error' });
  }
});

// Invite team member
router.post('/invite', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { email, workspaceName, inviterName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const result = await emailService.send({
      to: email,
      subject: `${inviterName} invited you to ${workspaceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>You're invited!</h2>
          <p>${inviterName} has invited you to join <strong>${workspaceName}</strong> on NABD.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://nabd.app'}/invite"
               style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">
              Accept Invitation
            </a>
          </p>
        </div>
      `,
    });

    res.json({ success: result !== null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

export default router;
```

### Step 8: Register Route

Update `server/src/index.ts`:

```typescript
import emailRoutes from './routes/email';

app.use('/api/email', emailRoutes);
```

### Step 9: Trigger Emails on Events

Example: Send welcome email when user signs up (in a webhook handler):

```typescript
// In your Clerk webhook handler or user creation logic
import { emailService } from '../services/emailService';

// When a new user is created
const handleUserCreated = async (user: { email: string; firstName: string }) => {
  await emailService.sendWelcome(user.email, user.firstName || 'there');
};

// When a task is assigned
const handleTaskAssigned = async (
  assigneeEmail: string,
  taskTitle: string,
  boardName: string
) => {
  await emailService.sendTaskNotification(
    assigneeEmail,
    taskTitle,
    boardName,
    'assigned'
  );
};
```

---

## Environment Variables Summary

Add all these to your `.env` file and deployment platform:

```env
# === EXISTING ===
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production

# === NEW: Cloudflare R2 ===
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=nabd-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# === NEW: Upstash Redis ===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx

# === NEW: Resend Email ===
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=NABD <notifications@yourdomain.com>
FRONTEND_URL=https://your-app.vercel.app
```

---

## Checklist

After implementation, verify:

- [ ] **R2**: Upload a test file and verify it's accessible
- [ ] **Redis**: Check Upstash dashboard for commands being logged
- [ ] **Resend**: Send a test email and check it arrives
- [ ] **Rate Limiting**: Test that 429 errors occur after limit exceeded
- [ ] **Environment Variables**: All set in Render/Vercel

---

## Useful Links

- [Neon PostgreSQL](https://neon.tech) - Serverless Postgres
- [Railway](https://railway.app) - Backend hosting
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2) - Object storage
- [Upstash Docs](https://docs.upstash.com/redis) - Serverless Redis
- [Resend Docs](https://resend.com/docs) - Email API

---

*Last updated: January 2025*
