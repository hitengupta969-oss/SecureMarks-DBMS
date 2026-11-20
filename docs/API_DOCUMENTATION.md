# SecureMarks — REST API Documentation

Base URL: `http://localhost:8000/api`  
Interactive Swagger Documentation: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints

### POST `/auth/login`
Authenticates a user and issues a signed JWT Bearer token.
- **Request Body:**
  ```json
  {
    "email": "admin@securemarks.edu",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "name": "Dr. Alan Turing",
      "email": "admin@securemarks.edu",
      "role": "admin",
      "is_active": true
    }
  }
  ```

### GET `/auth/me`
Retrieves current authenticated user profile.
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response (200 OK):** User JSON object.

---

## 2. Marks & Ledger Endpoints

### GET `/marks`
Queries the latest effective marks register from database view `v_effective_marks`.
- **Query Parameters:**
  - `student_id` (optional): Filter by student ID.
  - `subject_id` (optional): Filter by subject ID.
  - `exam_id` (optional): Filter by exam ID.
  - `search` (optional): Keyword search on student name, roll number, or subject code.
- **Response (200 OK):** Array of effective mark records.

### POST `/marks`
Records a newly evaluated mark into the cryptographic ledger.
- **Headers:** `Authorization: Bearer <TOKEN>` (Admin or Faculty role)
- **Request Body:**
  ```json
  {
    "student_id": 1,
    "subject_id": 1,
    "exam_id": 1,
    "marks": 88.50
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Marks recorded successfully in cryptographic ledger",
    "sequence_no": 11,
    "current_hash": "a4f8b...",
    "previous_hash": "483bf...",
    "timestamp": "2026-11-19T06:00:00Z"
  }
  ```

### POST `/marks/correct`
Appends an authorized mark correction event (`MARK_CORRECTED`) to the ledger.
- **Headers:** `Authorization: Bearer <TOKEN>` (Admin or Faculty role)
- **Request Body:**
  ```json
  {
    "student_id": 1,
    "subject_id": 1,
    "exam_id": 1,
    "corrected_marks": 92.00,
    "reason": "Re-evaluation approved by academic committee"
  }
  ```

### GET `/ledger`
Retrieves paginated blocks from the immutable ledger.
- **Query Parameters:** `limit=50&offset=0`
- **Response (200 OK):** Array of ledger records with full snapshots, payload, and hashes.

### GET `/ledger/{sequence_no}`
Retrieves a specific block by its sequence number.

### POST `/ledger/verify`
Runs the independent Python SHA-256 verification engine.
- **Response (200 OK):**
  ```json
  {
    "status": "VALID",
    "verified_at": "2026-11-19T06:00:19Z",
    "records_checked": 10,
    "valid_records": 10,
    "invalid_records": 0,
    "invalid_details": [],
    "ledger_state_valid": true,
    "summary": "LEDGER VALID: All 10 records cryptographically verified across SHA-256 chain."
  }
  ```

### GET `/ledger/status`
Returns singleton `ledger_state` and total block count.

---

## 3. Hardware IoT Endpoints

### POST `/device/marks`
Used by ESP32 or terminal simulator to record student marks via roll number.
- **Headers:** `X-Device-Key: esp32_securemarks_device_key_2026`
- **Request Body:**
  ```json
  {
    "device_id": "ESP32_TERM_01",
    "student_roll": "CS2023001",
    "subject_code": "CS601",
    "exam_id": 1,
    "marks": 94.0
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "RECORD_SAVED",
    "sequence_no": 12,
    "current_hash": "c5a1..."
  }
  ```

### POST `/device/verify`
Triggers ledger verification from the physical terminal or keypad.
- **Headers:** `X-Device-Key: esp32_securemarks_device_key_2026`
- **Response (200 OK):** Verification summary and status (`LEDGER_VALID` or `TAMPERING_DETECTED`).

### GET `/device/status`
Queries device telemetry (online status, last communication, latest action).

### GET `/device/logs`
Returns the recent activity stream from the `device_logs` table.

---

## 4. Controlled Tampering Demonstration Endpoints

### POST `/demo/tamper`
Simulates direct SQL tampering by an attacker altering student marks without regenerating hashes.
- **Requires:** `DEMO_MODE=true` and `admin` token.
- **Request Body:**
  ```json
  {
    "sequence_no": 1,
    "tampered_marks": 99.50
  }
  ```
- **Response (200 OK):** Executed SQL update and immediate verification report showing `TAMPERING_DETECTED`.

### POST `/demo/restore`
Restores altered marks back to the original value stored in the canonical payload.
