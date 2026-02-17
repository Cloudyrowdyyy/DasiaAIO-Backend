@echo off
REM Guard Firearm Management System - Rust Backend Setup Script
REM This script helps set up the development environment on Windows

setlocal enabledelayedexpansion
cls

echo ===============================================
echo Guard Firearm Management - Rust Backend Setup
echo ===============================================
echo.

REM Check if Rust is installed
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust is not installed!
    echo.
    echo Please install Rust from: https://rustup.rs/
    echo.
    echo After installation, restart this script.
    echo.
    pause
    exit /b 1
)

echo [OK] Rust is installed: 
cargo --version
echo.

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL is not found in PATH
    echo.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    echo Make sure to add PostgreSQL bin directory to your PATH
    echo.
    pause
    if not exist "C:\Program Files\PostgreSQL\*" (
        echo Only continue if PostgreSQL is already installed
        pause
    )
)

echo [OK] PostgreSQL check complete
echo.

REM Navigate to backend-rust
cd /d backend-rust
if errorlevel 1 (
    echo [ERROR] Could not find backend-rust directory
    echo Make sure you're in the project root directory
    pause
    exit /b 1
)

echo [OK] Navigated to backend-rust directory
echo.

REM Check for .env file
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] .env file created from .env.example
        echo.
        echo [IMPORTANT] Please edit .env with your settings:
        echo - DATABASE_URL: postgresql://postgres:password@localhost:5432/guard_firearm_system
        echo - GMAIL_USER: your_email@gmail.com (optional)
        echo - GMAIL_PASSWORD: your_app_password (optional)
        echo.
        echo Opening .env for editing...
        start notepad .env
        echo Waiting for you to edit the file...
        pause
    ) else (
        echo [ERROR] .env.example not found
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file already exists
    echo.
)

echo.
echo ===============================================
echo Setup Status
echo ===============================================
echo.
echo [OK] Rust installed
echo [OK] backend-rust directory found
echo [OK] .env file configured
echo.
echo Next steps:
echo 1. Ensure PostgreSQL is running
echo 2. Create database: createdb guard_firearm_system
echo 3. Run: cargo run
echo.
echo Optional: Use Docker for database
echo   docker-compose up -d
echo.
pause
