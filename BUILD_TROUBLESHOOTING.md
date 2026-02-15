# Build & Distribution Issues - Solutions

## Current Status

The Electron app is fully configured and **works perfectly in development mode**. The production build has a known issue with electron-builder's Windows code signing tools.

## Development Mode (Works ✅)

The app runs great in development:

```bash
npm run dev
```

This starts:
- Vite dev server on http://localhost:5173
- Express backend on http://localhost:5000
- Electron app (auto-launches)

## Production Build Issue & Solutions

### The Problem
electron-builder v26.7.0 tries to download Windows code signing tools that contain macOS symlinks, which can't be created on Windows without admin privileges.

### Solution 1: Use GitHub Actions (Recommended)
Create a `.github/workflows/build.yml` to build on CI/CD - it has proper permissions:

```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd backend && npm install && cd ..
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: installer
          path: release/
```

### Solution 2: Run on Ubuntu/Linux
```bash
# On WSL2 or native Linux
npm run build
# Creates release/ folder with installer
```

### Solution 3: Use Prebuilt Electron Executable
For now, use the development build as your distribution:

```bash
# Package the backend and app-dist together
npm run build:web
# Distribute app-dist/ + backend/ + electron.cjs + package.json
# Users can run: npm install && npm run electron
```

### Solution 4: Downgrade electron-builder (if needed)
If you need Windows builds without CI/CD:

```bash
npm install electron-builder@24.6.4 --save-dev
npm run build
```

## For Users - Running the App

### Option A: Development Mode
```bash
npm install
cd backend && npm install && cd ..
npm run dev
```

### Option B: From Production Build (when available)
```bash
# If distributed as installer
Run the .exe installer
# App installs to Program Files and starts automatically
```

### Option C: Portable Version
```bash
# If GitHub Actions succeeds
# Download from Releases → Guard Firearm Management-1.0.0-x64.exe
# Double-click to run (no installation needed)
```

## Next Steps to Fix

1. **[Recommended]** Set up GitHub Actions workflow for CI/CD builds
2. Request elevated permissions on build machine
3. Or switch to electron-builder v24 which is more stable

## What Works Now

✅ Development server (`npm run dev`)  
✅ Vite build (`npm run build:web`)  
✅ Electron launcher  
✅ All firearm features  
✅ Database connections  
✅ User management  

## Files

- `electron.cjs` - Electron main process (CommonJS)
- `preload.js` - Secure API bridge
- `app-dist/` - Built React app (created after `npm run build:web`)
- `package.json` - Build configuration with electron-builder settings
