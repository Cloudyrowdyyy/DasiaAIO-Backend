#!/usr/bin/env powershell

# Check Rust
Write-Host "Checking Rust..." -ForegroundColor Green
cargo --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Rust not in PATH. Please restart PowerShell." -ForegroundColor Red
    exit 1
}

# Navigate to backend-rust
Set-Location "$PSScriptRoot"
Write-Host "Building Rust backend..." -ForegroundColor Green

# Build
cargo build --release

Write-Host "`nBuild complete!" -ForegroundColor Green
Write-Host "To run the server, use: cargo run --release" -ForegroundColor Cyan
