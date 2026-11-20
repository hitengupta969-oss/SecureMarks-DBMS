import pytest
from app.services.ledger_verification import verify_ledger, VerificationResult
from app.core.database import get_db_connection

def test_8_ledger_verification_valid_records():
    """Requirement 8: Ledger verification with valid records returns VALID."""
    report = verify_ledger()
    assert report["status"] == VerificationResult.VALID
    assert report["records_checked"] > 0
    assert report["invalid_records"] == 0
    assert report["ledger_state_valid"] is True

def test_9_detection_of_modified_marks():
    """Requirement 9: Direct modification of marks is detected by verification engine."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Tamper with sequence #2 marks directly via SQL
            cur.execute("SELECT marks FROM marks_ledger WHERE sequence_no = 2;")
            orig = cur.fetchone()["marks"]
            tampered_val = 99.99 if orig != 99.99 else 55.55

            cur.execute("UPDATE marks_ledger SET marks = %s WHERE sequence_no = 2;", (tampered_val,))
            conn.commit()

            # 2. Run verification
            report = verify_ledger()
            assert report["status"] == VerificationResult.TAMPERING_DETECTED
            assert report["invalid_records"] >= 1
            seq_2_err = [d for d in report["invalid_details"] if d.get("sequence_no") == 2]
            assert len(seq_2_err) == 1
            assert any("Tampering detected" in err for err in seq_2_err[0]["errors"])

            # 3. Clean up: restore original marks
            cur.execute("UPDATE marks_ledger SET marks = %s WHERE sequence_no = 2;", (orig,))
            conn.commit()

    # Verify back to VALID
    assert verify_ledger()["status"] == VerificationResult.VALID

def test_10_detection_of_modified_student_information():
    """Requirement 10: Direct modification of student snapshot info is detected."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT student_name_snapshot FROM marks_ledger WHERE sequence_no = 3;")
            orig_name = cur.fetchone()["student_name_snapshot"]

            cur.execute("UPDATE marks_ledger SET student_name_snapshot = 'Unauthorized Impostor' WHERE sequence_no = 3;")
            conn.commit()

            report = verify_ledger()
            assert report["status"] == VerificationResult.TAMPERING_DETECTED
            seq_3_err = [d for d in report["invalid_details"] if d.get("sequence_no") == 3]
            assert len(seq_3_err) == 1

            # Restore
            cur.execute("UPDATE marks_ledger SET student_name_snapshot = %s WHERE sequence_no = 3;", (orig_name,))
            conn.commit()

    assert verify_ledger()["status"] == VerificationResult.VALID

def test_11_detection_of_modified_previous_hash():
    """Requirement 11: Direct modification of previous_hash is detected as chain broken."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT previous_hash FROM marks_ledger WHERE sequence_no = 4;")
            orig_prev = cur.fetchone()["previous_hash"]

            cur.execute("UPDATE marks_ledger SET previous_hash = %s WHERE sequence_no = 4;", ("f" * 64,))
            conn.commit()

            report = verify_ledger()
            assert report["status"] in (VerificationResult.TAMPERING_DETECTED, VerificationResult.CHAIN_BROKEN)
            seq_4_err = [d for d in report["invalid_details"] if d.get("sequence_no") == 4]
            assert len(seq_4_err) == 1

            # Restore
            cur.execute("UPDATE marks_ledger SET previous_hash = %s WHERE sequence_no = 4;", (orig_prev,))
            conn.commit()

    assert verify_ledger()["status"] == VerificationResult.VALID

def test_12_detection_of_broken_sequence_numbers():
    """Requirement 12: Sequence gap or reordering is detected."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT sequence_no FROM marks_ledger WHERE sequence_no = 5;")
            orig_seq = cur.fetchone()["sequence_no"]

            # Change sequence 5 to 999
            cur.execute("UPDATE marks_ledger SET sequence_no = 999 WHERE sequence_no = 5;")
            conn.commit()

            report = verify_ledger()
            assert report["status"] in (VerificationResult.TAMPERING_DETECTED, VerificationResult.CHAIN_BROKEN)

            # Restore
            cur.execute("UPDATE marks_ledger SET sequence_no = %s WHERE sequence_no = 999;", (orig_seq,))
            conn.commit()

    assert verify_ledger()["status"] == VerificationResult.VALID

def test_13_detection_of_broken_final_ledger_state():
    """Requirement 13: Desynchronization between ledger_state singleton and terminal record is detected."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT last_sequence, last_hash FROM ledger_state WHERE id = 1;")
            orig_state = cur.fetchone()

            # Alter ledger_state last_hash
            cur.execute("UPDATE ledger_state SET last_hash = %s WHERE id = 1;", ("e" * 64,))
            conn.commit()

            report = verify_ledger()
            assert report["ledger_state_valid"] is False
            assert report["status"] == VerificationResult.TAMPERING_DETECTED

            # Restore
            cur.execute("UPDATE ledger_state SET last_hash = %s WHERE id = 1;", (orig_state["last_hash"],))
            conn.commit()

    assert verify_ledger()["status"] == VerificationResult.VALID
