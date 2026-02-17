# DASIA AIO Management System - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Development](#development)

---

## Architecture Overview

### Technology Stack

```
Frontend Layer
├── React 18.2.0
├── TypeScript 5.9.3
├── Vite 7.3.1 (Build tool)
└── CSS3 (Styling)

Backend Layer
├── Rust (Language)
├── Axum 0.7 (Web framework)
├── Tokio 1.0 (Async runtime)
└── SQLx 0.7 (Database driver)

Database Layer
└── PostgreSQL 15
```

### System Architecture

```
┌─────────────────┐
│   Browser       │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│   Frontend (React/Vite)         │  Port 3000 (Production) / 5173 (Dev)
│  - User Interface               │
│  - API Client (fetch)           │
│  - State Management             │
└────────┬────────────────────────┘
         │ REST API
         ▼
┌─────────────────────────────────┐
│   Backend (Rust/Axum)           │  Port 5000
│  - API Endpoints                │
│  - Business Logic               │
│  - Authentication               │
│  - CORS Handler                 │
└────────┬────────────────────────┘
         │ SQL
         ▼
┌─────────────────────────────────┐
│   PostgreSQL Database           │  Port 5432
│  - User Data                    │
│  - Inventory                    │
│  - Allocations                  │
│  - Logs & Audit Trail           │
└─────────────────────────────────┘
```

---

## System Requirements

### Development

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Frontend tooling & package management |
| Rust | 1.70+ | Backend compilation |
| PostgreSQL | 13+ | Database |
| npm | 10+ | Package manager |
| Git | 2.25+ | Version control |

### Production (Railway)

- Docker support for containerization
- Node.js 20 (frontend)
- Rust compiler (backend)
- PostgreSQL managed service

---

## Installation Guide

### Step 1: Prerequisites Setup

#### Windows
```powershell
# Install Rust
http://rustup.rs

# Verify Node.js (should be 20+)
node --version
npm --version
```

#### macOS
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js via Homebrew
brew install node
```

#### Linux (Ubuntu/Debian)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js
sudo apt update && sudo apt install nodejs npm
```

### Step 2: Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE guard_firearm_system;

# Create user (optional)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE guard_firearm_system TO app_user;
\q
```

### Step 3: Clone & Setup

```bash
git clone https://github.com/Cloudyrowdyyy/capstone-1.0.git
cd capstone-1.0

# Frontend
npm install

# Backend
cd backend-rust
cargo build --release
cd ..
```

### Step 4: Environment Configuration

Create `.env` in project root:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guard_firearm_system
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
ADMIN_CODE=122601
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=app-specific-password
```

---

## Configuration

### Frontend Configuration

**File**: `src/config.ts`

```typescript
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
```

Environment Variables:
- `VITE_API_URL` - Backend API URL (set in Railway)

### Backend Configuration

**File**: `backend-rust/src/config.rs`

Reads from environment:
```
SERVER_HOST     → Server bind address
SERVER_PORT     → Server port
DATABASE_URL    → PostgreSQL connection string
ADMIN_CODE      → Special registration code
GMAIL_USER      → Email sender address
GMAIL_PASSWORD  → Email password (app-specific)
```

### Build Configuration

**Vite Config**: `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'app-dist',
    emptyOutDir: true,
  }
})
```

**Rust Config**: `backend-rust/Cargo.toml`
```toml
[package]
name = "guard-firearm-backend"
version = "1.0.0"
edition = "2021"
```

---

## API Reference

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend-url/api`

### Authentication Endpoints

#### Register User
```
POST /api/register
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "securePassword",
  "username": "johnuser",
  "full_name": "John Doe",
  "phone_number": "+63-555-123-4567",
  "role": "guard",
  "license_number": "DL123456",
  "license_expiry_date": "2026-12-31"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "user@gmail.com",
  "role": "guard"
}
```

#### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "securePassword"
}

Response: 200 OK
{
  "id": "uuid",
  "email": "user@gmail.com",
  "username": "johnuser",
  "role": "guard"
}
```

#### Verify Email
```
POST /api/verify
Content-Type: application/json

{
  "email": "user@gmail.com",
  "code": "123456"
}

Response: 200 OK
```

### User Management Endpoints

#### Get All Users
```
GET /api/users
Authorization: Bearer token

Response: 200 OK
{
  "users": [
    {
      "id": "uuid",
      "email": "user@gmail.com",
      "username": "johnuser",
      "role": "guard",
      "full_name": "John Doe",
      "phone_number": "+63-555-123-4567"
    }
  ]
}
```

#### Get User by ID
```
GET /api/user/:id
Authorization: Bearer token

Response: 200 OK
{
  "id": "uuid",
  "email": "user@gmail.com",
  ...user details
}
```

#### Update User
```
PUT /api/user/:id
Authorization: Bearer token
Content-Type: application/json

{
  "email": "newemail@gmail.com",
  "full_name": "New Name"
}

Response: 200 OK
```

#### Delete User
```
DELETE /api/user/:id
Authorization: Bearer token

Response: 204 No Content
```

### Firearm Management Endpoints

#### Get All Firearms
```
GET /api/firearms

Response: 200 OK
{
  "firearms": [
    {
      "id": "uuid",
      "serialNumber": "SN123456",
      "model": "Glock 19",
      "type": "Pistol",
      "status": "available",
      "lastMaintenance": "2026-01-15"
    }
  ]
}
```

