# Electron App Setup Guide

## Overview
The Guard Firearm Management System is now packaged as a desktop application using Electron, making it easy to install and run on Windows, Mac, and Linux.

## System Requirements
- Windows 7 or later (for Windows build)
- Node.js v18 or higher
- MongoDB (local or Atlas cloud)
- 200 MB disk space for installation

## Installation

### Option 1: Quick Start (Recommended)
1. Run `setup.bat` to install all dependencies
2. Run `start-dev.bat` to launch in development mode
3. The desktop app will open automatically

### Option 2: Manual Installation
```bash
# Install dependencies
npm install
cd backend
npm install
cd ..

# Start development environment
npm run dev
```

## Running the Application

### Development Mode
```bash
npm run dev
```
- Frontend runs on http://localhost:5173
- Backend runs on http://localhost:5000
- Electron app launches automatically
- Developer tools available (F12 or Ctrl+Shift+I)

### Production Build
```bash
npm run build
```
This creates a Windows installer (.exe) in the `dist/` folder
- The installer can be distributed to other users
- No Node.js required for installation

### Run Pre-built App
```bash
npm run electron
```

## Building for Distribution

### Windows Installer
```bash
npm run build
```
Creates files in `dist/`:
- `Guard Firearm Management Setup.exe` - Installer
- `Guard Firearm Management-*.exe` - Portable version

### Distribution
1. Copy the .exe file to other machines
2. Run the installer
3. App will be installed and accessible from Start Menu

## Environment Configuration

Create `.env` file in the `backend` folder:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db-name?retryWrites=true&w=majority
```

For local MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/guard-firearm-system
```

## Troubleshooting

### Port Already in Use
If ports 5173 or 5000 are already in use:
1. Kill the process using the port
2. Or edit frontend/package.json to use a different port

### MongoDB Connection Issues
- Verify MongoDB is running locally, or
- Check your MongoDB Atlas credentials
- Ensure IP whitelist includes your computer

### Electron Won't Launch
1. Check backend is running on port 5000
2. Check frontend is running on port 5173
3. Review console output for errors

## Features
- ✅ User Management with Role-Based Access
- ✅ Firearm Inventory Management
- ✅ Firearm Allocation & Tracking
- ✅ Guard Permit Management
- ✅ Maintenance Scheduling
- ✅ Performance Analytics
- ✅ Cross-Platform Desktop App

## Keyboard Shortcuts
- `Ctrl+Q` or `Alt+F4` - Exit application
- `F5` - Reload page
- `F12` - Open Developer Tools
- `Ctrl+Shift+I` - Toggle Developer Tools
