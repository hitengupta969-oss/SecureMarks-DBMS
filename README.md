# SecureMarks — Tamper-Evident Marks Register Using Hash-Chained Ledger Database

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.6%20%2B%20pgcrypto-blue?logo=postgresql)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%20%2B%20TypeScript-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/pytest-13%20Passed%20(100%25)-brightgreen?logo=pytest)](https://docs.pytest.org/)
[![Hardware](https://img.shields.io/badge/ESP32-Arduino%20C%2B%2B%20IoT-E7352C?logo=espressif)](https://www.espressif.com/)

> **Academic Topic 11:** Tamper-Evident Marks Register  
> **Central Research Question:** *"Can tamper-evident ledgers replace audit logs in a DBMS?"*  
> **Tagline:** *"Academic Integrity Through Cryptographic Verification"*

---

## 1. Project Background & Overview

Traditional relational database audit logs capture events in standard mutable tables that are vulnerable to silent manipulation by database administrators (DBAs) or compromised application credentials.

**SecureMarks** demonstrates how a centralized relational database (**PostgreSQL**) can use cryptographic hash chaining (**pgcrypto SHA-256**) and SQL triggers to detect unauthorized modifications to student marks without needing an energy-intensive public blockchain.

### Key Capabilities
1. **Trigger-Automated Hash-Chaining:** PostgreSQL `BEFORE INSERT` triggers serialize insertions via `SELECT FOR UPDATE`, calculate deterministic canonical payloads, and seal each record with a SHA-256 digest referencing the preceding block's hash.
2. **Intentional Absence of Update Triggers:** If an attacker executes a direct SQL `UPDATE marks_ledger SET marks = 99 ...`, the stored hash remains frozen at its original value.
3. **Independent Python Verification:** A dedicated verification module (`python -m app.services.verify_ledger`) recalculates SHA-256 hashes using Python's `hashlib` and validates 5 mathematical integrity checks.
4. **Physical & Simulated Hardware Terminal:** An ESP32 DevKit featuring an SSD1306 0.96" OLED display, 4x4 matrix keypad, green/red status LEDs, and active buzzer sounds real-time acoustic alarms upon tamper detection.
5. **Modern Cybersecurity Web Application:** A dark navy & slate enterprise dashboard featuring real database analytics, interactive hash chain explorer, grade distribution charts, and a one-click tampering demonstration lab.

---

## 2. System Architecture

```
React 18 Frontend (Vite + Tailwind)
        |
        | HTTP REST API (/api)
        v
Python FastAPI Backend
        |
        | psycopg3 connection pool
        v
PostgreSQL 16 Database (securemarks_db)
        |
        | SQL Trigger (trg_marks_ledger_append)
        v
pgcrypto Extension (SHA-256)
        |
        | Linear Block Chaining (previous_hash -> current_hash)
        v
Hash-Chained Marks Ledger (marks_ledger)
        |
        | Independent Verification Query
        v
Python Verification Engine (hashlib)
        |
        +-----------------------------------+
        |                                   |
React Web Alert Banner             ESP32 Smart Terminal
(Red Warning & Diff Modal)        (OLED + Red LED + Buzzer)
```

---

## 3. Technology Stack

- **Database:** PostgreSQL 16.6, `pgcrypto` extension, PL/pgSQL functions & triggers, pessimistic concurrency locks (`SELECT FOR UPDATE`), SQL views (`v_effective_marks`).
- **Backend:** Python 3.13, FastAPI, `psycopg` (v3), Pydantic v2, PyJWT, salted PBKDF2 password hashing.
- **Verification Engine:** Python `hashlib` (SHA-256), deterministic canonical payload normalizer.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts data visualization.
- **Hardware IoT Model:** ESP32-WROOM-32, 0.96" SSD1306 OLED (I2C), 4x4 matrix keypad, status LEDs (Green/Red), active buzzer, Arduino C++ firmware, and in-browser interactive simulator with Web Audio API synthesizer.

---

## 4. Quick Start (Windows PowerShell)

Ensure PostgreSQL server is running on port 5433 (or run `.\setup.ps1`):

### 1. Launch All Services
```powershell
.\start.ps1
```

This launches:
- **Web Application:** `http://localhost:5173`
- **FastAPI Backend:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5433` (`securemarks_db`)

### 2. Run Automated Pytest Suite
```powershell
.\test.ps1
```
*(Executes 13 comprehensive tests covering all 17 project requirements; all 13 tests pass in < 3 seconds)*

---

## 5. Development Seed Accounts & Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Alan Turing | `admin@securemarks.edu` | `Admin@123` |
| **Faculty (CSE)** | Prof. Priya Sharma | `faculty.sharma@securemarks.edu` | `Faculty@123` |
| **Faculty (IT)** | Prof. Rajesh Verma | `faculty.verma@securemarks.edu` | `Faculty@123` |
| **Student** | Aarav Patel | `aarav.patel@student.securemarks.edu` | `Student@123` |
| **Student** | Diya Nair | `diya.nair@student.securemarks.edu` | `Student@123` |

*(The web interface includes **One-Click Demo Role** buttons on the Login page and in the top navigation bar)*

---

## 6. Automated Tampering Experiment & Demonstration

### Run via Command-Line Demo Script
```powershell
python scripts\run_demo.py
```

### Run Manually via SQL & Terminal Verifier
1. Verify the clean ledger:
   ```powershell
   $env:PYTHONPATH = "backend"
   python -m app.services.verify_ledger
   ```
   **Output:**
   ```
   LEDGER VERIFICATION REPORT
   --------------------------
   Total Records: 10
   Valid Records: 10
   Invalid Records: 0
   Status: VALID
   Summary: LEDGER VALID: All 10 records cryptographically verified across SHA-256 chain.
   ```

2. Simulate an insider altering marks in PostgreSQL directly:
   ```sql
   UPDATE marks_ledger SET marks = 99.50 WHERE sequence_no = 1;
   ```

3. Re-run verification:
   ```powershell
   python -m app.services.verify_ledger
   ```
   **Output:**
   ```
   LEDGER VERIFICATION REPORT
   --------------------------
   Total Records: 10
   Valid Records: 9
   Invalid Records: 1
   Status: TAMPERING_DETECTED
   Summary: CRITICAL: Unauthorized modification detected! 1 record(s) compromised.
   
   TAMPERING / INTEGRITY VIOLATION DETAILS:
   -> Sequence #1 | Student: CS2023001 (Aarav Patel)
      [!] Tampering detected: Stored hash payload differs from live column values.
   ```

---

## 7. Project Structure

```
DBMS Project/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, students, marks, ledger, device, demo)
│   │   ├── core/            # Config, database connections, security helpers
│   │   ├── schemas/         # Pydantic request/response validation schemas
│   │   ├── services/        # Cryptographic verification engine (verify_ledger)
│   │   └── main.py          # Application entrypoint & middleware
│   ├── sql/
│   │   ├── schema.sql       # 3NF schema, pgcrypto extension, constraints, indexes
│   │   ├── functions.sql    # Canonical payload generator & SHA-256 wrapper
│   │   ├── triggers.sql     # BEFORE INSERT trigger & delete prevention rules
│   │   ├── views.sql        # v_effective_marks view with DISTINCT ON
│   │   └── seed.sql         # Initial users, 12 students, subjects, exams, ledger
│   ├── tests/               # 13 pytest tests covering all 17 requirements
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      # HashBadge, ChainVisualizer, AlertBanner, StatusBadge, Navbar
│   │   ├── pages/           # 10 pages: Landing, Login, Dashboard, Students, Entry, Register,
│   │   │                    # Ledger Explorer, Verification, Hardware, Research Article
│   │   ├── services/        # Typed API client with JWT bearer interceptors
│   │   ├── hooks/           # useAuth authentication context provider
│   │   └── types/           # TypeScript data interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── hardware/
│   ├── esp32_firmware/      # Arduino C++ firmware for ESP32 DevKit
│   ├── simulator/           # Python & Web interactive hardware simulators
│   └── documentation/       # Circuit schematics, wiring guide, pin mapping
│
├── docs/
│   ├── RESEARCH_ARTICLE.md  # 8-page academic research paper
│   ├── DATABASE_DESIGN.md   # Schema, triggers, views, and ER model
│   ├── API_DOCUMENTATION.md # Complete REST API endpoint reference
│   ├── HARDWARE_GUIDE.md    # ESP32 component BOM, wiring, and flashing
│   ├── EXPERIMENT_GUIDE.md  # Step-by-step tampering demonstration walkthrough
│   ├── SETUP_GUIDE.md       # Windows setup, dependencies, and troubleshooting
│   └── DATA_AUDIT.md        # Cryptographic audit analysis vs traditional logs
│
├── scripts/
│   ├── setup_database.py    # Database migration and seed runner
│   ├── verify_ledger.py     # Terminal verification CLI
│   └── run_demo.py          # Automated tampering demonstration script
│
├── setup.ps1                # Automated Windows setup script
├── start.ps1                # Application launcher script
├── test.ps1                 # Automated test suite runner
├── docker-compose.yml       # Optional containerized stack
├── .env.example             # Environment variable template
├── .gitignore
└── README.md
```

---

## 8. Fundamental Limitations & Security Boundary

A centralized hash chain is **tamper-evident, not absolutely tamper-proof**:
- An adversary possessing PostgreSQL **superuser privileges** or OS-level access to the database data files could theoretically modify a mark and programmatically recalculate all subsequent hashes in the chain.
- To counter this in enterprise environments, daily or periodic head hashes should be published to an external witness (e.g. an RFC 3161 timestamping authority or a public transparency ledger).
- This implementation is a centralized hash-chained relational DBMS ledger, **not a public decentralized blockchain**, preserving ACID relational transactions, fast queries, and zero gas fees.

---

## 9. Academic License
Developed for Academic Evaluation & Research — Topic 11: Tamper-Evident Marks Register.
