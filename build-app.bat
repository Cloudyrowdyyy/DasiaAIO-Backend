@echo off
REM Guard Firearm Management System - Build for Production
echo.
echo ====================================
echo Building Production App
echo ====================================
echo.
echo This will create an installer for Windows
echo.
pause
call npm run build
echo.
echo Build complete! Installer will be in the 'dist' folder
echo.
pause
