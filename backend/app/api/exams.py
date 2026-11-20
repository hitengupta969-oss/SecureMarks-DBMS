from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.schemas.exam import ExamCreate, ExamResponse
from app.api.auth import get_current_user, require_role
from app.core.database import execute_query

router = APIRouter(prefix="/exams", tags=["Examinations"])

@router.get("", response_model=List[ExamResponse])
def get_exams(current_user: dict = Depends(get_current_user)):
    return execute_query(
        "SELECT id, exam_name, academic_year, semester, exam_date FROM exams ORDER BY exam_date DESC;",
        fetch="all"
    )

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    req: ExamCreate,
    current_user: dict = Depends(require_role("admin", "faculty"))
):
    query = """
        INSERT INTO exams (exam_name, academic_year, semester, exam_date)
        VALUES (%s, %s, %s, %s)
        RETURNING id, exam_name, academic_year, semester, exam_date;
    """
    return execute_query(
        query,
        (req.exam_name, req.academic_year, req.semester, req.exam_date),
        fetch="one"
    )
