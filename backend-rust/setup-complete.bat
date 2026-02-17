@echo off
REM Complete setup script for Rust backend on Windows
REM Run this AFTER restarting PowerShell to reset PATH

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================
echo Rust Backend Setup Script
echo ============================================
echo.

REM Check Rust
echo [1/3] Checking Rust installation...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust not found in PATH
    echo Please restart PowerShell completely (close and reopen)
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('cargo --version') do echo ✓ %%i
echo.

REM Build backend
echo [2/3] Building Rust backend (this may take 2-5 minutes first time)...
echo Downloading dependencies and compiling...
echo.
cargo build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Build successful!
echo.

REM PostgreSQL check
echo [3/3] Checking PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ PostgreSQL not found in PATH
    echo.
    echo To complete setup, you need PostgreSQL:
    echo.
    echo Option A: Install via Windows Package Manager
    echo   winget install PostgreSQL.PostgreSQL
    echo.
    echo Option B: Download from
    echo   https://www.postgresql.org/download/windows/
    echo.
    echo After installing PostgreSQL:
    echo 1. Restart PowerShell
    echo 2. Run: createdb guard_firearm_system
    echo 3. Run: cargo run
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('psql --version') do echo ✓ %%i
echo.

REM Create database
echo Creating database...
createdb guard_firearm_system 2>nul
if errorlevel 1 (
    psql -U postgres -c "CREATE DATABASE guard_firearm_system" 2>nul
    if errorlevel 1 (
        echo ⚠ Could not create database
        echo Try manually: createdb guard_firearm_system
    ) else (
        echo ✓ Database created
    )
) else (
    echo ✓ Database created
)
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo To run the backend:
echo   cargo run
echo.
echo To run with release optimizations:
echo   cargo run --release
echo.
echo Server will start on http://localhost:5000
echo.

pause
