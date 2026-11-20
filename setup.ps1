# ==============================================================================
# SecureMarks - Automated Windows Setup Script
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         SECUREMARKS SYSTEM SETUP                 " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Step 1: Install Python Dependencies
Write-Host "`n[1/4] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r backend\requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing Python packages." -ForegroundColor Red
    exit 1
}

# Step 2: Ensure PostgreSQL Cluster is Initialized
Write-Host "`n[2/4] Initializing PostgreSQL cluster..." -ForegroundColor Yellow
if (-not (Test-Path ".\pgsql_data")) {
    & ".\pgsql\bin\initdb.exe" -D ".\pgsql_data" -U postgres -A trust -E UTF8
}

# Start PostgreSQL server if not running
$pgRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "Starting local PostgreSQL daemon on port 5433..." -ForegroundColor Gray
    Start-Process -FilePath ".\pgsql\bin\postgres.exe" -ArgumentList "-D .\pgsql_data -p 5433" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Create database and user password
& ".\pgsql\bin\psql.exe" -U postgres -p 5433 -d postgres -c "CREATE DATABASE securemarks_db;" -ErrorAction SilentlyContinue
& ".\pgsql\bin\psql.exe" -U postgres -p 5433 -d securemarks_db -c "ALTER USER postgres WITH PASSWORD 'postgres'; CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Step 3: Run Database Migrations and Seed Data
Write-Host "`n[3/4] Migrating database schema and seeding fictional academic data..." -ForegroundColor Yellow
python scripts\setup_database.py

# Step 4: Install Frontend Node Dependencies
Write-Host "`n[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "   SECUREMARKS SETUP COMPLETED SUCCESSFULLY!      " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Run .\start.ps1 to launch backend and frontend servers." -ForegroundColor Cyan
