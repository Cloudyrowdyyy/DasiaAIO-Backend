# Railway Deployment Configuration Summary

## What's Been Prepared ✓

Your project is now ready for deployment to Railway. Here's what was configured:

### 1. **API Configuration**
- **File**: `src/config.ts`
- **Purpose**: Centralized API URL configuration
- **How it works**: Uses environment variable `VITE_API_URL` for the backend URL
- **Fallback**: Defaults to `http://localhost:5000` for local development

### 2. **Frontend Dockerization**
- **File**: `Dockerfile` (in project root)
- **Purpose**: Containerize the React/Vite frontend for deployment
- **Build process**: Multi-stage build (optimized)
- **Runtime**: Uses `serve` package to host the built app
- **Dynamic Port**: Reads `$PORT` environment variable set by Railway

### 3. **Updated Components**
All frontend components now import and use the configurable API URL:
- LoginPage.tsx
- SuperadminDashboard.tsx
- AdminDashboard.tsx
- UserDashboard.tsx
- FirearmInventory.tsx
- PerformanceDashboard.tsx
- FirearmAllocation.tsx
- GuardFirearmPermits.tsx
- FirearmMaintenance.tsx

### 4. **Configuration Files**
- **railway.json**: Defines services, build commands, and environment variables
- **RAILWAY_DEPLOYMENT.md**: Detailed deployment guide
- **RAILWAY_QUICK_START.md**: Step-by-step checklist
- **.gitignore**: Updated with deployment-related patterns
- **.gitattributes**: Ensures consistent line endings across platforms

### 5. **Backend**
✓ Already configured for Railway:
- Dockerfile uses multi-stage build
- Handles `$PORT` environment variable dynamically
- CORS is configured to accept requests from anywhere
- Database connection via `DATABASE_URL` environment variable

---

## Deployment Architecture

```
GitHub Repository
    ↓
Railway Dashboard (connected to GitHub)
    ├── PostgreSQL Service (managed database)
    │   └── Provides DATABASE_URL
    ├── Backend Service (Rust/Axum)
    │   ├── Reads: DATABASE_URL, SERVER_HOST, SERVER_PORT, ADMIN_CODE
    │   └── Provides: Public URL for API
    └── Frontend Service (React/Vite)
        ├── Reads: VITE_API_URL
        └── Serves: Web application on port 3000
```

---

## Quick Start (Next Steps)

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### 2. Go to Railway Dashboard
- Visit https://railway.app
- Click "New Project" → "Deploy from GitHub"
- Select your repository

### 3. Add Services (in order)
1. PostgreSQL (auto-setup, copy DATABASE_URL)
2. Backend (backend-rust dir, see RAILWAY_QUICK_START.md)
3. Frontend (project root, see RAILWAY_QUICK_START.md)

### 4. Test
- Visit your frontend URL
- Login with your test account
- Check browser console for errors

---

## Environment Variables Required

### Backend
```
SERVER_HOST=0.0.0.0          (already in config)
SERVER_PORT=$PORT            (Railway sets this)
DATABASE_URL=<auto-set>      (from PostgreSQL)
ADMIN_CODE=122601            (already set)
RUST_LOG=info               (optional, for logging)
```

### Frontend
```
VITE_API_URL=https://your-backend-url/api
```

---

## Development vs Production

### Local Development
```bash
# Backend
cd backend-rust
cargo run

# Frontend (new terminal)
npm run dev
```
- Frontend will use fallback: `http://localhost:5000`
- No environment variables needed

### Production (Railway)
- Environment variables in Railway Dashboard override defaults
- Frontend `VITE_API_URL` points to backend service URL
- All communication goes through public URLs

---

## Key Files Modified/Created

| File | Type | Purpose |
|------|------|---------|
| `src/config.ts` | Created | Centralized API URL config |
| `Dockerfile` | Created | Frontend containerization |
| `railway.json` | Created | Railway service definition |
| `RAILWAY_QUICK_START.md` | Created | Deployment checklist |
| `RAILWAY_DEPLOYMENT.md` | Created | Detailed guide |
| `src/components/*.tsx` | Modified | Import and use API_BASE_URL |

---

## Troubleshooting

### Issue: Build takes too long
- Rust compilation can take 5-10 minutes on first build
- Subsequent builds are faster
- This is normal behavior

### Issue: Frontend can't reach backend
- Verify `VITE_API_URL` matches your backend service URL
- Include `/api` suffix in the URL
- Check backend is healthy in Railway dashboard

### Issue: Environment variables not working
- Redeploy after changing variables (Redeploy button in Railway)
- Variables only take effect on fresh deployment

### Issue: Database connection fails
- Ensure `DATABASE_URL` is set from PostgreSQL service
- Backend must wait for PostgreSQL to be healthy
- Check backend logs for connection errors

---

## Security Notes

⚠️ Currently your backend CORS is set to accept all origins:
```rust
CorsLayer::permissive()
    .allow_origin(Any)
```

For production, consider restricting to your frontend domain:
```rust
.allow_origin("https://your-frontend-domain.railway.app".parse()?)
```

---

## Monitoring & Next Steps

After deployment is successful:

1. **Monitor Costs** - Check Railway dashboard usage
2. **Set Up Logging** - Configure error tracking
3. **Test Features** - Verify all user flows work
4. **Database Backups** - Set up automatic backups (Railway provides options)
5. **Custom Domain** - Add your own domain if desired

---

## Resources

- Railway Docs: https://railway.app/docs
- Vite Docs: https://vitejs.dev/
- Axum Documentation: https://docs.rs/axum/
- PostgreSQL Documentation: https://www.postgresql.org/docs/

---

## Questions?

Refer to:
- `RAILWAY_QUICK_START.md` for step-by-step guide
- `RAILWAY_DEPLOYMENT.md` for detailed information
- Railway dashboard logs for debugging
