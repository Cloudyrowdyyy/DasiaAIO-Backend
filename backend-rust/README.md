# Guard Firearm Management System - Rust Backend

High-performance REST API backend built with Rust, Axum, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Rust 1.70+ (for local development)

### Using Docker (Recommended)

```bash
docker-compose up -d
```

This will:
1. Start PostgreSQL 15 database
2. Build and run Rust backend
3. Run migrations automatically
4. Backend available at `http://localhost:5000`

### Local Development

```bash
# Install dependencies
cargo build

# Run migrations
sqlx migrate run

# Start server
cargo run
```

## 📋 Environment Variables

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guard_firearm_system
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
ADMIN_CODE=122601
RUST_LOG=info
```

## 🏗️ Architecture

### Handler Structure
- `auth.rs` - Authentication (register, login, verify)
- `users.rs` - User CRUD operations
- `firearms.rs` - Firearm inventory management
- `firearm_allocation.rs` - Firearm allocation tracking
- `guard_replacement.rs` - Shift and attendance management
- `health.rs` - Health check endpoint

### Database Models
- `users` - User accounts and roles
- `verifications` - Email verification codes
- `firearms` - Firearm inventory
- `firearm_allocations` - Allocation history
- `guard_firearm_permits` - Guard permits
- `firearm_maintenance` - Maintenance records
- `attendance` - Guard attendance logs
- `shifts` - Shift schedules
- `allocation_alerts` - Alert notifications

## 📚 API Documentation

### Authentication Endpoints

**Register**
```
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "full_name": "Full Name",
  "phone_number": "123456789",
  "role": "guard|admin",
  "admin_code": "122601" (required for admin)
}
```

**Login**
```
POST /api/login
Content-Type: application/json

{
  "identifier": "email@example.com",
  "password": "password"
}
```

**Verify Email**
```
POST /api/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Resend Verification Code**
```
POST /api/resend-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### User Endpoints

**Get All Users**
```
GET /api/users
```

**Get User by ID**
```
GET /api/user/:id
```

**Update User**
```
PUT /api/user/:id
Content-Type: application/json

{
  "username": "new_username",
  "full_name": "New Name",
  "phone_number": "987654321"
}
```

**Delete User**
```
DELETE /api/user/:id
```

### Firearm Endpoints

**Add Firearm**
```
POST /api/firearms
Content-Type: application/json

{
  "serial_number": "SN123456",
  "model_name": "Model X",
  "manufacturer": "Manufacturer",
  "caliber": ".45",
  "condition": "good",
  "status": "available"
}
```

**Get All Firearms**
```
GET /api/firearms
```

**Get Firearm by ID**
```
GET /api/firearms/:id
```

**Update Firearm**
```
PUT /api/firearms/:id
Content-Type: application/json

{
  "status": "available|allocated|maintenance",
  "condition": "good|fair|poor"
}
```

**Delete Firearm**
```
DELETE /api/firearms/:id
```

### Firearm Allocation Endpoints

**Issue Firearm**
```
POST /api/firearm-allocation/issue
Content-Type: application/json

{
  "firearm_id": "uuid",
  "guard_id": "uuid",
  "issued_date": "2026-02-17",
  "notes": "Optional notes"
}
```

**Return Firearm**
```
POST /api/firearm-allocation/return
Content-Type: application/json

{
  "allocation_id": "uuid",
  "return_date": "2026-02-17",
  "condition_on_return": "good",
  "notes": "Optional notes"
}
```

**Get Guard Allocations**
```
GET /api/guard-allocations/:guard_id
```

**Get Active Allocations**
```
GET /api/firearm-allocations/active
```

### Guard Management Endpoints

**Create Shift**
```
POST /api/guard-replacement/shifts
Content-Type: application/json

{
  "guard_id": "uuid",
  "shift_date": "2026-02-17",
  "shift_type": "morning|afternoon|night",
  "location": "Location"
}
```

**Check In Guard**
```
POST /api/guard-replacement/attendance/check-in
Content-Type: application/json