#### Add Firearm
```
POST /api/firearms
Content-Type: application/json

{
  "serialNumber": "SN123456",
  "model": "Glock 19",
  "type": "Pistol",
  "status": "available"
}

Response: 201 Created
```

#### Update Firearm
```
PUT /api/firearms/:id
Content-Type: application/json

{
  "status": "maintenance",
  "lastMaintenance": "2026-02-17"
}

Response: 200 OK
```

#### Delete Firearm
```
DELETE /api/firearms/:id

Response: 204 No Content
```

### Allocation Endpoints

#### Issue Firearm
```
POST /api/firearm-allocation/issue
Content-Type: application/json

{
  "guardId": "uuid",
  "firearmId": "uuid",
  "issueDate": "2026-02-17"
}

Response: 201 Created
```

#### Return Firearm
```
POST /api/firearm-allocation/return
Content-Type: application/json

{
  "allocationId": "uuid",
  "returnDate": "2026-02-17"
}

Response: 200 OK
```

#### Get Active Allocations
```
GET /api/firearm-allocations/active

Response: 200 OK
{
  "allocations": [
    {
      "id": "uuid",
      "guardId": "uuid",
      "firearmId": "uuid",
      "status": "active"
    }
  ]
}
```

### Health Check
```
GET /api/health

Response: 200 OK
{
  "status": "healthy"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  license_number VARCHAR(255),
  license_expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Firearms Table
```sql
CREATE TABLE firearms (
  id UUID PRIMARY KEY,
  serialNumber VARCHAR(255) UNIQUE NOT NULL,
  model VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  lastMaintenance TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Firearm Allocations Table
```sql
CREATE TABLE firearm_allocations (
  id UUID PRIMARY KEY,
  guardId UUID REFERENCES users(id),
  firearmId UUID REFERENCES firearms(id),
  issueDate TIMESTAMP NOT NULL,
  returnDate TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Maintenance Logs Table
```sql
CREATE TABLE firearm_maintenance (
  id UUID PRIMARY KEY,
  firearmId UUID REFERENCES firearms(id),
  performedDate TIMESTAMP NOT NULL,
  maintenanceType VARCHAR(255),
  notes TEXT,
  performedBy UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Deployment

### Railway Deployment Steps

1. **Connect GitHub Repository**
   - Go to railway.app
   - Create new project
   - Connect GitHub repo

2. **Add Services**
   ```
   Service 1: PostgreSQL (auto-managed)
   Service 2: Backend (backend-rust/)
   Service 3: Frontend (project root)
   ```

3. **Set Environment Variables**
   ```
   Backend:
   - DATABASE_URL (auto from PostgreSQL)
   - SERVER_HOST=0.0.0.0
   - SERVER_PORT=$PORT
   - ADMIN_CODE=122601
   
   Frontend:
   - VITE_API_URL=https://backend-url/api
   ```

4. **Deploy**
   - Railway auto-deploys on GitHub push
   - Monitor in Deployments tab

### Docker Build

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

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### PostgreSQL Connection Error
```bash
# Test connection
psql postgresql://user:pass@localhost:5432/guard_firearm_system

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Build Fails on M1/M2 Mac
```bash
# Use native build
cargo build --release --target aarch64-apple-darwin
```

### Frontend Shows Blank Page
1. Check browser console (F12)
2. Verify VITE_API_URL is correct
3. Check backend is running
4. Clear cache: Ctrl+Shift+Delete

---

## Development

### Running Locally

**Terminal 1 - Backend**
```bash
cd backend-rust
cargo run
# Listens on http://localhost:5000
```

**Terminal 2 - Frontend**
```bash
npm run dev
# Listens on http://localhost:5173
```

### Code Structure

**Frontend**
- `src/components/` - React components
- `src/styles/` - CSS files
- `src/App.tsx` - Main component
- `src/config.ts` - API configuration

**Backend**
- `src/main.rs` - Server entry point
- `src/handlers/` - API route handlers
- `src/models.rs` - Data structures
- `src/db.rs` - Database queries
- `src/config.rs` - Configuration

### Testing

```bash
# Frontend tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Code Standards

- **Frontend**: Use TypeScript, prefer functional components
- **Backend**: Follow Rust conventions, use Result types
- **Both**: Add comments for complex logic

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## Performance Optimization

### Frontend
- Lazy load components
- Optimize bundle size
- Cache API responses
- Use React.memo for expensive renders

### Backend
- Connection pooling
- Query optimization
- Caching strategies
- Rate limiting

---

## Security Considerations

- ✅ Password hashing (bcrypt)
- ✅ Email verification
- ✅ API CORS configuration
- ✅ SQL injection prevention (SQLx)
- ⚠️ Add JWT tokens for production
- ⚠️ Implement rate limiting
- ⚠️ Add HTTPS enforcement

---

## Support & Resources

- **Railway Docs**: https://railway.app/docs
- **React Docs**: https://react.dev
- **Rust Docs**: https://doc.rust-lang.org
- **Axum** https://docs.rs/axum

---

**Last Updated**: February 17, 2026  
**Version**: 1.0.0
