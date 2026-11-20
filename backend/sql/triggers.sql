-- ==============================================================================
-- SecureMarks Hash-Chain Triggers & Immutability Rules
-- ==============================================================================

-- Trigger function for inserting into marks_ledger
CREATE OR REPLACE FUNCTION trg_marks_ledger_append()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_state_rec RECORD;
    v_next_seq BIGINT;
    v_prev_hash CHAR(64);
    v_payload TEXT;
    v_calculated_hash CHAR(64);
BEGIN
    -- 1. Lock singleton ledger_state row to strictly serialize append operations
    SELECT last_sequence, last_hash
    INTO v_state_rec
    FROM ledger_state
    WHERE id = 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ledger state singleton row missing. Cannot proceed with insertion.';
    END IF;

    -- 2. Determine next sequence number and previous hash
    v_next_seq := v_state_rec.last_sequence + 1;
    v_prev_hash := v_state_rec.last_hash;

    -- 3. Auto-populate snapshots if not explicitly provided
    IF NEW.student_roll_snapshot IS NULL OR NEW.student_name_snapshot IS NULL THEN
        SELECT roll_number, name
        INTO NEW.student_roll_snapshot, NEW.student_name_snapshot
        FROM students
        WHERE id = NEW.student_id;
    END IF;

    IF NEW.subject_code_snapshot IS NULL THEN
        SELECT subject_code
        INTO NEW.subject_code_snapshot
        FROM subjects
        WHERE id = NEW.subject_id;
    END IF;

    IF NEW.exam_name_snapshot IS NULL THEN
        SELECT exam_name
        INTO NEW.exam_name_snapshot
        FROM exams
        WHERE id = NEW.exam_id;
    END IF;

    -- Ensure record ID is assigned deterministically before payload computation
    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence('marks_ledger', 'id'));
    END IF;

    -- Assign sequence number and previous hash
    NEW.sequence_no := v_next_seq;
    NEW.previous_hash := v_prev_hash;
    
    -- Ensure timestamp is initialized
    IF NEW.created_at IS NULL THEN
        NEW.created_at := CURRENT_TIMESTAMP;
    END IF;

    -- 4. Generate deterministic canonical payload
    v_payload := generate_canonical_payload(
        NEW.sequence_no,
        NEW.id,
        NEW.student_id,
        NEW.student_roll_snapshot,
        NEW.student_name_snapshot,
        NEW.subject_id,
        NEW.subject_code_snapshot,
        NEW.exam_id,
        NEW.exam_name_snapshot,
        NEW.marks,
        NEW.event_type,
        NEW.created_by,
        NEW.created_at,
        NEW.previous_hash
    );

    -- 5. Calculate SHA-256 hash using pgcrypto
    v_calculated_hash := calculate_payload_hash(v_payload);

    -- 6. Store computed payload and hash into the row
    NEW.hash_payload := v_payload;
    NEW.current_hash := v_calculated_hash;

    -- 7. Update ledger_state within the same transaction
    UPDATE ledger_state
    SET last_sequence = v_next_seq,
        last_hash = v_calculated_hash,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;

    RETURN NEW;
END;
$$;

-- Bind BEFORE INSERT trigger to marks_ledger
DROP TRIGGER IF EXISTS trg_marks_ledger_before_insert ON marks_ledger;
CREATE TRIGGER trg_marks_ledger_before_insert
BEFORE INSERT ON marks_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_marks_ledger_append();

-- Prevent deletion of ledger records
CREATE OR REPLACE FUNCTION trg_marks_ledger_prevent_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Cryptographic Ledger Deletion Forbidden: Ledger records are append-only and immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_marks_ledger_before_delete ON marks_ledger;
CREATE TRIGGER trg_marks_ledger_before_delete
BEFORE DELETE ON marks_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_marks_ledger_prevent_delete();

-- CRITICAL REQUIREMENT:
-- NO UPDATE trigger that regenerates current_hash or hash_payload!
-- Any direct UPDATE leaves current_hash and hash_payload untouched,
-- ensuring that tampering will be detected by the verification engine.
