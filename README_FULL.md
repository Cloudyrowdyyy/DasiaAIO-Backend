# DASIA AIO Management System

> **Comprehensive Asset Management & Operations Platform**

A modern, full-stack web application designed to streamline asset allocation, inventory management, and scheduling operations. Built with React, TypeScript, Rust, and PostgreSQL for performance, reliability, and scalability.

---

## 🚀 Features

### Core Modules

- **📦 Firearm Inventory Management** - Track, organize, and manage firearm assets with detailed specifications
- **🎯 Firearm Allocation System** - Assign and track firearm distribution to authorized personnel
- **🔧 Maintenance Tracking** - Schedule and monitor regular maintenance logs
- **📋 Guard Permitting** - Manage guard firearm permits with expiration tracking
- **👤 User Management** - Role-based access control (Admin, Superadmin, Guard, User)
- **📅 Guard Scheduling** - Coordinate shifts and staffing assignments
- **📊 Performance Analytics** - Real-time dashboards with metrics and insights
- **🔔 Alerts & Notifications** - Real-time alerts for critical events

### Technical Highlights

- **React 18** - Modern UI with TypeScript for type safety
- **Rust Backend** (Axum) - High-performance API server
- **PostgreSQL** - Reliable, scalable database
- **Email Verification** - Secure user registration with email validation
- **Real-time Sync** - Live data updates across dashboards
- **Responsive Design** - Works seamlessly on desktop and mobile

---

## 📋 Prerequisites

- **Node.js** 20+ (for frontend)
- **Rust** 1.70+ (for backend)
- **PostgreSQL** 13+ (database)
- **Git** (version control)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Cloudyrowdyyy/capstone-1.0.git
cd capstone-1.0
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Runs at http://localhost:5173
```

### 3. Backend Setup
```bash
cd backend-rust

# Create .env file with database URL
echo "DATABASE_URL=postgresql://user:password@localhost:5432/guard_firearm_system" > .env
echo "ADMIN_CODE=122601" >> .env

# Run migrations and start server
cargo run
# Runs at http://localhost:5000
```

### 4. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE guard_firearm_system;"

# Migrations run automatically on backend startup
```

---

## 🚀 Deployment

### Railway (Recommended for Free Tier)

The project is configured for one-click deployment on Railway:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Select GitHub repository
   - Add PostgreSQL, Backend (Rust), and Frontend (React) services
   - Set environment variables (see `RAILWAY_QUICK_START.md`)

3. **Live URL**
   - Frontend: `https://your-project.railway.app`
   - Backend API: `https://your-backend.railway.app`

See `RAILWAY_QUICK_START.md` and `RAILWAY_DEPLOYMENT.md` for detailed instructions.

---

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Superadmin** | Full system access, user management, all dashboards |
| **Admin** | Inventory management, allocations, permits, maintenance |
| **Guard** | View personal assignments, request replacements, check schedule |
| **User** | View attendance, personal performance metrics |

---

## 📚 Project Structure

```
capstone-1.0/
├── src/                        # Frontend (React + TypeScript)
│   ├── components/            # UI components
│   ├── styles/               # CSS styling
│   └── config.ts             # API configuration
├── backend-rust/             # Backend (Rust + Axum)
│   ├── src/
│   │   ├── handlers/         # API route handlers
│   │   ├── models.rs         # Data models
│   │   ├── db.rs             # Database logic
│   │   └── main.rs           # Server entry point
│   └── Cargo.toml            # Rust dependencies
├── Dockerfile                # Frontend containerization
├── railway.json              # Railway deployment config
└── README.md                 # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/verify` - Email verification
- `POST /api/resend-code` - Resend verification code

### Users
- `GET /api/users` - Get all users
- `GET /api/user/:id` - Get user details
- `PUT /api/user/:id` - Update user
- `DELETE /api/user/:id` - Delete user

### Firearms
- `GET /api/firearms` - List all firearms
- `POST /api/firearms` - Add firearm
- `PUT /api/firearms/:id` - Update firearm
- `DELETE /api/firearms/:id` - Delete firearm

### Operations
- `POST /api/firearm-allocation/issue` - Issue firearm
- `POST /api/firearm-allocation/return` - Return firearm
- `GET /api/firearm-allocations/active` - Get active allocations
- `POST /api/firearm-maintenance` - Log maintenance
- `POST /api/guard-replacement/shifts` - Create shift

See `DOCUMENTATION.md` for complete API reference.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 📊 Example Login Credentials

Check `TEST_ACCOUNTS.md` for test account credentials.

---

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check `DATABASE_URL` environment variable
- Verify database exists: `psql -U postgres -l | grep guard_firearm`

### Frontend can't reach backend
- Check `VITE_API_URL` in `src/config.ts`
- Verify backend is running on port 5000
- Check browser console for CORS errors

### Database connection fails
- Verify PostgreSQL credentials
- Test connection: `psql postgresql://user:pass@localhost/guard_firearm_system`

---

## 📖 Documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Comprehensive technical documentation
- **[RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)** - Railway deployment guide
- **[DEPLOYMENT_CONFIG_SUMMARY.md](DEPLOYMENT_CONFIG_SUMMARY.md)** - Architecture overview

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary software. Unauthorized copying prohibited.

---

## 👥 Team

- **Frontend**: React/TypeScript development
- **Backend**: Rust/Axum API server
- **Database**: PostgreSQL management

---

## 📞 Support

For issues or questions:
1. Check [DOCUMENTATION.md](DOCUMENTATION.md)
2. Review error logs in Railway dashboard
3. Check browser developer console (F12)

---

## 🔗 Live Demo

**Production**: [https://dasiaaio.up.railway.app](https://dasiaaio.up.railway.app)

---

**Last Updated**: February 17, 2026  
**Status**: ✅ Active & Maintained
