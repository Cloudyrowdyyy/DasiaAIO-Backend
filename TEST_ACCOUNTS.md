# Test Accounts - February 17, 2026 ✅

## Working Test Accounts

### Admin Account - VERIFIED & TESTED ✓
- **Username**: `admin`
- **Email**: `admin@gmail.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Full Name**: System Administrator
- **Phone**: +63-900-000-0001
- **Status**: ✅ Verified (Ready to use)

### User Account - VERIFIED & TESTED ✓
- **Username**: `user`
- **Email**: `user@gmail.com`
- **Password**: `user123`
- **Role**: `user`
- **Full Name**: Test User
- **Phone**: +639000000002
- **License Number**: LIC-2025-001
- **License Expiry**: 2027-12-31
- **Status**: ✅ Verified (Ready to use)

## Setup Completed

✅ All accounts created via registration API
✅ Both accounts verified and tested successfully
✅ Login works with username, email, and phone number
✅ Password hashing validated with bcrypt hashing (60-char hashes)

## How to Login

### Step 1: Start the System
```bash
# Terminal 1: Backend
cd d:\Capstone 1.0\backend-rust
docker-compose up -d

# Terminal 2: Frontend  
cd d:\Capstone 1.0
npm run dev
```

### Step 2: Login Options
Go to http://localhost:5178 and use ANY of these:

**Login as Admin:**
- Username: `admin` OR Email: `admin@gmail.com`
- Password: `admin123`

**Login as User:**
- Username: `user` OR Email: `user@gmail.com`
- Password: `user123`

### Step 3: Access Dashboard
- Admins see Admin Dashboard
- Users see User Dashboard

## Features Tested & Working
✅ Username login (NEW as of Feb 17, 2026)
✅ Email login
✅ Phone number login
✅ Password verification with bcrypt
✅ Role-based dashboard routing
✅ Both accounts fully verified
