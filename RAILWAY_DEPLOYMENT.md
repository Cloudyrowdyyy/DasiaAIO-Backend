# Railway Deployment Guide

## Overview
This project is configured to deploy both frontend and backend to Railway:
- **Frontend**: React/Vite (Node.js)
- **Backend**: Rust (Axum)
- **Database**: PostgreSQL

## Prerequisites
1. Railway account (created via GitHub)
2. GitHub repository with this project
3. Basic knowledge of Railway dashboard

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### 3. Add Services to Railway

#### Option A: Using railroad CLI (Recommended - not available yet)
Soon you can use: `railroad up`

#### Option B: Manual Setup via Dashboard

**PostgreSQL Service:**
1. Click "Add Service" in Railway
2. Select "PostgreSQL"
3. Auto-generates DATABASE_URL

**Backend Service:**
1. Click "Add Service" → "GitHub repo"
2. Select your repo
3. Configure:
   - **Root Directory**: `backend-rust`
   - **Service Name**: `backend`
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: `/app/server`
   - **Port**: 5000

**Environment Variables for Backend:**
```
SERVER_HOST=0.0.0.0
SERVER_PORT=$PORT
ADMIN_CODE=122601
RUST_LOG=info
DATABASE_URL=<copied from PostgreSQL service>
```

**Frontend Service:**
1. Click "Add Service" → "GitHub repo"
2. Select your repo
3. Configure:
   - **Root Directory**: `.` (root)
   - **Service Name**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s app-dist -l $PORT`
   - **Port**: 3000

**Environment Variables for Frontend:**
```
VITE_API_URL=https://<your-backend-url>/api
```
Get your backend URL from the Backend service details in Railway.

### 4. Deploy
railway will auto-deploy when you push to GitHub. Monitor deployment in Railway dashboard.

## Environment Variables Reference

### Backend (Rust)
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Railway)
- `SERVER_HOST`: 0.0.0.0
- `SERVER_PORT`: $PORT (Railway sets this)
- `ADMIN_CODE`: 122601
- `RUST_LOG`: info

### Frontend (React)
- `VITE_API_URL`: Backend API URL (set to backend service URL + /api)

## Troubleshooting

### Frontend can't reach backend
- Check `VITE_API_URL` environment variable is set correctly
- Ensure backend is running and listening on $PORT
- Check CORS settings in backend (should accept requests from frontend domain)

### Build failures
- Check logs in Railway dashboard
- Ensure `package.json` has all dependencies
- Verify Node version compatibility (using Node 20)

### Database connection issues
- Verify `DATABASE_URL` is correctly set
- Ensure PostgreSQL service is healthy
- Check backend can reach database from logs

## Testing Deployment

1. Visit your frontend URL (provided by Railway)
2. Try logging in
3. Check browser console for API errors
4. Check Railway logs for backend errors

## Custom Domain (Optional)

1. In Railway dashboard, goto Frontend service
2. Click "Domains"
3. Add your custom domain and configure DNS

## Next Steps

- Set up continuous monitoring
- Configure backup strategies for database
- Set environment-specific secrets
- Monitor costs on Railway dashboard