{
  "guard_id": "uuid",
  "shift_id": "uuid",
  "check_in_time": "2026-02-17T08:00:00Z"
}
```

**Check Out Guard**
```
POST /api/guard-replacement/attendance/check-out
Content-Type: application/json

{
  "guard_id": "uuid",
  "attendance_id": "uuid",
  "check_out_time": "2026-02-17T16:00:00Z"
}
```

**Detect No-Shows**
```
POST /api/guard-replacement/detect-no-shows
Content-Type: application/json

{
  "shift_date": "2026-02-17"
}
```

**Request Replacement**
```
POST /api/guard-replacement/request-replacement
Content-Type: application/json

{
  "original_guard_id": "uuid",
  "shift_id": "uuid",
  "reason": "Reason for replacement"
}
```

**Set Availability**
```
POST /api/guard-replacement/set-availability
Content-Type: application/json

{
  "guard_id": "uuid",
  "available": true,
  "available_from": "2026-02-18",
  "available_until": "2026-02-25"
}
```

### Health Check

**Health Status**
```
GET /api/health
Response: {"status":"ok"}
```

## 🐳 Docker Commands

### Build Image
```bash
docker-compose build --no-cache
```

### View Logs
```bash
docker-compose logs backend --tail 100
docker-compose logs postgres --tail 50
```

### Connect to Database
```bash
docker-compose exec postgres psql -U postgres -d guard_firearm_system
```

### List Tables
```bash
docker-compose exec -T postgres psql -U postgres -d guard_firearm_system -c "\dt"
```

### Stop Services
```bash
docker-compose down
```

### Remove All Data
```bash
docker-compose down -v
```

## 🛠️ Development

### Project Structure
```
src/
├── main.rs              # Router setup
├── db.rs               # Database connection & migrations
├── config.rs           # Configuration management
├── error.rs            # Error handling
├── models.rs           # Data structures
├── handlers/           # API handlers
│   ├── auth.rs
│   ├── users.rs
│   ├── firearms.rs
│   ├── firearm_allocation.rs
│   ├── guard_replacement.rs
│   ├── health.rs
│   └── mod.rs
└── utils.rs            # Helper functions
```

### Run Tests
```bash
cargo test

# With output
cargo test -- --nocapture

# Specific test
cargo test test_name
```

### Format Code
```bash
cargo fmt
```

### Lint Code
```bash
cargo clippy
```

### Build Optimized
```bash
cargo build --release
```

## 📊 Database Migrations

Migrations run automatically on startup. SQL migrations are in `schema/` directory:
- Users table with role-based access
- Verification codes table
- Firearm inventory tables
- Allocation tracking tables
- Attendance and shift tables
- Alert notifications table

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- Email verification required for new accounts
- Role-based access control
- CORS enabled for frontend
- Database connection pooling
- Input validation on all endpoints
- SQL injection prevention via prepared statements

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connection to server on socket failed
```
Solution: Ensure PostgreSQL container is healthy
```bash
docker-compose ps
docker-compose logs postgres
```

### Port Already in Use
```
Error: bind: address already in use
```
Solution: Change port in docker-compose.yml or stop conflicting service

### Migration Failed
```
Error: database "guard_firearm_system" does not exist
```
Solution: Recreate containers with fresh database
```bash
docker-compose down -v
docker-compose up -d
```

### Compilation Error - SQLx Macros
All `sqlx::query!()` macros have been converted to `sqlx::query()` for offline compilation. No database needed at build time.

## 📝 Contributing

1. Follow Rust naming conventions
2. Run `cargo fmt` before committing
3. Ensure `cargo clippy` passes
4. Add tests for new features
5. Update API documentation

## 📄 License

Confidential - Authorized use only

## 👥 Support

For backend-specific issues or questions, check the logs:
```bash
docker-compose logs backend
```
