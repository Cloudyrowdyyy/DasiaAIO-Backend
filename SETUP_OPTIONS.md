# ⚡ COMPLETE SETUP GUIDE - Choose Your Path

Rust is installed! Now you need to set up the backend. **Choose ONE option below:**

---

## 🐳 OPTION A: Docker (EASIEST - Recommended)

This is the simplest and most reliable way. Docker handles all the compilation automatically.

### Prerequisites
- Docker Desktop (https://www.docker.com/products/docker-desktop)

### Steps

1. **Install Docker Desktop:**
   ```
   https://www.docker.com/products/docker-desktop
   ```
   - Run the installer
   - Restart your computer when done
   - Docker will start automatically

2. **Navigate to backend:**
   ```powershell
   cd "D:\Capstone 1.0\backend-rust"
   ```

3. **Start everything with one command:**
   ```powershell
   docker-compose up -d
   ```

4. **Wait 2-3 minutes for build and startup**, then verify:
   ```powershell
   curl http://localhost:5000/api/health
   ```

   Should return: `{"status":"ok"}`

5. **View logs:**
   ```powershell
   docker-compose logs -f backend
   ```

6. **Stop (when done):**
   ```powershell
   docker-compose down
   ```

**That's it! Your frontend connects to `http://localhost:5000/api` automatically.**

---

## 🔧 OPTION B: Native Compilation (Advanced)

For local Rust development without Docker.

### Prerequisites
- Visual Studio Build Tools (https://visualstudio.microsoft.com/downloads/)

### Steps

1. **Install Visual Studio Build Tools:**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Scroll to "Visual Studio 2022" section
   - Click "Build Tools for Visual Studio 2022"
   - In installer, check: **Desktop development with C++**
   - Click Install (takes 5-10 minutes)
   - Restart your computer

2. **Verify installation:**
   ```powershell
   $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
   rustc --version
   ```

3. **Build the backend:**
   ```powershell
   cd "D:\Capstone 1.0\backend-rust"
   $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
   cargo build --release
   ```
   (First build takes 5-10 minutes, downloads ~500MB)

4. **Create the database:**
   ```powershell
   createdb guard_firearm_system
   ```
   Or:
   ```powershell
   psql -U postgres -c "CREATE DATABASE guard_firearm_system"
   ```

5. **Run the backend:**
   ```powershell
   cargo run --release
   ```

6. **Test:**
   ```powershell
   curl http://localhost:5000/api/health
   ```

---

## ✅ Recommended: Option A (Docker)

### Why Docker is Better:
- ✅ No need for Visual Studio Build Tools (~10GB)
- ✅ Automatic compilation in sandbox
- ✅ Database and backend run together
- ✅ Works exactly the same way
- ✅ Faster overall (skip compilation)
- ✅ Production-ready setup

### Why Option B (Native):
- ✅ Better for Rust development
- ✅ Faster rebuild times
- ✅ More control over compilation
- ✅ No Docker overhead

---

## 🧪 Quick Test

After you choose an option and set up, test with:

```powershell
# Test backend health
curl http://localhost:5000/api/health

# Test with endpoint
curl -X POST http://localhost:5000/api/login `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"identifier":"test@gmail.com","password":"test123"}'
```

Both should respond (health returns `{"status":"ok"}`)

---

## 🚀 Frontend Setup

In another terminal (after backend is running):

```powershell
cd "D:\Capstone 1.0"
npm run dev
```

Frontend will open on http://localhost:5173 and automatically connect to backend on http://localhost:5000

---

## ⚠️ Troubleshooting

### "Docker not found"
- Restart PowerShell after installing Docker Desktop
- Verify: `docker --version`

### "Can't connect to backend"
- Backend must be running first
- Check: `curl http://localhost:5000/api/health`
- Check logs: `docker-compose logs backend`

### "Database already exists"
- That's fine - migrations will update it
- To reset: `docker-compose down -v` then `docker-compose up -d`

### "PostgreSQL not found"  
- Only needed for Option B
- For Option B: Install PostgreSQL from https://www.postgresql.org/download/

---

## 🎯 NEXT STEP

**Choose Option A or B and follow the steps!**

After setup works, you'll have:
- ✅ Backend running on http://localhost:5000
- ✅ Database ready with all tables
- ✅ Frontend ready to connect
- ✅ All features working

---

**Pick your option above and start! Any questions, let me know.** 🚀
