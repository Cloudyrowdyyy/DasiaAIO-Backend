---
layout: default
title: Documentation
---

# Documentation

## Architecture Overview

```
Frontend (React)         Backend (Rust)          Database (PostgreSQL)
├── User Interface       ├── API Server          ├── Users
├── API Client          ├── Business Logic       ├── Firearms
└── State Mgmt          └── Authentication       └── Allocations
```

---

## 🔐 User Roles

| Role | Permissions |
|------|------------|
| **Superadmin** | Full system access, user management |
| **Admin** | Inventory, allocations, permits, maintenance |
| **Guard** | View assignments, request replacements |
| **User** | View attendance, personal metrics |

---

## 📦 Core Modules

### Firearm Inventory Management
Track and manage firearm assets with detailed specifications.
- Add/edit/delete firearms
- Serial number tracking
- Status management (available, in-use, maintenance)

### Firearm Allocation System
Assign and track firearm distribution to authorized personnel.
- Issue firearms to guards
- Return firearms with tracking
- Active allocation dashboard

### Maintenance Tracking
Schedule and monitor regular maintenance logs.
- Log maintenance events
- Track maintenance history
- Schedule future maintenance

### Guard Permitting
Manage guard firearm permits with expiration tracking.
- Create permits
- Track expiry dates
- Alert on expiring permits

### Performance Analytics
Real-time dashboards with metrics and insights.
- Attendance rates
- Allocation statistics
- Performance metrics

---

## Troubleshooting

### Backend won't start
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` environment variable
3. Verify database exists

### Frontend can't reach backend
1. Check `VITE_API_URL` in config
2. Verify backend is running on port 5000
3. Check browser console (F12) for CORS errors

---

[← Back to Home](/)
