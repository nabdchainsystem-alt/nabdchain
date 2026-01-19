# Deploy NABD - Simple Step by Step Guide

## What You Need (All Free)
- **Vercel** → for your frontend (the website people see)
- **Render** → for your backend (the server) + database
- **Your Hostinger domain** → just for the name

---

## STEP 1: Prepare Your Code

### 1.1 Create a GitHub account (if you don't have one)
Go to https://github.com and sign up

### 1.2 Push your code to GitHub
Open terminal in your project folder and run:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## STEP 2: Deploy Database (Render)

### 2.1 Create Render account
Go to https://render.com and sign up with GitHub

### 2.2 Create PostgreSQL Database
1. Click **"New"** → **"PostgreSQL"**
2. Name it: `nabd-database`
3. Region: Choose closest to you
4. Plan: Select **"Free"**
5. Click **"Create Database"**
6. Wait 2-3 minutes for it to create
7. **IMPORTANT**: Copy the **"External Database URL"** - you need this later!
   - It looks like: `postgresql://user:password@host/dbname`

---

## STEP 3: Deploy Backend (Render)

### 3.1 Create Web Service
1. In Render, click **"New"** → **"Web Service"**
2. Connect your GitHub repository (nabd)
3. Fill in these settings:

| Setting | Value |
|---------|-------|
| Name | `nabd-backend` |
| Root Directory | `server` |
| Runtime | `Node` |
| Build Command | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| Start Command | `npm start` |
| Plan | **Free** |

### 3.2 Add Environment Variables
Click **"Environment"** and add these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste the PostgreSQL URL from Step 2.2) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://your-domain.com` (your Hostinger domain) |
| `FRONTEND_URL` | `https://your-domain.com` (same as above) |
| `CLERK_SECRET_KEY` | (get from Clerk dashboard - see Step 5) |
| `ENCRYPTION_KEY` | (generate with: `openssl rand -hex 32`) |

4. Click **"Create Web Service"**
5. Wait 5-10 minutes for it to deploy
6. **Copy your backend URL** - it looks like: `https://nabd-backend.onrender.com`

---

## STEP 4: Deploy Frontend (Vercel)

### 4.1 Create Vercel account
Go to https://vercel.com and sign up with GitHub

### 4.2 Import your project
1. Click **"Add New"** → **"Project"**
2. Find and select your `nabd` repository
3. Fill in these settings:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Root Directory | `.` (leave empty, it's the main folder) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 4.3 Add Environment Variables
Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | (your backend URL from Step 3, like `https://nabd-backend.onrender.com`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | (get from Clerk dashboard - see Step 5) |

4. Click **"Deploy"**
5. Wait 2-3 minutes

---

## STEP 5: Setup Clerk Authentication

### 5.1 Go to Clerk Dashboard
Go to https://dashboard.clerk.com

### 5.2 Get your keys
1. Select your application (or create one)
2. Go to **"API Keys"**
3. Copy:
   - **Publishable Key** → use in Vercel (VITE_CLERK_PUBLISHABLE_KEY)
   - **Secret Key** → use in Render backend (CLERK_SECRET_KEY)

### 5.3 Add your domains to Clerk
1. Go to **"Domains"** in Clerk dashboard
2. Add your production domain: `your-domain.com`
3. Add your Vercel URL: `nabd-xxx.vercel.app`
4. Add your Render URL: `nabd-backend.onrender.com`

---

## STEP 6: Connect Your Hostinger Domain

### 6.1 Get Vercel's DNS settings
1. In Vercel, go to your project → **"Settings"** → **"Domains"**
2. Click **"Add"** and type your domain (e.g., `nabd.com`)
3. Vercel will show you what DNS records to add

### 6.2 Update DNS in Hostinger
1. Log in to Hostinger
2. Go to **"Domains"** → Select your domain → **"DNS / Nameservers"**
3. Add these records:

**For root domain (nabd.com):**
| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |

**For www (www.nabd.com):**
| Type | Name | Value |
|------|------|-------|
| CNAME | www | `cname.vercel-dns.com` |

4. Save and wait 5-30 minutes for DNS to update

---

## STEP 7: Final Checks

### 7.1 Update Backend CORS
Go back to Render → your backend → Environment Variables
Update `CORS_ORIGIN` to your actual domain: `https://nabd.com`

### 7.2 Redeploy
In Render, click **"Manual Deploy"** → **"Deploy latest commit"**

---

## You're Done! 🎉

Your app should now be live at:
- `https://your-domain.com` (your Hostinger domain)
- `https://nabd-xxx.vercel.app` (Vercel backup URL)

---

## Important Limitations (Free Tier)

### File Uploads
**WARNING:** File uploads (like images in boards/vault) will NOT persist on Render free tier!
- Render's filesystem is "ephemeral" - files are deleted when server restarts
- For 20 test users, this may be acceptable
- For production, you'll need cloud storage (AWS S3, Cloudinary, etc.)

### Email Integration
- Google/Outlook OAuth requires configuring redirect URLs
- Add these environment variables if you want email features:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`
- Update redirect URLs in Google Cloud Console and Azure Portal

---

## Troubleshooting

### "Page not found" or blank page
- Wait 30 minutes for DNS to propagate
- Check Vercel deployment logs

### "Cannot connect to server" errors
- Check Render logs for backend errors
- Make sure DATABASE_URL is correct
- Make sure CORS_ORIGIN matches your frontend domain

### Auth not working
- Check Clerk keys are correct
- Make sure domain is added in Clerk dashboard

### Backend is slow (10-30 seconds first load)
- This is normal on free Render plan - it "sleeps" after 15 minutes of no activity
- First request after sleep takes time to "wake up"

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth/month (plenty for 20 users) |
| Render Backend | Sleeps after 15 min inactivity, 750 hours/month |
| Render Database | 1GB storage, expires after 90 days (then recreate) |

For 20 test users, these limits are more than enough!
