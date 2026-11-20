from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from app.schemas.ledger import LedgerRecordResponse, LedgerStateResponse, VerificationReportResponse
from app.api.auth import get_current_user, require_role
from app.core.database import execute_query
from app.services.ledger_verification import verify_ledger

router = APIRouter(prefix="/ledger", tags=["Ledger"])

@router.get("", response_model=List[LedgerRecordResponse])
def get_ledger_records(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    event_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
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
            current_hash
        FROM marks_ledger
        WHERE 1=1
    """
    params = []
    if student_id:
        query += " AND student_id = %s"
        params.append(student_id)
    if subject_id:
        query += " AND subject_id = %s"
        params.append(subject_id)
    if event_type:
        query += " AND event_type = %s"
        params.append(event_type)

    query += " ORDER BY sequence_no ASC LIMIT %s OFFSET %s;"
    params.extend([limit, offset])

    return execute_query(query, tuple(params), fetch="all")

@router.get("/status", response_model=LedgerStateResponse)
def get_ledger_status(current_user: dict = Depends(get_current_user)):
    state = execute_query(
        "SELECT last_sequence, last_hash, updated_at FROM ledger_state WHERE id = 1;",
        fetch="one"
    )
    total_records = execute_query(
        "SELECT COUNT(*) AS count FROM marks_ledger;",
        fetch="val"
    )
    latest_log = execute_query(
        "SELECT verification_status FROM verification_logs ORDER BY verified_at DESC LIMIT 1;",
        fetch="val"
    )

    return {
        "last_sequence": state["last_sequence"] if state else 0,
        "last_hash": state["last_hash"] if state else ("0" * 64),
        "updated_at": state["updated_at"] if state else None,
        "total_records": total_records or 0,
        "latest_status": latest_log or "NOT_VERIFIED"
    }

@router.get("/{sequence_no}", response_model=LedgerRecordResponse)
def get_ledger_entry_by_sequence(
    sequence_no: int,
    current_user: dict = Depends(get_current_user)
):
    entry = execute_query(
        """
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
            current_hash
        FROM marks_ledger
        WHERE sequence_no = %s;
        """,
        (sequence_no,),
        fetch="one"
    )
    if not entry:
        raise HTTPException(status_code=404, detail=f"Ledger record with sequence #{sequence_no} not found")
    return entry

@router.post("/verify", response_model=VerificationReportResponse)
def run_ledger_verification(current_user: dict = Depends(get_current_user)):
    """Run cryptographic ledger verification across all records and chains."""
    report = verify_ledger()
    return report
