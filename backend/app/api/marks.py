from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from app.schemas.marks import MarksEntryRequest, MarksCorrectionRequest, EffectiveMarkResponse
from app.api.auth import get_current_user, require_role
from app.core.database import execute_query

router = APIRouter(prefix="/marks", tags=["Marks"])

@router.get("", response_model=List[EffectiveMarkResponse])
def get_effective_marks(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    exam_id: Optional[int] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = """
        SELECT 
            ledger_id,
            sequence_no,
            student_id,
            roll_number,
            student_name,
            department,
            student_semester,
            subject_id,
            subject_code,
            subject_name,
            credits,
            exam_id,
            exam_name,
            academic_year,
            marks,
            event_type,
            created_by,
            faculty_name,
            last_updated,
            current_hash
        FROM v_effective_marks
        WHERE 1=1
    """
    params = []

    # If role is student, restrict to their own marks
    if current_user["role"] == "student":
        student_rec = execute_query(
            "SELECT id FROM students WHERE email = %s;",
            (current_user["email"],),
            fetch="one"
        )
        if student_rec:
            query += " AND student_id = %s"
            params.append(student_rec["id"])
        else:
            return []
    elif student_id:
        query += " AND student_id = %s"
        params.append(student_id)

    if subject_id:
        query += " AND subject_id = %s"
        params.append(subject_id)
    if exam_id:
        query += " AND exam_id = %s"
        params.append(exam_id)
    if department:
        query += " AND department = %s"
        params.append(department)
    if semester:
        query += " AND student_semester = %s"
        params.append(semester)
    if search:
        query += " AND (roll_number ILIKE %s OR student_name ILIKE %s OR subject_code ILIKE %s OR subject_name ILIKE %s)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY roll_number ASC, subject_code ASC;"
    return execute_query(query, tuple(params), fetch="all")

@router.post("", status_code=status.HTTP_201_CREATED)
def enter_marks(
    req: MarksEntryRequest,
    current_user: dict = Depends(require_role("admin", "faculty"))
):
    # Verify student, subject, exam exist
    student = execute_query("SELECT id, roll_number, name FROM students WHERE id = %s;", (req.student_id,), fetch="one")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subject = execute_query("SELECT id, subject_code FROM subjects WHERE id = %s;", (req.subject_id,), fetch="one")
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    exam = execute_query("SELECT id, exam_name FROM exams WHERE id = %s;", (req.exam_id,), fetch="one")
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")

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
    new_entry = execute_query(
        query,
        (
            req.student_id,
            student["roll_number"],
            student["name"],
            req.subject_id,
            subject["subject_code"],
            req.exam_id,
            exam["exam_name"],
            req.marks,
            current_user["id"]
        ),
        fetch="one"
    )
    return {
        "message": "Marks recorded successfully in cryptographic ledger",
        "sequence_no": new_entry["sequence_no"],
        "current_hash": new_entry["current_hash"],
        "previous_hash": new_entry["previous_hash"],
        "timestamp": new_entry["created_at"]
    }

@router.post("/correct", status_code=status.HTTP_201_CREATED)
def correct_marks(
    req: MarksCorrectionRequest,
    current_user: dict = Depends(require_role("admin", "faculty"))
):
    # Verify student, subject, exam exist
    student = execute_query("SELECT id, roll_number, name FROM students WHERE id = %s;", (req.student_id,), fetch="one")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subject = execute_query("SELECT id, subject_code FROM subjects WHERE id = %s;", (req.subject_id,), fetch="one")
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    exam = execute_query("SELECT id, exam_name FROM exams WHERE id = %s;", (req.exam_id,), fetch="one")
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")

    # Insert an authorized MARK_CORRECTED event into the ledger
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
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'MARK_CORRECTED', %s)
        RETURNING sequence_no, current_hash, previous_hash, created_at;
    """
    new_entry = execute_query(
        query,
        (
            req.student_id,
            student["roll_number"],
            student["name"],
            req.subject_id,
            subject["subject_code"],
            req.exam_id,
            exam["exam_name"],
            req.corrected_marks,
            current_user["id"]
        ),
        fetch="one"
    )
    return {
        "message": "Authorized mark correction appended to cryptographic ledger",
        "sequence_no": new_entry["sequence_no"],
        "current_hash": new_entry["current_hash"],
        "previous_hash": new_entry["previous_hash"],
        "timestamp": new_entry["created_at"],
        "reason": req.reason
    }
