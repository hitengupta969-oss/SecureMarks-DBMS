# SecureMarks — Tampering Experiment & Demonstration Guide

This guide describes how to reproduce the core research experiment demonstrating that unauthorized database modifications are detected through PostgreSQL hash-chaining.

---

## Experiment Workflow Overview

```
[ Step 1: Normal Operation ]
  Faculty enters student marks -> PostgreSQL Trigger hashes and chains -> Status: VALID

[ Step 2: Adversarial Tampering ]
  Attacker executes direct SQL UPDATE -> Hash remains unchanged -> Database corrupted

[ Step 3: Verification & Alert ]
  Python Engine recalculates SHA-256 -> Detects Payload Mismatch -> Status: TAMPERING DETECTED

[ Step 4: Actuator Alarm ]
  Web Dashboard turns red -> ESP32 flashes Red LED & sounds Buzzer
```

---

## Step-by-Step Demonstration Instructions

### Option A: Using the Web UI (One-Click Lab)
1. Open the web application at `http://localhost:5173`.
2. Sign in as Admin using the one-click **Admin** button (or `admin@securemarks.edu` / `Admin@123`).
3. Navigate to **Integrity Verification** in the left sidebar.
4. Click **Verify Ledger Integrity Now** &rarr; Verify status shows `LEDGER INTEGRITY VERIFIED (VALID)`.
5. Scroll down to the **Automated Tampering Experiment & Demonstration Lab** card.
6. Target Sequence: `1` | Altered Marks: `99.50`.
7. Click **Simulate Tampering**:
   - The backend executes a real SQL `UPDATE marks_ledger SET marks = 99.50 WHERE sequence_no = 1;`.
   - The stored hash payload and SHA-256 hash are **NOT** updated (no update trigger exists).
   - Independent verification is triggered immediately.
   - Status instantly switches to **`TAMPERING DETECTED`** with a red pulsing banner.
   - The **Detailed Cryptographic Discrepancy** viewer appears, highlighting the exact difference between the stored canonical payload (`MARKS:88.50`) and the live database columns (`MARKS:99.50`).
8. Click **Restore** to reset the record back to matching its cryptographic seal. Status returns to **`VALID`**.

---

### Option B: Using psql / Direct SQL Terminal
1. Open a PowerShell terminal.
2. Connect to the PostgreSQL database:
   ```powershell
   & "C:\DBMS Project\pgsql\bin\psql.exe" -U postgres -p 5433 -d securemarks_db
   ```
3. Verify current marks for Sequence #2:
   ```sql
   SELECT sequence_no, student_roll_snapshot, marks, current_hash 
   FROM marks_ledger 
   WHERE sequence_no = 2;
   ```
   *(Notice original marks = 94.00)*

4. Execute an unauthorized direct SQL modification:
   ```sql
   UPDATE marks_ledger 
   SET marks = 99.00 
   WHERE sequence_no = 2;
   ```

5. In another terminal, run the independent Python verification engine:
   ```powershell
   $env:PYTHONPATH = "backend"
   python -m app.services.verify_ledger
   ```

6. **Observed Output:**
   ```
   LEDGER VERIFICATION REPORT
   --------------------------
   Total Records: 10
   Valid Records: 9
   Invalid Records: 1
   Status: TAMPERING_DETECTED
   Summary: CRITICAL: Unauthorized modification detected! 1 record(s) compromised.

   TAMPERING / INTEGRITY VIOLATION DETAILS:
   ---------------------------------------
   -> Sequence #2 | Student: CS2023002 (Diya Nair)
      [!] Tampering detected: Stored hash payload differs from live column values.
      Expected Canonical Payload: ...|MARKS:99.00|...
      Stored Database Payload:    ...|MARKS:94.00|...
   ```

7. Restore the original mark value:
   ```sql
   UPDATE marks_ledger 
   SET marks = 94.00 
   WHERE sequence_no = 2;
   ```

8. Re-run verification:
   ```powershell
   python -m app.services.verify_ledger
   ```
   *(Status returns to `LEDGER VALID`)*

---

### Option C: Using the ESP32 Hardware Terminal
1. Navigate to the **Hardware Terminal (IoT)** page at `http://localhost:5173`.
2. Notice the virtual OLED screen shows `READY - SELECT MODE`.
3. Press **[Keypad '*'] Run Verification**:
   - OLED displays `LEDGER VALID! Checked: 10 recs`.
   - Green LED illuminates, and a single confirmation chime sounds.
4. Go to **Integrity Verification** page and click **Simulate Tampering**.
5. Return to **Hardware Terminal (IoT)** and press **[Keypad '*'] Run Verification**:
   - OLED displays `TAMPERING DETECTED! Invalid: 1 recs INTEGRITY COMPROMISED`.
   - Red LED strobes and active buzzer sounds an acoustic alarm!
