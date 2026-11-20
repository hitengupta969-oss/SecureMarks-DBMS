from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.schemas.subject import SubjectCreate, SubjectResponse
from app.api.auth import get_current_user, require_role
from app.core.database import execute_query

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(current_user: dict = Depends(get_current_user)):
    return execute_query(
        "SELECT id, subject_code, subject_name, semester, credits FROM subjects ORDER BY subject_code ASC;",
        fetch="all"
    )

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    req: SubjectCreate,
    current_user: dict = Depends(require_role("admin", "faculty"))
):
    existing = execute_query(
        "SELECT id FROM subjects WHERE subject_code = %s;",
        (req.subject_code,),
        fetch="one"
    )
    if existing:
        raise HTTPException(status_code=400, detail="Subject with given code already exists")

    query = """
        INSERT INTO subjects (subject_code, subject_name, semester, credits)
        VALUES (%s, %s, %s, %s)
        RETURNING id, subject_code, subject_name, semester, credits;
    """
    return execute_query(
        query,
        (req.subject_code, req.subject_name, req.semester, req.credits),
        fetch="one"
    )
