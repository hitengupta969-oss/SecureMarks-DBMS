import hashlib
import pytest
from app.core.database import get_db_connection

def test_3_to_7_hash_chain_sequential_insertions():
    """
    Requirements 3, 4, 5, 6, 7:
    - Initial record insertion
    - Automatic trigger execution
    - Correct previous_hash assignment (chained)
    - Correct current_hash generation via pgcrypto SHA-256
    - Multiple sequential insertions serialize without collisions
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Query the first 5 records in marks_ledger
            cur.execute("""
                SELECT sequence_no, previous_hash, current_hash, hash_payload, marks
                FROM marks_ledger
                ORDER BY sequence_no ASC
                LIMIT 5;
            """)
            rows = cur.fetchall()
            assert len(rows) >= 3, "Ledger should contain seeded records"

            # Check genesis record
            gen = rows[0]
            assert gen["sequence_no"] == 1
            assert gen["previous_hash"] == "0" * 64

            # Verify that Python hashlib produces the exact same hash as pgcrypto stored hash
            computed_gen_hash = hashlib.sha256(gen["hash_payload"].encode("utf-8")).hexdigest()
            assert computed_gen_hash == gen["current_hash"].strip()

            # Check sequential chaining
            for i in range(1, len(rows)):
                curr_row = rows[i]
                prev_row = rows[i - 1]

                assert curr_row["sequence_no"] == prev_row["sequence_no"] + 1
                assert curr_row["previous_hash"].strip() == prev_row["current_hash"].strip()

                # Verify cryptographic integrity
                computed = hashlib.sha256(curr_row["hash_payload"].encode("utf-8")).hexdigest()
                assert computed == curr_row["current_hash"].strip()

def test_14_authorized_correction_event_insertion():
    """
    Requirement 14: Authorized correction event insertion.
    Normal corrections insert a new MARK_CORRECTED event instead of modifying the existing record.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Insert a new MARK_CORRECTED event
            cur.execute("""
                INSERT INTO marks_ledger (
                    student_id,
                    student_roll_snapshot,
                    student_name_snapshot,
                    subject_id,
                    subject_code_snapshot,
                    exam_id,
                    exam_name_snapshot,
                    marks,
                    event_type,
                    created_by
                ) VALUES (1, 'CS2023001', 'Aarav Patel', 1, 'CS601', 1, 'Mid-Term Examination 2025-26', 92.50, 'MARK_CORRECTED', 2)
                RETURNING sequence_no, event_type, marks, previous_hash, current_hash;
            """)
            new_rec = cur.fetchone()
            assert new_rec["event_type"] == "MARK_CORRECTED"
            assert float(new_rec["marks"]) == 92.50
            assert len(new_rec["current_hash"].strip()) == 64

            # Verify view reflects the corrected mark as latest effective mark
            cur.execute("""
                SELECT marks, event_type, sequence_no
                FROM v_effective_marks
                WHERE student_id = 1 AND subject_id = 1 AND exam_id = 1;
            """)
            eff = cur.fetchone()
            assert float(eff["marks"]) == 92.50
            assert eff["event_type"] == "MARK_CORRECTED"
            assert eff["sequence_no"] == new_rec["sequence_no"]
