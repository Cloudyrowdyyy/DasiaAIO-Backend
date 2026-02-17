# PARA SA MGA BOBO 🎯
## Guard Firearm Management System - Complete Setup & Usage Guide

---

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [How to Run](#how-to-run)
3. [Logging In](#logging-in)
4. [User Dashboards](#user-dashboards)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## 🚀 Initial Setup

### Step 1: Install Required Software
You need to install these ONCE:

1. **Node.js** - Download from https://nodejs.org/ (v18 or newer)
   - Click the green "LTS" button
   - Run the installer
   - Click "Next" until installation finishes

2. **Docker** - Download from https://www.docker.com/products/docker-desktop/
   - Run the installer
   - Restart your computer when it finishes

### Step 2: Get the Project Files
```bash
# Open Command Prompt or PowerShell
cd d:\Capstone 1.0

# Install all javascript dependencies (one time only)
npm install
```

### Step 3: Start the Backend
```bash
# Open PowerShell/Command Prompt
cd d:\Capstone 1.0\backend-rust

# Start the backend servers (Docker)
docker-compose up -d

# Wait 30 seconds for everything to start...
```

That's it! The backend is now running in the background.

---

## 🏃 How to Run (Every Time)

### Quick Start (3 Steps)

**EVERY TIME** you want to use the system:

1. **Start Backend** (if not running):
   ```bash
   cd d:\Capstone 1.0\backend-rust
   docker-compose up -d
   ```
   ✓ The backend services are now running

2. **Start Frontend** (in a NEW PowerShell/Command Prompt):
   ```bash
   cd d:\Capstone 1.0
   npm run dev
   ```
   Wait for this message:
   ```
   ✨ Ready in XXXms
   ➜  Local:   http://localhost:5178/
   ```

3. **Open Browser**:
   - Go to: http://localhost:5178/
   - You should see the login page

✅ **You're ready to use the system!**

---

## 🔐 Logging In

### Admin Account (Full System Access)
Use this to manage everything:
```
Username: admin
Email:    admin@gmail.com
Password: admin123
```

**What you can do:**
- ✓ View all users in the system
- ✓ Edit user details (name, phone, license, expiry date)
- ✓ Delete users
- ✓ View firearm inventory
- ✓ Manage allocations
- ✓ View all reports

### User Account (Limited Access)
Use this to see user features:
```
Username: user
Email:    user@gmail.com
Password: user123
```

**What you can do:**
- ✓ View your profile
- ✓ See your assigned firearms
- ✓ View your attendance records
- ✓ Check your permits

---

## 📊 User Dashboards

### 1. SuperAdmin Dashboard
**Access Level**: Full system control

**Main Screen Shows:**
- **Stats Cards**: Total Users, Admins, Guards, Regular Users
- **Users Table**: All users in the system with these columns:
  - Email
  - Username
  - Full Name
  - Role
  - Actions (Edit/Delete buttons)

**What you can do:**
```
Click [Edit] → Opens modal to change:
  • Full Name
  • Phone Number
  • License Number
  • License Expiry Date

Click [Delete] → Removes the user from system
```

### 2. Admin Dashboard
**Access Level**: Limited system control

**Features**: Same as SuperAdmin but for specific admin users

### 3. Guard Dashboard
**Access Level**: View personal information

**Shows:**
- Your profile information
- Your assigned firearms (if any)
- Your recent check-in/out records
- Your firearm permits
- Your performance metrics

### 4. Navigation Sidebar
All dashboards have a left sidebar with menu options:
```
Dashboard    → Main dashboard
Performance  → View performance metrics
Firearms     → Firearm inventory
Allocation   → Firearm allocations
Permits      → Guard firearm permits
Maintenance  → Maintenance records
Logout       → Sign out
```

---

## 🔧 Common Tasks

### Task 1: How to Edit a User

1. Login as Admin
2. Go to Admin Dashboard
3. Find the user in the table
4. Click the blue **[Edit]** button
5. A popup form appears
6. Change the fields you need:
   - **Full Name**: User's complete name
   - **Phone Number**: Contact number
   - **License Number**: ID of firearm license
   - **License Expiry Date**: When license expires
7. Click **[Save Changes]**
8. ✓ User is updated! Table refreshes automatically

### Task 2: How to Delete a User

1. Login as Admin
2. Go to Admin Dashboard
3. Find the user in the table
4. Click the red **[Delete]** button
5. Confirmation dialog appears asking: "Are you sure?"
6. Click **OK** to confirm (or Cancel to stop)
7. ✓ User is deleted permanently

### Task 3: How to View Firearm Inventory

1. Click **Firearms** in the sidebar
2. You'll see a table with all firearms:
   - Serial Number
   - Model
   - Caliber
   - Status (Available/Deployed/Maintenance)
   - Last Maintenance Date

### Task 4: How to Check Your Profile (Guard)

1. Make sure you're logged in as a guard
2. Click **My Dashboard** 
3. You'll see:
   - Your full name
   - Your email
   - Your phone number
   - Your license number
   - Your license expiry date
   - Recent attendance records
   - Quick action buttons

### Task 5: How to View Performance

1. Click **Performance** in the sidebar
2. You'll see a table with performance data:
   - Guard name/email
   - Performance percentage
   - Attendance rate
   - Allocations completed
   - Maintenance tasks

### Task 6: How to View Maintenance Records

1. Click **Maintenance** in the sidebar
2. You'll see all firearm maintenance records:
   - Firearm ID
   - Type of maintenance
   - Maintenance date
   - Next scheduled maintenance
   - Status (if overdue)

---

## 🐛 Troubleshooting

### Problem 1: "Connection Refused" or "Cannot reach backend"

**What it means**: Backend is not running

**How to fix**:
```bash
cd d:\Capstone 1.0\backend-rust
docker-compose up -d
```
Wait 30 seconds, then refresh browser (F5)

### Problem 2: Frontend shows blank page

**What to do**:
1. Press F5 to refresh
2. Press F12 to open developer tools
3. Look for red error messages
4. Check that npm dev is running (you should see "Ready in XXXms")

### Problem 3: "Email already exists" error when registering

**What it means**: That email is already registered

**How to fix**:
- Use a different email address
- OR ask admin to delete that user first

### Problem 4: Cannot log in with test credentials

**What to try**:
1. Check spelling carefully
2. Make sure CAPS LOCK is off
3. Try resetting browser cookies (Ctrl+Shift+Delete)
4. Check that backend is running (see Problem 1)

### Problem 5: Edited user but changes not showing

**What to do**:
1. Press F5 to refresh the page
2. Log out and log back in
3. Restart backend: `docker-compose down` then `docker-compose up -d`

### Problem 6: Cannot delete or edit users

**Check this**:
- Are you logged in as Admin? (Only admins can edit/delete)
- Click the button again (sometimes it needs a moment)
- Check browser console (F12) for error messages

### Problem 7: Port 5178 already in use

**What it means**: Another app is using that port

**How to fix**:
```bash
# Kill the process using the port
Get-Process -Id (Get-NetTCPConnection -LocalPort 5178).OwningProcess | Stop-Process -Force

# Then try again
npm run dev
```

### Problem 8: Docker containers won't start

**What to do**:
```bash
# First, stop everything
cd d:\Capstone 1.0\backend-rust
docker-compose down

# Check if there are issues
docker-compose logs

# Try starting again
docker-compose up -d
```

---

## ❓ FAQ

### Q1: Do I need to install anything every time?
**A**: No! Only the first time. After that, just run:
- `docker-compose up -d` (in backend-rust folder)
- `npm run dev` (in main folder)

### Q2: Can I create new users?
**A**: Yes! Click the "Register" button on login page, enter email and password, check email for verification code.

### Q3: What if I forget my password?
**A**: Ask admin to delete your account, then register again with new password.

### Q4: Can guards edit other guards' information?
**A**: No, only Admin/Superadmin can edit users.

### Q5: Where are the databases stored?
**A**: In Docker containers. Data is saved automatically.

### Q6: Can I access this from my phone?
**A**: Yes! Go to http://YOUR_COMPUTER_IP:5178/ (replace YOUR_COMPUTER_IP with your computer's IP)
- To find your IP: Run `ipconfig` in Command Prompt, look for "IPv4 Address"

### Q7: How long does the registration verification code last?
**A**: 10 minutes. After that you need to request a new one.

### Q8: Can I have multiple users editing at the same time?
**A**: Yes! Multiple windows in the browser, or different users on different computers.

### Q9: What if I accidentally deleted the wrong user?
**A**: Unfortunately, deletion is permanent. But you can create a new account with the same email again.

### Q10: How do I get admin access?
**A**: Contact your system administrator. They can change your role in the system.

---

## 💡 Quick Tips & Tricks

**Tip 1**: Bookmark the login page (http://localhost:5178/) for quick access

**Tip 2**: Use Chrome or Firefox for best experience (avoid Internet Explorer)

**Tip 3**: The sidebar is scrollable if you have many options

**Tip 4**: Click "Logout" button carefully - it will sign you out immediately

**Tip 5**: All tables have columns you can see - scroll right if table is wide

**Tip 6**: Error messages appear at top of page in red - read them carefully

**Tip 7**: When editing user info, blank fields mean "don't change this"

**Tip 8**: Confirmation dialogs ("Are you sure?") prevent accidental deletions - always read them

---

## 🆘 If You're Stuck

### Check These in Order:

1. **Is Backend Running?**
   ```bash
   docker-compose ps
   # Should show 2 containers: guard-firearm-backend and guard-firearm-postgres
   ```

2. **Is Frontend Running?**
   - Look for "Ready in XXXms" message in terminal

3. **Is Browser Connected?**
   - Try http://localhost:5178/
   - If blank page, press F5

4. **Are You Logged In?**
   - Check if you see username/email at top

5. **Are You Using Right Account?**
   - Admin account for editing: admin | admin123
   - Guard account for viewing: user | user123

---

## 📞 Getting Help

If you're still stuck:

1. Take a screenshot of the error
2. Note what you were trying to do
3. Check the browser console (F12 > Console tab) for error messages
4. Ask your supervisor or admin

---

**Version**: 1.0 (February 2026)
**Last Updated**: 2026-02-17

**Remember**: When in doubt, try refreshing the page (F5) or restarting the services! 😊
