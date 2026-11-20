import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.database import get_db_connection

GENESIS_HASH = "0" * 64

class VerificationResult:
    VALID = "VALID"
    TAMPERING_DETECTED = "TAMPERING_DETECTED"
    CHAIN_BROKEN = "CHAIN_BROKEN"
    EMPTY_LEDGER = "EMPTY_LEDGER"
    VERIFICATION_ERROR = "VERIFICATION_ERROR"

def verify_ledger() -> Dict[str, Any]:
    """
    Independently verify the cryptographic integrity of the marks ledger.
    Executes 6 comprehensive integrity checks:
      1. Sequence integrity (consecutive, strictly increasing 1..N)
      2. Previous hash integrity (genesis hash for seq 1, previous current_hash for seq > 1)
      3. Record data integrity (canonical payload matches current table columns)
      4. Cryptographic SHA-256 integrity (hashlib computation matches current_hash)
      5. Ledger state integrity (ledger_state singleton matches last record)
      6. Detailed reporting with exact failure identification
    """
    verified_at = datetime.now(timezone.utc).isoformat()
    report: Dict[str, Any] = {
        "status": VerificationResult.VALID,
        "verified_at": verified_at,
        "records_checked": 0,
        "valid_records": 0,
        "invalid_records": 0,
        "invalid_details": [],
        "ledger_state_valid": True,
        "summary": "Ledger integrity successfully verified."
    }

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Retrieve ledger state singleton
                cur.execute("SELECT last_sequence, last_hash FROM ledger_state WHERE id = 1;")
                state = cur.fetchone()

                # Retrieve all ledger records in sequence order along with expected payload generated from current columns
                query = """
                    SELECT 
                        id,
                        sequence_no,
                        student_id,
                        student_roll_snapshot,
                        student_name_snapshot,
                        subject_id,
                        subject_code_snapshot,
                        exam_id,
                        exam_name_snapshot,
                        marks,
                        event_type,
                        created_by,
                        created_at,
                        previous_hash,
                        hash_payload,
                        current_hash,
                        generate_canonical_payload(
                            sequence_no,
                            id,
                            student_id,
                            student_roll_snapshot,
                            student_name_snapshot,
                            subject_id,
                            subject_code_snapshot,
                            exam_id,
                            exam_name_snapshot,
                            marks,
                            event_type,
                            created_by,
                            created_at,
                            previous_hash
                        ) AS generated_expected_payload
                    FROM marks_ledger
                    ORDER BY sequence_no ASC;
                """
                cur.execute(query)
                records = cur.fetchall()

                total_records = len(records)
                report["records_checked"] = total_records

                if total_records == 0:
                    report["status"] = VerificationResult.EMPTY_LEDGER
                    report["summary"] = "The ledger is empty. No records to verify."
                    # Log to verification_logs
                    _log_verification_result(cur, report)
                    return report

                expected_prev_hash = GENESIS_HASH
                expected_seq = 1
                has_chain_break = False
                has_tampering = False

                for idx, record in enumerate(records):
                    seq = record["sequence_no"]
                    rec_id = record["id"]
                    stored_prev_hash = record["previous_hash"].strip()
                    stored_curr_hash = record["current_hash"].strip()
                    stored_payload = record["hash_payload"]
                    expected_payload = record["generated_expected_payload"]

                    record_errors: List[str] = []

                    # Check 1: Sequence Integrity
                    if seq != expected_seq:
                        has_chain_break = True
                        record_errors.append(
                            f"Sequence error: Expected sequence {expected_seq}, but found {seq}."
                        )

                    # Check 2: Previous Hash Integrity
                    if stored_prev_hash != expected_prev_hash:
                        has_chain_break = True
                        if seq == 1:
                            record_errors.append(
                                f"Genesis hash error: Expected {GENESIS_HASH}, found {stored_prev_hash}."
                            )
                        else:
                            record_errors.append(
                                f"Chain broken: Record's previous_hash ({stored_prev_hash[:16]}...) does not match previous record's current_hash ({expected_prev_hash[:16]}...)."
                            )

                    # Check 3: Record Data Integrity (Payload vs Current Columns)
                    if stored_payload != expected_payload:
                        has_tampering = True
                        record_errors.append(
                            f"Tampering detected: Stored hash payload differs from live column values. Column values modified without authorized append."
                        )

                    # Check 4: Cryptographic SHA-256 Verification via Python hashlib
                    python_calculated_hash = hashlib.sha256(stored_payload.encode("utf-8")).hexdigest()
                    if python_calculated_hash != stored_curr_hash:
                        has_tampering = True
                        record_errors.append(
                            f"Cryptographic hash mismatch: Stored hash ({stored_curr_hash}) does not match independent SHA-256 calculation ({python_calculated_hash})."
                        )

                    # Record outcome
                    if record_errors:
                        report["invalid_records"] += 1
                        report["invalid_details"].append({
                            "sequence_no": seq,
                            "record_id": rec_id,
                            "student_roll": record["student_roll_snapshot"],
                            "student_name": record["student_name_snapshot"],
                            "subject_code": record["subject_code_snapshot"],
                            "exam_name": record["exam_name_snapshot"],
                            "current_marks": float(record["marks"]),
                            "stored_payload": stored_payload,
                            "expected_payload": expected_payload,
                            "stored_hash": stored_curr_hash,
                            "calculated_hash": python_calculated_hash,
                            "errors": record_errors,
                        })
                    else:
                        report["valid_records"] += 1

                    # Advance expected previous hash and sequence number
                    expected_prev_hash = stored_curr_hash
                    expected_seq = seq + 1

                # Check 5: Ledger State Singleton Integrity
                if state:
                    last_record = records[-1]
                    state_seq = state["last_sequence"]
                    state_hash = state["last_hash"].strip()

                    if state_seq != last_record["sequence_no"] or state_hash != last_record["current_hash"].strip():
                        report["ledger_state_valid"] = False
                        has_tampering = True
                        report["invalid_details"].append({
                            "sequence_no": "STATE",
                            "record_id": None,
                            "errors": [
                                f"Ledger state desynchronization: State table indicates sequence {state_seq} / hash {state_hash[:16]}..., but actual ledger terminates at sequence {last_record['sequence_no']} / hash {last_record['current_hash'][:16]}..."
                            ]
                        })

                # Determine overall status
                if has_tampering:
                    report["status"] = VerificationResult.TAMPERING_DETECTED
                    report["summary"] = f"CRITICAL: Unauthorized modification detected! {report['invalid_records']} record(s) compromised."
                elif has_chain_break:
                    report["status"] = VerificationResult.CHAIN_BROKEN
                    report["summary"] = f"WARNING: Hash chain discontinuity detected! Sequence or linkage broken across {report['invalid_records']} record(s)."
                else:
                    report["status"] = VerificationResult.VALID
                    report["summary"] = f"LEDGER VALID: All {total_records} records cryptographically verified across SHA-256 chain."

                # Log verification into verification_logs table
                _log_verification_result(cur, report)

    except Exception as ex:
        report["status"] = VerificationResult.VERIFICATION_ERROR
        report["summary"] = f"Verification error encountered: {str(ex)}"
        report["invalid_details"].append({"error": str(ex)})

    return report

def _log_verification_result(cur, report: Dict[str, Any]) -> None:
    """Persist verification run details into verification_logs table."""
    try:
        cur.execute(
            """
            INSERT INTO verification_logs (
                verification_status,
                records_checked,
                invalid_records,
                error_details,
                verified_at
            ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);
            """,
            (
                report["status"],
                report["records_checked"],
                report["invalid_records"],
                json.dumps(report["invalid_details"])
            )
        )
    except Exception:
        pass
