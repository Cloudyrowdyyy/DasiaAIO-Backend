# Guard Firearm Management System

A comprehensive full-stack application for managing firearm inventory, allocation, maintenance, and guard scheduling with role-based access control.

## 🎯 Overview

This system provides a professional solution for security agencies to manage guard firearm operations, including real-time inventory tracking, automated shift management, and comprehensive audit trails.

## ✨ Features

### Core Functionality
- **User Authentication**: Email-based registration and login with email verification
- **Role-Based Access Control**: Admin and Guard roles with specialized dashboards
- **Firearm Inventory Management**: Add, edit, track firearm details, serial numbers, and status
- **Firearm Allocation**: Issue and return firearms with real-time allocation tracking
- **Guard Firearm Permits**: Manage and verify guard firearm permits
- **Firearm Maintenance**: Track firearm maintenance history and schedule maintenance
- **Attendance Tracking**: Monitor guard attendance with check-in/check-out
- **Guard Replacement System**: Automated shift management and replacement requests
- **Alerts Center**: Real-time notifications for critical events

### User Experience
- **Professional Dashboard**: Role-specific admin and guard dashboards
- **Responsive Design**: Works on desktop and web browsers
- **Real-Time Updates**: Immediate feedback on actions and status changes
- **Intuitive Interface**: Simple and efficient user workflows

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 7.3.1
- **Language**: TypeScript 5.x
- **Styling**: CSS3

### Backend
- **Framework**: Rust with Axum 0.7 web framework
- **Runtime**: Tokio async runtime
- **ORM**: SQLx 0.7 (runtime type checking)
- **Authentication**: bcrypt password hashing + email verification
- **Deployment**: Docker containerization

### Database
- **System**: PostgreSQL 15
- **Deployment**: Docker container
- **Migrations**: Automatic on startup

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Port Configuration**:
  - Frontend: `http://localhost:5173` (dev)
  - Backend API: `http://localhost:5000`
  - Database: `localhost:5432`

## 📋 Installation & Setup

### Prerequisites
- **Docker** and **Docker Compose**
- Git
- Node.js v18+ (for frontend development)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd "Capstone 1.0"
```

2. **Start all services**
```bash
cd backend-rust
docker-compose up -d
```

This will automatically:
- Start PostgreSQL database on port 5432
- Build and start Rust backend on port 5000
- Run database migrations
- Initialize default configuration

3. **Start frontend development server**
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Verify Setup

**Check backend health:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok"}
```

## 🔐 Default Admin Account

Use these credentials to log in as admin:
- **Email**: dkgagaamain@gmail.com
- **Password**: december262001

## 📁 Project Structure

```
├── backend-rust/              # Rust backend
│   ├── src/
│   │   ├── main.rs           # Router and app entry point
│   │   ├── handlers/         # API endpoint handlers
│   │   ├── models.rs         # Data structures
│   │   ├── db.rs             # Database setup
│   │   ├── config.rs         # Configuration
│   │   └── error.rs          # Error handling
│   ├── Cargo.toml            # Rust dependencies
│   ├── Dockerfile            # Docker build config
│   └── docker-compose.yml    # Service orchestration
│
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── styles/           # CSS styling
│   │   └── main.tsx          # Entry point
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript config
│
└── README.md                 # This file
```

## 🚀 API Endpoints

### Authentication
- `POST /api/register` - Register new user (requires admin_code for admin role)
- `POST /api/login` - User login
- `POST /api/verify` - Verify email with confirmation code
- `POST /api/resend-code` - Resend verification code

### Users
- `GET /api/users` - Get all users
- `GET /api/user/:id` - Get user by ID
- `PUT /api/user/:id` - Update user
- `DELETE /api/user/:id` - Delete user

### Firearms
- `POST /api/firearms` - Add new firearm
- `GET /api/firearms` - Get all firearms
- `GET /api/firearms/:id` - Get firearm by ID
- `PUT /api/firearms/:id` - Update firearm
- `DELETE /api/firearms/:id` - Delete firearm

### Firearm Allocation
- `POST /api/firearm-allocation/issue` - Issue firearm to guard
- `POST /api/firearm-allocation/return` - Return firearm
- `GET /api/guard-allocations/:guard_id` - Get guard's firearms
- `GET /api/firearm-allocations/active` - Get active allocations

### Guard Management
- `POST /api/guard-replacement/shifts` - Create shift
- `POST /api/guard-replacement/attendance/check-in` - Check in guard
- `POST /api/guard-replacement/attendance/check-out` - Check out guard
- `POST /api/guard-replacement/detect-no-shows` - Detect no-shows
- `POST /api/guard-replacement/request-replacement` - Request replacement guard
- `POST /api/guard-replacement/set-availability` - Set guard availability

### Health Check
- `GET /api/health` - API health status

## 🔧 Environment Configuration

Backend configuration via `backend-rust/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/guard_firearm_system
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
ADMIN_CODE=122601
RUST_LOG=info
```

## 📝 Creating Admin Accounts

To create a new admin account, use the registration endpoint with:
```json
{
  "email": "admin@example.com",
  "username": "admin_username",
  "password": "secure_password",
  "full_name": "Admin Name",
  "phone_number": "phone_number",
  "role": "admin",
  "admin_code": "122601"
}
```

The `admin_code` is required and defaults to `122601`.

## 🐳 Docker Commands

### View running containers
```bash
cd backend-rust
docker-compose ps
```

### View backend logs
```bash
docker-compose logs backend --tail 50
```

### Restart services
```bash
docker-compose restart
```

### Stop all services
```bash
docker-compose down
```

### Rebuild containers
```bash
docker-compose build --no-cache
```

## 📚 Database Schema

The system automatically creates the following tables on startup:
- `users` - User accounts and authentication
- `verifications` - Email verification codes
- `firearms` - Firearm inventory
- `firearm_allocations` - Allocation tracking
- `guard_firearm_permits` - Guard permits
- `firearm_maintenance` - Maintenance records
- `attendance` - Guard attendance logs
- `shifts` - Shift schedules
- `allocation_alerts` - System alerts

## 🧪 Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend-rust
cargo build
cargo run
```

### Running Tests
```bash
# Backend
cargo test

# Frontend
npm test
```

## 🐛 Troubleshooting

### Backend Connection Error
1. Verify PostgreSQL is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Restart services: `docker-compose restart`

### Frontend Can't Connect to Backend
1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check CORS configuration in backend
3. Verify correct port (5000) in frontend API calls

### Database Migration Issues
1. Check backend logs: `docker-compose logs backend`
2. Verify database credentials in `.env`
3. Reset database: `docker-compose down -v && docker-compose up -d`

## 📄 License

This project is confidential and for authorized use only.

## 👥 Support

For issues or questions, please contact the development team.
