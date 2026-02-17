# ⚡ SETUP INSTRUCTIONS - READ THIS FIRST!

## Current Status
✅ Rust backend code created  
✅ Configuration file (.env) created  
⏳ **NEXT: Set up your environment**

## Step-by-Step Setup

### Step 1: Restart PowerShell (IMPORTANT!)
Rust won't work until you do this:

1. **Close PowerShell completely** (click the X button)
2. **Wait 2 seconds**
3. **Open a NEW PowerShell window**

This resets your PATH to include Rust.

### Step 2: Navigate to Backend Directory
```powershell
cd "D:\Capstone 1.0\backend-rust"
```

### Step 3: Verify Rust Is Ready
```powershell
cargo --version
```

Should show: `cargo 1.x.x (xxxxxxx 2024-xx-xx)`

### Step 4: Install PostgreSQL (if not already installed)

**Option A: Using Windows Package Manager (Easiest)**
```powershell
winget install PostgreSQL.PostgreSQL
```

**Option B: Manual Download**
- Download from: https://www.postgresql.org/download/windows/
- Run installer
- Default settings are fine
- **Important**: Remember the postgres password you set!

### Step 5: Create Database
After PostgreSQL is installed and running:

```powershell
createdb guard_firearm_system
```

Or if that doesn't work:
```powershell
psql -U postgres -c "CREATE DATABASE guard_firearm_system"
```

### Step 6: Build the Backend (First Time Only)
```powershell
cargo build
```

This downloads all dependencies (~200MB) and compiles. Takes 2-5 minutes first time.

### Step 7: Run the Backend! 🚀
```powershell
cargo run
```

You should see:
```
✓ Connected to PostgreSQL
✓ Database migrations completed  
✓ Server running on http://localhost:5000
```

### Step 8: Test It Works
In another terminal:
```powershell
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok"}`

## If Something Goes Wrong

### "cargo: not recognized"
- ❌ PowerShell not restarted
- ✅ Close and reopen PowerShell completely

### "createdb: not recognized"  
- ❌ PostgreSQL not in PATH
- ✅ Restart PowerShell after PostgreSQL install
- ✅ Or use: `psql -U postgres -c "CREATE DATABASE guard_firearm_system"`

### "connection refused"
- ❌ PostgreSQL not running
- ✅ Start PostgreSQL service
- ✅ On Windows: Services → postgresql → Start
- ✅ Or: `net start postgresql-x64-14` (version may vary)

### Build takes forever
- This is normal first time (~2-5 min)
- Subsequent builds are much faster (~10 sec)

## Your Frontend

**NO CHANGES NEEDED!** Run in another terminal:

```powershell
npm run dev
```

Everything works together on same URLs automatically.

## What Happens When You Run It

When you run `cargo run`:

1. Connects to PostgreSQL
2. Creates all tables automatically
3. Preserves any existing data
4. Starts listening on port 5000
5. Waits for requests

Press `Ctrl+C` to stop the server.

## Quick Commands Reference

```powershell
# Build without running
cargo build

# Build with optimizations
cargo build --release

# Run (debug mode)
cargo run

# Run (release/optimized)  
cargo run --release

# Check for errors without building
cargo check

# View all warnings
cargo clippy
```

## Next: Run the Server!

1. Make sure you're in: `D:\Capstone 1.0\backend-rust`
2. Run: `cargo run`
3. Open another terminal and test: `curl http://localhost:5000/api/health`
4. Done! 🎉

## Questions?

- Check `QUICKSTART.md` for more details
- Check `MIGRATION_GUIDE.md` for feature details
- Check `../frontend-compatibility.md` for frontend integration

---

**You're ready! Start with Step 1 above.**
