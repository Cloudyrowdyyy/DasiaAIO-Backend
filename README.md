# Davao Security & Investigation Agency - Firearm Management System

A comprehensive web and desktop application for managing firearm inventory, allocation, maintenance, and guard scheduling with role-based access control.

## Features

### Core Functionality
- **User Authentication**: Email-based registration and login with email verification
- **Role-Based Access Control**: Superadmin, Admin, and Guard roles with specialized dashboards
- **Firearm Inventory Management**: Add, edit, track firearm details, serial numbers, and status
- **Firearm Allocation**: Issue and return firearms with real-time allocation tracking
- **Guard Firearm Permits**: Manage and verify guard firearm permits
- **Maintenance Scheduling**: Track firearm maintenance history and schedule maintenance tasks
- **Attendance Tracking**: Monitor guard attendance and schedules
- **Performance Analytics**: View guard performance metrics and statistics
- **Guard Replacement System**: Automated shift management and guard replacement notifications
- **Alerts Center**: Centralized notification system for critical events

### User Experience
- **Two-Column Login**: Professional login interface with security branding
- **Responsive Design**: Works on desktop and web browsers
- **Real-Time Updates**: Immediate feedback on actions and status changes
- **Role-Specific Dashboards**: Customized interfaces for different user roles

## Technology Stack

- **Frontend**: React 18.2 + Vite 7.3.1
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Security**: bcryptjs password hashing, email verification
- **Email Service**: Nodemailer with Gmail SMTP
- **Desktop**: Electron (optional)
- **Styling**: CSS with responsive design

## Installation & Setup

### Prerequisites
- Node.js v18 or higher
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```
DB_NAME=login_app
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
PORT=5000
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
```

### Frontend Setup
```bash
npm install
```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```
Frontend runs on http://localhost:5173

Access the application at `http://localhost:5173/`

## Project Structure

```
├── src/                           # React frontend
│   ├── components/
│   │   ├── LoginPage.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── GuardDashboard.jsx
│   │   ├── SuperadminDashboard.jsx
│   │   ├── FirearmInventory.jsx
│   │   ├── FirearmAllocation.jsx
│   │   ├── GuardFirearmPermits.jsx
│   │   └── FirearmMaintenance.jsx
│   └── styles/
├── backend/                       # Express.js API
│   ├── server.js
│   ├── database/
│   │   └── config.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Firearm.js
│   │   ├── FirearmAllocation.js
│   │   └── ...
│   ├── routes/
│   └── package.json
├── public/
│   └── images/
├── package.json
└── vite.config.js
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
- Full firearm inventory management system
- Firearm allocation tracking with return management
- Guard permit management
- Firearm maintenance tracking
- Attendance management
- Performance analytics dashboard
- Guard replacement shift system
- Role-based access control (3 roles)
- Email notifications for critical events
- Responsive web interface

### What's Not Included
- Mobile app (web-responsive only)
- SMS/WhatsApp integration
- Integration with external security systems
- Advanced audit logging
- Multi-language support
- Third-party payment systems

## Limitations

### Current Limitations
- **Database**: Uses PostgreSQL (MongoDB version available but no longer maintained)
- **Authentication**: Email-based only (no OAuth/SSO)
- **Concurrency**: No real-time collaboration features
- **File Storage**: No external storage (Cloud) integration
- **Scalability**: Single-server deployment recommended for current setup
- **Browser Support**: Modern browsers only (Chrome, Firefox, Edge)
- **Offline Mode**: Web version requires internet connection
- **User Capacity**: Tested for up to 1000 concurrent users
- **Report Generation**: Limited to screen-based views (no PDF export initially)
- **Firearm Images**: Metadata only, no actual image storage

### Known Issues
- Large bulk operations (1000+ records) may take time
- Email verification may take 1-2 minutes in some cases
- Electron build requires Windows (native build required for macOS/Linux)

## Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- Email verification required for new accounts
- Role-based access control enforced on backend
- CORS enabled for frontend communication
- Environment variables for sensitive data

## Default Test Accounts

For development testing, use:
- **Test User**: test@gmail.com / test123

## Database Models

- **User**: Authentication and user information
- **Verification**: Email verification codes
- **Firearm**: Firearm inventory and details
- **FirearmAllocation**: Allocation history and tracking
- **GuardFirearmPermit**: Guard permit management
- **FirearmMaintenance**: Maintenance schedules and history
- **Attendance**: Guard attendance records
- **Feedback**: User feedback and reports
- **AllocationAlert**: Critical allocation alerts

## Support & Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill process on port 5000
Get-Process node | Stop-Process -Force
```

**Database Connection Error:**
- Verify PostgreSQL is running
- Check `.env` credentials
- Ensure database exists or auto-creation is enabled

**Email Verification Not Working:**
- Check Gmail credentials in `.env`
- Enable "Less secure app access" or use App Password
- Check email spam folder

## Future Enhancements

- Mobile app (React Native)
- Real-time notifications (WebSocket)
- PDF report generation
- Advanced analytics and dashboards
- Integration with GPS tracking
- Multi-branch support
- Blockchain for compliance tracking
