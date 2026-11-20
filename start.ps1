# ==============================================================================
# SecureMarks - Application Startup Script (Windows PowerShell)
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         STARTING SECUREMARKS SYSTEM              " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start PostgreSQL server if not already running
$pgRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "Starting PostgreSQL Server on port 5433..." -ForegroundColor Gray
    Start-Process -FilePath ".\pgsql\bin\postgres.exe" -ArgumentList "-D .\pgsql_data -p 5433" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "PostgreSQL Server is already running on port 5433." -ForegroundColor Green
}

# 2. Start FastAPI Backend Server
Write-Host "Starting FastAPI Backend Server on http://localhost:8000..." -ForegroundColor Gray
$env:PYTHONPATH = "backend"
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WindowStyle Normal

# 3. Start React Frontend Server
Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Gray
Set-Location frontend
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Normal
Set-Location ..

Start-Sleep -Seconds 2

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "   SECUREMARKS SERVICES LAUNCHED SUCCESSFULLY!    " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Frontend URL:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "Swagger Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "PostgreSQL:    localhost:5433 (securemarks_db)" -ForegroundColor Cyan
