from fastapi import APIRouter, HTTPException, Header, Depends, Query, status
from typing import List, Optional
from datetime import datetime
from app.schemas.device import DeviceMarksRequest, DeviceVerifyRequest, DeviceStatusResponse, DeviceLogResponse
from app.core.config import settings
from app.core.database import execute_query
from app.services.ledger_verification import verify_ledger

router = APIRouter(prefix="/device", tags=["Hardware / IoT"])

def verify_device_auth(x_device_key: Optional[str] = Header(None)):
    """Authorize device via API Key header or allow standard key."""
    if x_device_key and x_device_key != settings.DEVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized hardware device credentials"
        )
    return True

@router.post("/marks")
def device_enter_marks(
    req: DeviceMarksRequest,
    authorized: bool = Depends(verify_device_auth)
):
    """Endpoint for ESP32 keypad to enter student marks."""
    # Lookup student by roll
    student = execute_query(
        "SELECT id, roll_number, name FROM students WHERE roll_number = %s;",
        (req.student_roll.strip().upper(),),
        fetch="one"
    )
    if not student:
        _log_device_action(req.device_id, "ENTRY_FAILED", "ERROR", f"Student with roll {req.student_roll} not found.")
        raise HTTPException(status_code=404, detail=f"Student roll '{req.student_roll}' not found")

    # Lookup subject by code
    subject = execute_query(
        "SELECT id, subject_code FROM subjects WHERE subject_code = %s;",
        (req.subject_code.strip().upper(),),
        fetch="one"
    )
    if not subject:
        _log_device_action(req.device_id, "ENTRY_FAILED", "ERROR", f"Subject code {req.subject_code} not found.")
        raise HTTPException(status_code=404, detail=f"Subject code '{req.subject_code}' not found")

    # Lookup exam
    exam = execute_query(
        "SELECT id, exam_name FROM exams WHERE id = %s;",
        (req.exam_id,),
        fetch="one"
    )
    if not exam:
        exam = execute_query("SELECT id, exam_name FROM exams ORDER BY id ASC LIMIT 1;", fetch="one")

    # Use system admin/hardware faculty user (id = 2) for device operations
    creator_id = 2

    # Insert into ledger (SQL trigger computes pgcrypto hash and sequence)
    query = """
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
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'MARK_ENTERED', %s)
        RETURNING sequence_no, current_hash, previous_hash, created_at;
    """
    res = execute_query(
        query,
        (
            student["id"],
            student["roll_number"],
            student["name"],
            subject["id"],
            subject["subject_code"],
            exam["id"],
            exam["exam_name"],
            req.marks,
            creator_id
        ),
        fetch="one"
    )

    msg = f"Marks ({req.marks}) recorded for {student['roll_number']} in {subject['subject_code']} at Seq #{res['sequence_no']}."
    _log_device_action(req.device_id, "MARKS_RECORDED", "SUCCESS", msg)

    return {
        "status": "RECORD_SAVED",
        "device_id": req.device_id,
        "sequence_no": res["sequence_no"],
        "student_roll": student["roll_number"],
        "marks": req.marks,
        "current_hash": res["current_hash"],
        "message": msg
    }

@router.post("/verify")
def device_verify_ledger(
    req: DeviceVerifyRequest,
    authorized: bool = Depends(verify_device_auth)
):
    """Trigger ledger verification from ESP32 hardware terminal."""
    report = verify_ledger()
    device_status = "LEDGER_VALID" if report["status"] == "VALID" else "TAMPERING_DETECTED"
    
    _log_device_action(
        req.device_id,
        "VERIFY_REQUEST",
        device_status,
        f"Verified {report['records_checked']} records. Status: {report['status']}."
    )

    return {
        "device_id": req.device_id,
        "status": device_status,
        "records_checked": report["records_checked"],
        "valid_records": report["valid_records"],
        "invalid_records": report["invalid_records"],
        "summary": report["summary"]
    }

@router.get("/status", response_model=DeviceStatusResponse)
def get_device_status(device_id: str = "ESP32_TERM_01"):
    latest_log = execute_query(
        "SELECT device_id, action, status, message, created_at FROM device_logs WHERE device_id = %s ORDER BY created_at DESC LIMIT 1;",
        (device_id,),
        fetch="one"
    )
    if latest_log:
        return {
            "device_id": device_id,
            "is_online": True,
            "last_communication": latest_log["created_at"],
            "last_action": latest_log["action"],
            "last_status": latest_log["status"],
            "last_message": latest_log["message"]
        }
    return {
        "device_id": device_id,
        "is_online": False,
        "last_communication": None,
        "last_action": None,
        "last_status": "OFFLINE",
        "last_message": "No communication recorded yet"
    }

@router.get("/logs", response_model=List[DeviceLogResponse])
def get_device_logs(limit: int = Query(50, ge=1, le=200)):
    return execute_query(
        "SELECT id, device_id, action, status, message, created_at FROM device_logs ORDER BY created_at DESC LIMIT %s;",
        (limit,),
        fetch="all"
    )

def _log_device_action(device_id: str, action: str, status: str, message: str):
    execute_query(
        "INSERT INTO device_logs (device_id, action, status, message) VALUES (%s, %s, %s, %s);",
        (device_id, action, status, message),
        fetch="none"
    )
