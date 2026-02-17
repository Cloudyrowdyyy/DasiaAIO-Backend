# Rust Backend - Quick Start Guide

Welcome! Here's everything you need to get your Rust backend up and running.

## 📋 Prerequisites

Before you start, make sure you have installed:

1. **Rust** (https://rustup.rs/)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env  # On Windows, restart terminal
   ```

2. **PostgreSQL** (https://www.postgresql.org/download/)
   - Windows: Download installer from postgresql.org
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

3. **Docker** (Optional but recommended for database)
   - https://www.docker.com/products/docker-desktop

## 🚀 Getting Started

### Option 1: Using Docker (Easiest)

```bash
cd backend-rust

# Start PostgreSQL in Docker
docker-compose up -d

# Copy environment variables
cp .env.example .env

# Build and run
cargo run
```

### Option 2: Manual PostgreSQL Setup

```bash
cd backend-rust

# 1. Create PostgreSQL database
createdb guard_firearm_system

# 2. Set up environment
cp .env.example .env

# 3. Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql://username:password@localhost:5432/guard_firearm_system
# GMAIL_USER=your_email@gmail.com
# GMAIL_PASSWORD=your_app_password

# 4. Run the backend
cargo run
```

### Configure Email (Optional)

For email verification to actually send emails:

1. Enable 2FA on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows/Linux/Mac"
4. Copy the generated app password
5. Paste it in `.env` as `GMAIL_PASSWORD`

**Note:** During development, verification codes are logged to console.

## 📁 Project Structure

```
backend-rust/
├── src/
│   ├── main.rs              # Entry point & router setup
│   ├── config.rs            # Configuration management
│   ├── db.rs                # Database setup & migrations
│   ├── error.rs             # Error handling
│   ├── models.rs            # Data structures
│   ├── utils.rs             # Utility functions
│   ├── routes.rs            # Route definitions
│   └── handlers/            # Endpoint implementations
│       ├── auth.rs
│       ├── users.rs
│       ├── firearms.rs
│       ├── firearm_allocation.rs
│       ├── guard_replacement.rs
│       └── health.rs
├── Cargo.toml              # Dependencies
├── .env.example            # Environment template
└── docker-compose.yml      # Docker database setup
```

## 🔧 Development

### Build
```bash
cargo build
```

### Run Development Server
```bash
cargo run
```

### Run with Live Reload
```bash
cargo install cargo-watch
cargo watch -q -c -w src/ -x 'run'
```

### Run Tests
```bash
cargo test
```

### Check for Issues
```bash
cargo check
cargo clippy
```

## 📊 Database

### Automatic Setup
- Migrations run automatically on startup
- Tables are created if they don't exist
- Your existing PostgreSQL data is preserved

### Manual Database Reset
```bash
# Drop everything and restart
dropdb guard_firearm_system
createdb guard_firearm_system

# Restart the server - migrations will rerun
cargo run
```

### Database Backup
```bash
pg_dump -U postgres guard_firearm_system > backup.sql

# Restore from backup
psql -U postgres guard_firearm_system < backup.sql
```

## 🌐 API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "Test123!",
    "username": "testuser",
    "role": "user",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "licenseNumber": "LIC123",
    "licenseExpiryDate": "2025-12-31T00:00:00Z"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@gmail.com",
    "password": "Test123!"
  }'
```

### Get All Users
```bash
curl http://localhost:5000/api/users
```

### Add Firearm
```bash
curl -X POST http://localhost:5000/api/firearms \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "SN123456",
    "model": "Glock 19",
    "caliber": "9mm"
  }'
```

## 🐛 Debugging

### Enable Debug Logging
```bash
RUST_LOG=debug cargo run
```

### Check What Port Backend is Running On
```bash
# The server prints this on startup:
# ✓ Server running on http://0.0.0.0:5000
```

### Monitor Database Connections
```bash
psql -U postgres guard_firearm_system
```

Then in psql:
```sql
SELECT pid, usename, application_name FROM pg_stat_activity;
```

## 🔌 Connecting Frontend

Your frontend works without changes! Just ensure it's pointing to the same URL:

```typescript
const API_URL = 'http://localhost:5000/api'

// Your existing code continues to work
const response = await fetch(`${API_URL}/users`)
const data = await response.json()
```

## 📈 Performance Tips

1. **Use release mode for benchmarking:**
   ```bash
   cargo run --release
   ```

2. **Monitor resource usage:**
   ```bash
   # macOS
   top -pid $(pgrep server)
   
   # Linux
   ps aux | grep server
   ```

3. **Connection pool is configured for:**
   - Max 5 connections
   - Adjustable in `src/db.rs`

## 🚨 Common Issues

### "connection refused"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`

### "Invalid admin code"
- Admin code must be: `122601`
- Use this code during registration for admin role

### "Port already in use"
- Change `SERVER_PORT` in `.env`
- Or kill the process using port 5000

### "Email not sending"
- Check Gmail credentials
- Verify app password is correct (not regular password)
- Check spam folder
- Gmail might need less secure app access enabled

### "Database migration failed"
- Ensure database exists: `createdb guard_firearm_system`
- Check PostgreSQL is running and accessible
- Verify `DATABASE_URL` format is correct

## 📚 Useful Resources

- [Axum Documentation](https://docs.rs/axum/latest/axum/)
- [SQLx Documentation](https://docs.rs/sqlx/latest/sqlx/)
- [Tokio Documentation](https://tokio.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)

## 📝 Environment Variables Reference

```
# Server
SERVER_HOST=0.0.0.0          # Listen on all interfaces
SERVER_PORT=5000             # Port to run on

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/guard_firearm_system

# Email
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_app_password

# Security
ADMIN_CODE=122601            # Code to register admin users
```

## 🎯 Next Steps

1. ✅ Install prerequisites
2. ✅ Clone/create `.env` from `.env.example`
3. ✅ Set up PostgreSQL
4. ✅ Run `cargo run`
5. ✅ Test endpoints with cURL
6. ✅ Connect your frontend
7. ✅ Deploy!

## 📞 Getting Help

1. Check the logs first: `RUST_LOG=info cargo run`
2. Verify all environment variables are set
3. Check PostgreSQL is running and accessible
4. Review error messages carefully - they're detailed!

---

**Happy coding!** Your Rust backend is production-ready and significantly more performant than the Node.js version.
