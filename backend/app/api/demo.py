from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from app.core.config import settings
from app.core.database import execute_query, get_db_connection
from app.api.auth import get_current_user, require_role
from app.services.ledger_verification import verify_ledger

router = APIRouter(prefix="/demo", tags=["Controlled Tampering Demonstration"])

class TamperRequest(BaseModel):
    sequence_no: int = Field(..., description="Sequence number of the ledger record to tamper with")
    tampered_marks: float = Field(..., ge=0.0, le=100.0, description="Unauthorized modified marks value")

class RestoreRequest(BaseModel):
    sequence_no: Optional[int] = None

@router.post("/tamper")
def simulate_unauthorized_modification(
    req: TamperRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """
    Controlled demonstration endpoint for viva/evaluation:
    Simulates direct SQL tampering by an attacker/insider who modifies student marks
    directly in the database without going through authorized channels.
    Leaves the cryptographic hash and hash payload intact.
    Immediately executes independent verification to demonstrate detection.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tampering simulation is disabled. DEMO_MODE must be set to true."
        )

    # Check if record exists
    record = execute_query(
        "SELECT id, sequence_no, marks, student_roll_snapshot, subject_code_snapshot, current_hash FROM marks_ledger WHERE sequence_no = %s;",
        (req.sequence_no,),
        fetch="one"
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ledger record with sequence #{req.sequence_no} not found"
        )

    original_marks = float(record["marks"])

    # Perform direct SQL UPDATE - does NOT trigger hash regeneration
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE marks_ledger SET marks = %s WHERE sequence_no = %s;",
                (req.tampered_marks, req.sequence_no)
            )

    # Automatically execute independent verification
    verification_report = verify_ledger()

    return {
        "success": True,
        "message": f"Simulated unauthorized modification: Sequence #{req.sequence_no} marks altered from {original_marks} to {req.tampered_marks}.",
        "target_sequence": req.sequence_no,
        "original_marks": original_marks,
        "tampered_marks": req.tampered_marks,
        "student_roll": record["student_roll_snapshot"],
        "subject_code": record["subject_code_snapshot"],
        "stored_hash": record["current_hash"],
        "verification_result": verification_report
    }

@router.post("/restore")
def restore_tampered_record(
    req: RestoreRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """
    Restore tampered records back to matching their original canonical payload values
    or re-seed to a clean verified state.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demonstration mode disabled.")

    # Parse original marks from hash_payload for the affected record
    if req.sequence_no:
        record = execute_query(
            "SELECT hash_payload FROM marks_ledger WHERE sequence_no = %s;",
            (req.sequence_no,),
            fetch="one"
        )
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")

        # Extract MARKS: from payload
        payload = record["hash_payload"]
        for part in payload.split("|"):
            if part.startswith("MARKS:"):
                orig_marks = float(part.split(":")[1])
                execute_query(
                    "UPDATE marks_ledger SET marks = %s WHERE sequence_no = %s;",
                    (orig_marks, req.sequence_no),
                    fetch="none"
                )
                break
    else:
        # Restore all records whose current marks do not match stored payload marks
        records = execute_query("SELECT sequence_no, hash_payload FROM marks_ledger;", fetch="all")
        for rec in records:
            payload = rec["hash_payload"]
            for part in payload.split("|"):
                if part.startswith("MARKS:"):
                    orig_marks = float(part.split(":")[1])
                    execute_query(
                        "UPDATE marks_ledger SET marks = %s WHERE sequence_no = %s;",
                        (orig_marks, rec["sequence_no"]),
                        fetch="none"
                    )
                    break

    verification_report = verify_ledger()
    return {
        "success": True,
        "message": "Records restored to match cryptographic payload.",
        "verification_result": verification_report
    }
