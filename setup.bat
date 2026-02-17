@echo off
REM Guard Firearm Management System - Start Script
echo.
echo ====================================
echo Guard Firearm Management System
echo ====================================
echo.
echo Installing dependencies...
call npm install
cd backend
call npm install
cd ..

echo.
echo Dependencies installed!
echo.
echo To start the application:
echo   Development Mode: npm run dev
echo   Production Build: npm run build
echo.
pause
