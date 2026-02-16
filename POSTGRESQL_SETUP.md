# PostgreSQL Migration Guide

## Prerequisites

You've successfully converted the application from MongoDB to PostgreSQL! Here's what you need to do:

### 1. Install PostgreSQL

**On Windows:**
- Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
- During installation:
  - Keep the default port (5432)
  - Set password for postgres user (or use "postgres" as shown in .env)
  - Remember to check "Install pgAdmin 4" for easy database management

**On Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**On Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create the Database

After installing PostgreSQL, create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE login_app;

# Exit
\q
```

### 3. Update .env File

The .env file has been updated with PostgreSQL settings:
```
DB_NAME=login_app
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

Change the password if you set a different one during PostgreSQL installation.

### 4. Restart Backend Server

The backend server will automatically create all tables on first run:

```bash
cd backend
npm start
```

Or with auto-reload:
```bash
cd backend
npm run dev
```

## What Changed

- **Database**: MongoDB → PostgreSQL
- **ORM**: Direct queries → Sequelize ORM
- **Data Models**: Located in `/backend/models/`
- **Database Config**: `/backend/database/config.js`

## Models Created

- User
- Verification
- Attendance
- Feedback
- Firearm
- FirearmAllocation
- GuardFirearmPermit
- FirearmMaintenance
- AllocationAlert

All relationships are automatically managed by Sequelize.

## Backup

Your old MongoDB-based server has been saved as `server-mongodb.js` in case you need to revert.

## Testing

Once running, visit: http://localhost:5000/api/health

Should return: `{ "status": "Server is running" }`

## Troubleshooting

**"Connection refused" error:**
- Make sure PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env

**"Database does not exist" error:**
- Make sure you created the `login_app` database

**Tables not created:**
- Tables are created automatically on first run
- Check the console for "Database synchronized" message
