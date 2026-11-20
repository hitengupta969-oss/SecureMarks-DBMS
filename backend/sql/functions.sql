-- ==============================================================================
-- SecureMarks Canonical Payload & Cryptographic Functions
-- ==============================================================================

-- Deterministic canonical payload generation function
-- Used by both SQL triggers and exposed for verification cross-checking
CREATE OR REPLACE FUNCTION generate_canonical_payload(
    p_sequence_no BIGINT,
    p_record_id INT,
    p_student_id INT,
    p_student_roll VARCHAR,
    p_student_name VARCHAR,
    p_subject_id INT,
    p_subject_code VARCHAR,
    p_exam_id INT,
    p_exam_name VARCHAR,
    p_marks NUMERIC,
    p_event_type VARCHAR,
    p_created_by INT,
    p_created_at TIMESTAMPTZ,
    p_previous_hash CHAR(64)
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_time_str TEXT;
    v_marks_str TEXT;
BEGIN
    -- Format timestamp deterministically to microsecond UTC ISO-8601 string
    v_time_str := to_char(p_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
    
    -- Format marks to exact 2 decimal places
    v_marks_str := to_char(p_marks, 'FM999990.00');

    RETURN 'SEQ:' || p_sequence_no::TEXT ||
           '|ID:' || p_record_id::TEXT ||
           '|STUDENT:' || p_student_id::TEXT ||
           '|ROLL:' || trim(p_student_roll) ||
           '|NAME:' || trim(p_student_name) ||
           '|SUBJECT:' || p_subject_id::TEXT ||
           '|CODE:' || trim(p_subject_code) ||
           '|EXAM:' || p_exam_id::TEXT ||
           '|EXAMNAME:' || trim(p_exam_name) ||
           '|MARKS:' || v_marks_str ||
           '|EVENT:' || trim(p_event_type) ||
           '|CREATOR:' || p_created_by::TEXT ||
           '|TIME:' || v_time_str ||
           '|PREV:' || trim(p_previous_hash);
END;
$$;

-- Cryptographic SHA-256 calculation wrapper using pgcrypto
CREATE OR REPLACE FUNCTION calculate_payload_hash(p_payload TEXT)
RETURNS CHAR(64)
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT encode(digest(p_payload, 'sha256'), 'hex');
$$;
