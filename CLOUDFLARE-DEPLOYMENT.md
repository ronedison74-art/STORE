# MERIT-STORE → Cloudflare Pages Deployment Guide

## ✅ Quick Setup (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. Go to: https://dash.cloudflare.com/pages
2. Click **"Create a project"** → **"Connect to Git"**
3. Select: `ronedison74-art/MERIT-STORE`
4. Click **Next**

### Step 3: Configure Build Settings

Fill in these values:

| Field | Value |
|-------|-------|
| **Build command** | `pnpm build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |

### Step 4: Add Environment Variables

Before deploying, click **"Add environment variable"**:

**Variable 1:**
- Name: `DATABASE_URL`
- Value: Your Neon PostgreSQL connection string
  - Get from: https://console.neon.tech → Your Project → Connection Details
  - Example: `postgresql://neondb_owner:password@ep-cool-db.us-east-1.neon.tech/neondb?sslmode=require`

**Variable 2:**
- Name: `ENVIRONMENT`
- Value: `production`

### Step 5: Deploy!

Click **"Save and Deploy"** button.

Wait 3-5 minutes for build to complete.

---

## 🌐 Your Live App

Once deployed, your app will be live at:
```
https://merit-store.pages.dev
```

You should see:
- ✅ Login page
- ✅ Admin dashboard
- ✅ Database connected

---

## 🔧 Update Settings in Cloudflare

If you need to change settings later:

1. Go to: https://dash.cloudflare.com/workers-and-pages
2. Click **merit-store**
3. Click **Settings** tab
4. Update under **Build & deployments** and **Environment variables**

---

## ⚠️ Important Notes

- ❌ Do NOT use `wrangler.toml` with Pages
- ✅ Use environment variables for secrets (DATABASE_URL)
- ✅ Leave deploy command empty (or use `true`)
- ✅ Build output directory MUST be `dist`

---

## 🚀 After Deployment

### Monitor Builds
- Go to **Deployments** tab to see build history
- Click **"View build"** to see logs

### Add Custom Domain
- Settings → Custom Domain
- Add your domain (if you have one)

### View Live Logs
- Go to **Observability** → **Logs**
- See real-time requests

---

## 🆘 Troubleshooting

### Issue: "Hello world" instead of your app
**Fix:** Delete `wrangler.toml` from GitHub

### Issue: Database connection fails
**Fix:** Make sure `DATABASE_URL` env var is set in Cloudflare Dashboard

### Issue: Build fails
**Fix:** Check build logs → Deployments → View build → Look for errors

### Issue: Deploy command error
**Fix:** Leave deploy command empty (don't set it to anything)

---

## 📚 Useful Links

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Neon PostgreSQL**: https://console.neon.tech
- **Your GitHub**: https://github.com/ronedison74-art/MERIT-STORE
- **Your Live App**: https://merit-store.pages.dev

---

## ✨ You're All Set!

Your MERIT-STORE is ready for Cloudflare Pages. Just follow the steps above and it will be live in minutes! 🚀
