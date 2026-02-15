# DASIA AIO Management System

A full-stack React + Node.js application with user authentication backed by MongoDB.

## Project Structure

```
├── src/                    # React frontend
│   ├── components/
│   │   └── LoginPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── backend/               # Node.js Express API
│   ├── server.js
│   ├── package.json
│   └── .env
├── README.md
├── package.json
└── vite.config.js
```

## Frontend (Already Running)

The React app runs at `http://localhost:5173/`

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. MongoDB Setup

**Option A: MongoDB Atlas (Recommended - Free Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster
3. Copy your connection string

**Option B: Local MongoDB**
1. Install from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Connection string: `mongodb://localhost:27017`

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
