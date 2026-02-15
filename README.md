# Guard Firearm Allocation and Accountability Management System

A full-stack React + Node.js + Electron desktop application with user authentication backed by MongoDB.

## Features

- **User Management**: Role-based access control (Superadmin, Admin, Guard)
- **Firearm Inventory**: Add, edit, and manage firearm inventory
- **Firearm Allocation**: Issue and return firearms with tracking
- **Guard Permits**: Manage firearm permits for guards
- **Maintenance Tracking**: Schedule and track firearm maintenance
- **Performance Analytics**: View guard performance metrics
- **Desktop App**: Electron-based cross-platform desktop application

## Project Structure

```
├── src/                           # React frontend
│   ├── components/
│   │   ├── LoginPage.jsx
│   │   ├── SuperadminDashboard.jsx
│   │   ├── PerformanceDashboard.jsx
│   │   ├── FirearmInventory.jsx
│   │   ├── FirearmAllocation.jsx
│   │   ├── GuardFirearmPermits.jsx
│   │   └── FirearmMaintenance.jsx
│   ├── App.jsx
│   └── main.jsx
├── backend/                       # Node.js Express API
│   ├── server.js
│   ├── package.json
│   └── .env
├── electron.js                    # Electron main process
├── preload.js                     # Electron preload script
├── README.md
├── package.json
└── vite.config.js
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Running as Desktop App (Electron)

### 1. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 2. Set Up Backend
Create a `.env` file in the `backend` folder:
```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority
```

### 3. Start the App
```bash
# Development (runs Vite + Electron)
npm run dev

# Build for production
npm run build

# Run production build
npm run electron
```

The Electron app will automatically start with the development server.

## Running as Web Application

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

### 2. Start Frontend
```bash
npm run dev
```

Access at `http://localhost:5173/`

### 3. Configure `.env`
Create `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/login_db
PORT=5000
```

### 4. Start Backend Server
```bash
cd backend
npm start     # Runs on http://localhost:5000
npm run dev   # Dev mode with auto-reload
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create new user account |
| POST | `/api/login` | Authenticate user |
| GET | `/api/user/:id` | Get user profile |
| GET | `/api/health` | Server health check |

## Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Then open `http://localhost:5173/` and log in!

## Technologies

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Security**: bcryptjs password hashing
- **CORS**: Enabled for frontend communication
