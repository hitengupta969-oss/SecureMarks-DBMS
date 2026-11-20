from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.api.auth import get_current_user, require_role
from app.core.database import execute_query

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def get_students(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = "SELECT id, roll_number, name, email, department, semester, created_at FROM students WHERE 1=1"
    params = []

    if department:
        query += " AND department = %s"
        params.append(department)
    if semester:
        query += " AND semester = %s"
        params.append(semester)
    if search:
        query += " AND (roll_number ILIKE %s OR name ILIKE %s OR email ILIKE %s)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY roll_number ASC;"
    return execute_query(query, tuple(params), fetch="all")

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, current_user: dict = Depends(get_current_user)):
    student = execute_query(
        "SELECT id, roll_number, name, email, department, semester, created_at FROM students WHERE id = %s;",
        (student_id,),
        fetch="one"
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreate,
    current_user: dict = Depends(require_role("admin", "faculty"))
):
    # Check duplicate roll_number or email
    existing = execute_query(
        "SELECT id FROM students WHERE roll_number = %s OR email = %s;",
        (req.roll_number, req.email),
        fetch="one"
    )
    if existing:
        raise HTTPException(status_code=400, detail="Student with given roll number or email already exists")

    query = """
        INSERT INTO students (roll_number, name, email, department, semester)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, roll_number, name, email, department, semester, created_at;
    """
    new_student = execute_query(
        query,
        (req.roll_number, req.name, req.email, req.department, req.semester),
        fetch="one"
    )
    return new_student

@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    req: StudentUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    student = execute_query("SELECT id FROM students WHERE id = %s;", (student_id,), fetch="one")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    updates = []
    params = []
    if req.name is not None:
        updates.append("name = %s")
        params.append(req.name)
    if req.email is not None:
        updates.append("email = %s")
        params.append(req.email)
    if req.department is not None:
        updates.append("department = %s")
        params.append(req.department)
    if req.semester is not None:
        updates.append("semester = %s")
        params.append(req.semester)

    if not updates:
        return execute_query("SELECT id, roll_number, name, email, department, semester, created_at FROM students WHERE id = %s;", (student_id,), fetch="one")

    query = f"UPDATE students SET {', '.join(updates)} WHERE id = %s RETURNING id, roll_number, name, email, department, semester, created_at;"
    params.append(student_id)
    return execute_query(query, tuple(params), fetch="one")

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    current_user: dict = Depends(require_role("admin"))
):
    # Check if student has records in marks_ledger
    ledger_entries = execute_query(
        "SELECT COUNT(*) AS count FROM marks_ledger WHERE student_id = %s;",
        (student_id,),
        fetch="one"
    )
    if ledger_entries and ledger_entries["count"] > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete student: Historical marks ledger entries exist. Deletion prohibited to maintain ledger integrity."
        )

    execute_query("DELETE FROM students WHERE id = %s;", (student_id,), fetch="none")
    return {"message": "Student profile successfully deleted."}
