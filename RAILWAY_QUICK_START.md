# Quick Railway Deployment Checklist

## Pre-Deployment (Do Once)

- [ ] Commit all changes to GitHub
  ```bash
  git add .
  git commit -m "Prepare for Railway deployment"
  git push origin main
  ```

- [ ] Verify you have a Railway account (linked to GitHub)

## Railway Dashboard Setup

### Step 1: Create New Project
- [ ] Go to railway.app
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Authorize and select your repository

### Step 2: Add PostgreSQL
- [ ] Click the "+" button → "Add Service"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Railway will auto-generate `DATABASE_URL` ✓

### Step 3: Add Backend Service
- [ ] Click "+" → "Add Service" 
- [ ] Select "GitHub repo" with your repository
- [ ] Fill in deployment config:
  ```
  Root Directory: backend-rust
  Start Command: /app/server
  Port: 5000
  ```
- [ ] Add environment variables:
  ```
  SERVER_HOST = 0.0.0.0
  ADMIN_CODE = 122601
  RUST_LOG = info
  DATABASE_URL = (auto-linked from PostgreSQL)
  ```
- [ ] Deploy (Railway should auto-detect Dockerfile)

### Step 4: Copy Backend URL
- [ ] Once backend is deployed, go to Backend service
- [ ] Find and copy the provided domain/URL (e.g., `https://example-production-1234.railway.app`)
- [ ] This will be needed for the frontend environment variable

### Step 5: Add Frontend Service
- [ ] Click "+" → "Add Service"
- [ ] Select "GitHub repo" with your repository
- [ ] Fill in deployment config:
  ```
  Root Directory: . (root of project)
  Build Command: npm install && npm run build
  Start Command: npx serve -s app-dist -l $PORT
  Port: 3000
  ```
- [ ] Add environment variables:
  ```
  VITE_API_URL = https://<your-backend-url>/api
  ```
  Replace `<your-backend-url>` with the backend domain from Step 4

## Post-Deployment

- [ ] Get frontend URL from Railway Dashboard
- [ ] Visit frontend URL in browser to verify it loads
- [ ] Try logging in to test API connectivity
- [ ] Check browser console for any errors (F12)
- [ ] Check Railway logs for backend errors

## Accessing Logs

To debug any issues:
1. Go to Railway Dashboard
2. Select the service (Backend or Frontend)
3. Click "Deployments" tab
4. Click latest deployment
5. View build and runtime logs

## Environment Variable Reference

| Service | Variable | Value | Purpose |
|---------|----------|-------|---------|
| Backend | SERVER_HOST | 0.0.0.0 | Listen on all interfaces |
| Backend | SERVER_PORT | $PORT | Use Railway's dynamic port |
| Backend | DATABASE_URL | (auto) | PostgreSQL connection |
| Backend | ADMIN_CODE | 122601 | Special admin code for registration |
| Frontend | VITE_API_URL | Backend URL + /api | Where to call API endpoints |

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Frontend shows 404 | Check VITE_API_URL matches backend domain |
| Login fails | Backend timestamp/CORS issue - check backend logs |
| Build timeout | Backend Rust compilation can be slow - wait up to 10 mins |
| Variable not working | Redeploy after changing environment variables |

## Next Few Steps

After successful deployment:
1. Test all features (login, create users, manage firearms, etc.)
2. Monitor Railway dashboard for costs
3. Set up error monitoring (optional)
4. Configure auto-scaling if needed (optional)

---

**Need Help?** Check Railway docs at railway.app/docs
