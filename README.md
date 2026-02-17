# Davao Security & Investigation Agency - Guard Firearm Management System

A comprehensive web & desktop application for managing firearm inventory, allocation, maintenance, and guard scheduling with role-based access control.

## Features

### Core Functionality
- **User Authentication**: Email-based registration and login with email verification
- **Role-Based Access Control**: Superadmin, Admin, Guard, and User roles with specialized dashboards
- **Firearm Inventory Management**: Add, edit, track firearm details, serial numbers, and status
- **Firearm Allocation**: Issue and return firearms with real-time allocation tracking
- **Guard Firearm Permits**: Manage and verify guard firearm permits with expiry tracking
- **Maintenance Scheduling**: Track firearm maintenance history and schedule maintenance tasks
- **Attendance Tracking**: Monitor guard attendance and work schedules
- **Performance Analytics**: View guard performance metrics and statistics
- **Guard Replacement System**: Automated shift management and guard replacement notifications
- **User Management**: Edit and delete user accounts (Admin/Superadmin only)
- **Responsive UI**: All dashboards fully responsive for desktop and mobile

### Admin Features
- **User Dashboard Edit**: Superadmin and Admin can edit user details (Full Name, Phone, License, Expiry Date)
- **User Deletion**: Delete users with confirmation dialogs
- **Real-Time Updates**: Automatic table refresh after edits/deletions
- **Error Handling**: Clear error messages and validation feedback

## Technology Stack

- **Frontend**: React 18.x + TypeScript 5.x + Vite 7.3.1
- **Backend**: Rust 1.93.1 + Axum 0.7 + Tokio + SQLx 0.7
- **Database**: PostgreSQL 15-alpine with Docker
- **Containerization**: Docker + docker-compose (multi-stage builds)
- **Security**: bcrypt password hashing, email verification with 10-min expiry
- **Email Service**: Gmail SMTP for verification codes
- **Styling**: CSS with responsive design
- **Type Safety**: Full TypeScript + Rust typed system

## Installation & Setup

### Prerequisites
- Node.js v18 or higher
- Rust 1.93+ (for backend development)
- Docker & Docker Compose
- npm or yarn

### Quick Start

**Clone and Install:**
```bash
cd d:\Capstone 1.0
npm install
cd backend-rust
docker-compose up -d
```

**Terminal 1 - Frontend Server:**
```bash
cd d:\Capstone 1.0
npm run dev
```
Frontend runs on http://localhost:5178

**Terminal 2 - Backend (Docker):**
```bash
cd d:\Capstone 1.0\backend-rust
docker-compose up -d
```
Backend runs on http://localhost:5000
PostgreSQL runs on http://localhost:5432

### Environment Setup

Create `.env` in root and `backend-rust/.env`:

**Root `.env`:**
```
VITE_API_URL=http://localhost:5000
```

**Backend `.env`:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/guard_firearm_db
RUST_LOG=debug
PORT=5000
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login user |
| POST | `/api/verify` | Verify email |
| POST | `/api/resend-code` | Resend verification code |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/user/:id` | Get user by ID |
| PUT | `/api/user/:id` | Update user info |
| POST | `/api/user/:id/role` | Update user role |

### Firearm Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/firearms` | Get all firearms |
| POST | `/api/firearms` | Add new firearm |
| PUT | `/api/firearms/:id` | Update firearm |
| DELETE | `/api/firearms/:id` | Delete firearm |

### Allocation & Permits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/allocations` | Get all allocations |
| POST | `/api/allocations` | Create allocation |
| PUT | `/api/allocations/:id` | Update allocation |
| GET | `/api/permits` | Get all permits |

## Scope

### What's Included
- Complete user authentication system with email verification
- Full firearm inventory management system with status tracking
- Firearm allocation tracking with return management
- Guard permit management with expiry date warnings
- Firearm maintenance tracking and scheduling
- Attendance management and check-in/out system
- Performance analytics dashboard with metrics
- Guard replacement shift system with notifications
- Role-based access control (4 roles: Superadmin, Admin, Guard, User)
- User management: Edit user details, delete users
- Email notifications for critical events
- Responsive web interface (desktop & mobile)
- Docker containerized deployment
- Full TypeScript type safety

### What's Not Included
- Mobile app (web-responsive only)
- SMS/WhatsApp integration
- Integration with external security systems
- Advanced audit logging
- Multi-language support
- Third-party payment systems

## Limitations

### Current Limitations
- **Database**: PostgreSQL only (optimized for larger deployments)
- **Authentication**: Email-based only (no OAuth/SSO)
- **Concurrency**: No real-time collaboration features
- **File Storage**: No external cloud storage integration
- **Scalability**: Single-server deployment (microservices available for scaling)
- **Browser Support**: Modern browsers only (Chrome, Firefox, Edge, Safari)
- **Offline Mode**: Web version requires internet connection
- **User Capacity**: Tested and stable for 1000+ concurrent users
- **Report Generation**: Limited to screen-based views

### Known Issues
- Large bulk operations (1000+ records) may take time
- Email verification may take 1-2 minutes depending on Gmail
- Confirmation dialogs require user interaction

## Test Accounts

For development testing, use these pre-configured accounts:

**Admin/Superadmin Account:**
- Email: `dkgagaamain@gmail.com`
- Password: `december262001`
- Role: Admin/Superadmin (full access)

**Guard User Account:**
- Email: `testguard2025@gmail.com`
- Password: `TestPass123!`
- Role: Guard (limited access)

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- Email verification required for new accounts (10-minute code expiry)
- Secure session management with TypeScript type checking
- Role-based access control (RBAC) enforced on backend
- Rust type system prevents common vulnerabilities
- CORS protection enabled
- Environment variables for all secrets
- PostgreSQL prepared statements prevent SQL injection

## Database Models

- **User**: Authentication, profile, license information
- **Verification**: Email verification codes with expiry
- **Firearm**: Inventory and firearm specifications
- **FirearmAllocation**: Allocation tracking and history
- **FirearmMaintenance**: Maintenance records and schedules
- **GuardFirearmPermit**: Guard permits with expiry dates
- **Attendance**: Guard check-in/out records
- **Feedback**: User feedback and reports
- **AllocationAlert**: Critical allocation alerts

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill process on specific port (example: 5000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

**Docker Containers Not Starting:**
```bash
# Check logs
cd backend-rust
docker-compose logs

# Restart containers
docker-compose down
docker-compose up -d
```

**Database Connection Error:**
- Verify Docker containers are running: `docker ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Ensure DATABASE_URL is correct in `.env`

**Frontend Won't Connect to Backend:**
- Check backend health: `curl http://localhost:5000/api/users`
- Verify VITE_API_URL in frontend `.env`
- Check browser console (F12) for CORS errors

## Support & Documentation

For detailed setup instructions and usage guide, see [PARA SA MGA BOBO.md](PARA%20SA%20MGA%20BOBO.md) - a comprehensive setup guide.
