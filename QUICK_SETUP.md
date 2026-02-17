# 🚀 Quick Copy-Paste Setup Commands

## Option A: Docker (Recommended)

**These are 3 simple copy-paste commands:**

### 1. Install Docker
Download and install: https://www.docker.com/products/docker-desktop

### 2. Start Backend + Database
```powershell
cd "D:\Capstone 1.0\backend-rust"
docker-compose up -d
```

### 3. Start Frontend
```powershell
cd "D:\Capstone 1.0"
npm run dev
```

**Done!** Open http://localhost:5173 and everything works.

---

## Option B: Native Build

### 1. Install Build Tools
Download: https://visualstudio.microsoft.com/downloads/

Look for "Build Tools for Visual Studio 2022" → Install → Select "Desktop development with C++" → Wait 5-10 min → Restart computer

### 2. Create Database
```powershell
psql -U postgres -c "CREATE DATABASE guard_firearm_system"
```

### 3. Build & Run Backend
```powershell
cd "D:\Capstone 1.0\backend-rust"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
cargo build --release
cargo run --release
```

### 4. Start Frontend (new terminal)
```powershell
cd "D:\Capstone 1.0"
npm run dev
```

---

## ✅ Test Commands

### Test Backend is Running
```powershell
curl http://localhost:5000/api/health
```

Should return:
```json
{"status":"ok"}
```

### Test Frontend Connects
- Open http://localhost:5173
- Should load the login page
- Backend connection works ✅

---

## 📞 If Something Goes Wrong

### "docker: not recognized"
→ Restart PowerShell after installing Docker

### "Can't reach http://localhost:5000"
→ Backend not running. Check:
```powershell
docker-compose logs backend
```

### "Port already in use"
→ Something else is using port 5000/5173
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000
# Kill it with Task Manager or:
taskkill /PID <number> /F
```

---

## ✨ That's Really It!

Follow one option above (A recommended for simplicity, B for development).

Both will work perfectly with your TypeScript frontend.

**Questions? Let me know!** 🎉
