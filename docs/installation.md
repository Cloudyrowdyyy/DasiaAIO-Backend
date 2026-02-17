---
layout: default
title: Installation & Setup
---

# Installation & Setup

## Prerequisites

- **Node.js** 20+ (for frontend)
- **Rust** 1.70+ (for backend)  
- **PostgreSQL** 13+ (database)
- **Git** (version control)

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Cloudyrowdyyy/capstone-1.0.git
cd capstone-1.0
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`

### 3. Backend Setup
```bash
cd backend-rust
cargo run
```
Runs on `http://localhost:5000`

### 4. Database Setup
```bash
psql -U postgres -c "CREATE DATABASE guard_firearm_system;"
```

---

## Environment Configuration

Create `.env` in project root:
```
VITE_API_URL=http://localhost:5000
```

Create `.env` in `backend-rust/`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/guard_firearm_system
ADMIN_CODE=122601
```

---

## Troubleshooting

### "Port already in use"
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### "Database connection failed"
```bash
# Test PostgreSQL
psql postgresql://postgres:password@localhost/guard_firearm_system
```

### "Build fails"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

---

[← Back to Home](/)
