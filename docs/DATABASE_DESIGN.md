# SecureMarks — Database Design & Schema Architecture

## 1. Overview
The **SecureMarks** database (`securemarks_db`) is an enterprise-grade PostgreSQL relational schema designed to enforce cryptographic hash-chaining at the database kernel level using the `pgcrypto` extension.

---

## 2. Table Specifications

### 2.1 `users`
Manages system accounts with role-based access control (RBAC).
- `id` (SERIAL PRIMARY KEY): Unique account identifier.
- `name` (VARCHAR(100) NOT NULL): Full legal name.
- `email` (VARCHAR(120) UNIQUE NOT NULL): Institutional email address.
- `password_hash` (VARCHAR(255) NOT NULL): Salted PBKDF2-HMAC-SHA256 password hash.
- `role` (VARCHAR(20) NOT NULL): Role constraint `CHECK (role IN ('admin', 'faculty', 'student'))`.
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `is_active` (BOOLEAN NOT NULL DEFAULT TRUE).

### 2.2 `students`
Stores student academic enrollments.
- `id` (SERIAL PRIMARY KEY).
- `roll_number` (VARCHAR(30) UNIQUE NOT NULL): Unique academic identifier.
- `name` (VARCHAR(100) NOT NULL): Student name.
- `email` (VARCHAR(120) UNIQUE NOT NULL).
- `department` (VARCHAR(100) NOT NULL): Academic department.
- `semester` (INT NOT NULL CHECK (semester >= 1 AND semester <= 12)).
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).

### 2.3 `subjects`
Curriculum course catalogue.
- `id` (SERIAL PRIMARY KEY).
- `subject_code` (VARCHAR(30) UNIQUE NOT NULL): E.g., `CS601`.
- `subject_name` (VARCHAR(150) NOT NULL).
- `semester` (INT NOT NULL CHECK (semester >= 1 AND semester <= 12)).
- `credits` (INT NOT NULL DEFAULT 3 CHECK (credits > 0)).

### 2.4 `exams`
Examination sessions and terms.
- `id` (SERIAL PRIMARY KEY).
- `exam_name` (VARCHAR(100) NOT NULL): E.g., `Mid-Term Examination 2025-26`.
- `academic_year` (VARCHAR(20) NOT NULL): E.g., `2025-26`.
- `semester` (INT NOT NULL CHECK (semester >= 1 AND semester <= 12)).
- `exam_date` (DATE NOT NULL).

### 2.5 `marks_ledger` (Primary Cryptographic Relation)
The central immutable append-only ledger relation.
- `id` (SERIAL PRIMARY KEY).
- `sequence_no` (BIGINT UNIQUE NOT NULL): Monotonically increasing sequence number (1, 2, 3, ...).
- `student_id` (INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT).
- `student_roll_snapshot` (VARCHAR(30) NOT NULL): Immutable snapshot of roll number at commit time.
- `student_name_snapshot` (VARCHAR(100) NOT NULL): Immutable snapshot of student name.
- `subject_id` (INT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT).
- `subject_code_snapshot` (VARCHAR(30) NOT NULL): Immutable course code snapshot.
- `exam_id` (INT NOT NULL REFERENCES exams(id) ON DELETE RESTRICT).
- `exam_name_snapshot` (VARCHAR(100) NOT NULL): Immutable exam name snapshot.
- `marks` (NUMERIC(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100)): Evaluation grade.
- `event_type` (VARCHAR(30) NOT NULL CHECK (event_type IN ('MARK_ENTERED', 'MARK_CORRECTED'))).
- `created_by` (INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT).
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).
- `previous_hash` (CHAR(64) NOT NULL): SHA-256 hash of the immediate predecessor ($0^{64}$ for sequence 1).
- `hash_payload` (TEXT NOT NULL): Deterministic canonical input string.
- `current_hash` (CHAR(64) NOT NULL): Calculated pgcrypto SHA-256 hexadecimal digest.

### 2.6 `ledger_state` (Singleton Concurrency Table)
Tracks the terminal block of the chain and serializes insertions.
- `id` (INT PRIMARY KEY DEFAULT 1 CHECK (id = 1)).
- `last_sequence` (BIGINT NOT NULL DEFAULT 0).
- `last_hash` (CHAR(64) NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000').
- `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).

### 2.7 `device_logs`
Audit log of transactions from physical or simulated ESP32 terminals.
- `id` (SERIAL PRIMARY KEY).
- `device_id` (VARCHAR(64) NOT NULL).
- `action` (VARCHAR(64) NOT NULL).
- `status` (VARCHAR(32) NOT NULL).
- `message` (TEXT).
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).

### 2.8 `verification_logs`
Chronological record of verification runs and detected violations.
- `id` (SERIAL PRIMARY KEY).
- `verification_status` (VARCHAR(64) NOT NULL).
- `records_checked` (INT NOT NULL DEFAULT 0).
- `invalid_records` (INT NOT NULL DEFAULT 0).
- `error_details` (JSONB).
- `verified_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP).

---

## 3. SQL Trigger Logic

### BEFORE INSERT Trigger: `trg_marks_ledger_append`
Executed automatically whenever a record is inserted into `marks_ledger`:
1. Executes `SELECT last_sequence, last_hash FROM ledger_state WHERE id = 1 FOR UPDATE;` to lock the singleton row.
2. Derives `NEW.sequence_no := last_sequence + 1`.
3. Derives `NEW.previous_hash := last_hash`.
4. Auto-populates snapshot fields from `students`, `subjects`, and `exams` if not provided.
5. Invokes `generate_canonical_payload(...)` to format all fields deterministically.
6. Invokes `calculate_payload_hash(payload)` which executes `encode(digest(payload, 'sha256'), 'hex')`.
7. Assigns `NEW.hash_payload` and `NEW.current_hash`.
8. Updates `ledger_state` with the new sequence number and hash within the same atomic transaction.

### BEFORE DELETE Trigger: `trg_marks_ledger_prevent_delete`
Raises a fatal PL/pgSQL exception:
```sql
RAISE EXCEPTION 'Cryptographic Ledger Deletion Forbidden: Ledger records are append-only and immutable.';
```

### Critical Security Rule: Absence of UPDATE Trigger
No trigger recalculates `current_hash` on UPDATE. Any direct modification via `UPDATE marks_ledger SET marks = ...` leaves the stored hash untouched, ensuring immediate detection by the verification engine.

---

## 4. Database Views

### View: `v_effective_marks`
Extracts the latest valid mark for every student in each subject and exam, naturally accounting for corrections:
```sql
CREATE OR REPLACE VIEW v_effective_marks AS
SELECT DISTINCT ON (l.student_id, l.subject_id, l.exam_id)
    l.id AS ledger_id,
    l.sequence_no,
    l.student_id,
    l.student_roll_snapshot AS roll_number,
    l.student_name_snapshot AS student_name,
    s.department,
    s.semester AS student_semester,
    l.subject_id,
    l.subject_code_snapshot AS subject_code,
    sub.subject_name,
    sub.credits,
    l.exam_id,
    l.exam_name_snapshot AS exam_name,
    e.academic_year,
    l.marks,
    l.event_type,
    l.created_by,
    u.name AS faculty_name,
    l.created_at AS last_updated,
    l.current_hash
FROM marks_ledger l
JOIN students s ON l.student_id = s.id
JOIN subjects sub ON l.subject_id = sub.id
JOIN exams e ON l.exam_id = e.id
JOIN users u ON l.created_by = u.id
ORDER BY l.student_id, l.subject_id, l.exam_id, l.sequence_no DESC;
```
