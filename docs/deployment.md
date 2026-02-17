---
layout: default
title: Deployment
---

# Deployment Guide

## Railway Deployment (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository

### Step 3: Add Services

**PostgreSQL**
- Add Database → PostgreSQL
- Auto-generates `DATABASE_URL`

**Backend**
- Add Service → GitHub repo
- Root Directory: `backend-rust`
- Set environment variables:
  - `SERVER_HOST=0.0.0.0`
  - `SERVER_PORT=$PORT`
  - `ADMIN_CODE=122601`

**Frontend**
- Add Service → GitHub repo
- Root Directory: `.`
- Build: `npm install && npm run build`
- Start: `npx serve -s app-dist -l $PORT`
- Environment: `VITE_API_URL=https://your-backend-url/api`

### Step 4: Deploy
- Railway auto-deploys on GitHub push
- Monitor in Deployments tab

---

## Local Docker Deployment

### Build Docker Images
```bash
# Frontend
docker build -t dasia-frontend .
docker run -p 3000:3000 dasia-frontend

# Backend
cd backend-rust
docker build -t dasia-backend .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  dasia-backend
```

---

## Environment Variables

### Frontend
```
VITE_API_URL=https://your-backend-url/api
```

### Backend
```
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
ADMIN_CODE=122601
```

---

## Troubleshooting

### Build Timeout
- Rust compilation can take 5-10 minutes
- First build is slower; subsequent builds faster

### Frontend can't reach backend
- Check `VITE_API_URL` matches backend URL + `/api`
- Verify backend is healthy

### Database connection fails
- Ensure `DATABASE_URL` is set correctly
- Verify PostgreSQL service is healthy

---

[← Back to Home](/)
