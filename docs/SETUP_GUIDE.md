# SecureMarks — System Setup & Deployment Guide

This guide covers setting up, running, and testing **SecureMarks** locally on Windows.

---

## Prerequisites
- **Windows 10 / 11**
- **Python 3.10+** (Python 3.13 tested)
- **Node.js v18+** (v24 tested with npm 11+)
- **PowerShell 5.1+**

---

## Quick Launch via PowerShell Scripts

Three automated PowerShell helper scripts are included in the project root:

### 1. Initial Setup
Installs Python dependencies, extracts PostgreSQL binaries, initializes `securemarks_db`, and compiles frontend packages:
```powershell
.\setup.ps1
```

### 2. Start Application
Launches the PostgreSQL database server (port 5433), FastAPI backend daemon (port 8000), and Vite frontend server (port 5173):
```powershell
.\start.ps1
```

### 3. Run Automated Tests
Executes the comprehensive pytest test suite (13 test modules covering all 17 project requirements):
```powershell
.\test.ps1
```

---

## Manual Step-by-Step Instructions

### Step 1: Install Python Dependencies
```powershell
pip install -r backend\requirements.txt
```

### Step 2: Start PostgreSQL Database Server
Ensure the portable PostgreSQL server is running on port 5433:
```powershell
& ".\pgsql\bin\postgres.exe" -D ".\pgsql_data" -p 5433
```

### Step 3: Initialize Database Schema & Seed Data
Execute the Python database migration script:
```powershell
python scripts\setup_database.py
```

### Step 4: Run Independent Python Ledger Verification
Verify the cryptographic hash chain from the terminal:
```powershell
$env:PYTHONPATH = "backend"
python -m app.services.verify_ledger
```

### Step 5: Start FastAPI Backend
```powershell
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend API will be accessible at `http://localhost:8000`.  
Swagger documentation is available at `http://localhost:8000/docs`.

### Step 6: Start React Frontend
In a separate terminal:
```powershell
cd frontend
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## Seed Accounts & Default Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Alan Turing | `admin@securemarks.edu` | `Admin@123` |
| **Faculty (CSE)** | Prof. Priya Sharma | `faculty.sharma@securemarks.edu` | `Faculty@123` |
| **Faculty (IT)** | Prof. Rajesh Verma | `faculty.verma@securemarks.edu` | `Faculty@123` |
| **Student** | Aarav Patel | `aarav.patel@student.securemarks.edu` | `Student@123` |
| **Student** | Diya Nair | `diya.nair@student.securemarks.edu` | `Student@123` |

---

## Troubleshooting

### Port 5433 or 8000 Already in Use
Check running processes on the port:
```powershell
Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

### Resetting to Clean Genesis State
To re-initialize the ledger with clean seed data:
```powershell
python scripts\setup_database.py
```
