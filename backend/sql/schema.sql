-- ==============================================================================
-- SecureMarks Database Schema
-- Tamper-Evident Marks Register Using Hash-Chained Ledger Database
-- ==============================================================================

-- Enable cryptographic extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_dept_sem ON students(department, semester);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(30) UNIQUE NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 12),
    credits INT NOT NULL DEFAULT 3 CHECK (credits > 0)
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code);

-- 4. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 12),
    exam_date DATE NOT NULL
);

-- 5. Marks Ledger (Primary Hash-Chained Ledger)
CREATE TABLE IF NOT EXISTS marks_ledger (
    id SERIAL PRIMARY KEY,
    sequence_no BIGINT NOT NULL UNIQUE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    student_roll_snapshot VARCHAR(30) NOT NULL,
    student_name_snapshot VARCHAR(100) NOT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    subject_code_snapshot VARCHAR(30) NOT NULL,
    exam_id INT NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
    exam_name_snapshot VARCHAR(100) NOT NULL,
    marks NUMERIC(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('MARK_ENTERED', 'MARK_CORRECTED')),
    created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    previous_hash CHAR(64) NOT NULL,
    hash_payload TEXT NOT NULL,
    current_hash CHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_seq ON marks_ledger(sequence_no);
CREATE INDEX IF NOT EXISTS idx_ledger_student ON marks_ledger(student_id);
CREATE INDEX IF NOT EXISTS idx_ledger_subject ON marks_ledger(subject_id);
CREATE INDEX IF NOT EXISTS idx_ledger_exam ON marks_ledger(exam_id);
CREATE INDEX IF NOT EXISTS idx_ledger_prev_hash ON marks_ledger(previous_hash);
CREATE INDEX IF NOT EXISTS idx_ledger_curr_hash ON marks_ledger(current_hash);

-- 6. Ledger State (Singleton table to serialize append operations and track head)
CREATE TABLE IF NOT EXISTS ledger_state (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_sequence BIGINT NOT NULL DEFAULT 0,
    last_hash CHAR(64) NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure the singleton record exists
INSERT INTO ledger_state (id, last_sequence, last_hash, updated_at)
VALUES (1, 0, '0000000000000000000000000000000000000000000000000000000000000000', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 7. Device Logs (For ESP32 IoT / Hardware Terminal)
CREATE TABLE IF NOT EXISTS device_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device ON device_logs(device_id);

-- 8. Verification Logs
CREATE TABLE IF NOT EXISTS verification_logs (
    id SERIAL PRIMARY KEY,
    verification_status VARCHAR(64) NOT NULL,
    records_checked INT NOT NULL DEFAULT 0,
    invalid_records INT NOT NULL DEFAULT 0,
    error_details JSONB,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_time ON verification_logs(verified_at DESC);
