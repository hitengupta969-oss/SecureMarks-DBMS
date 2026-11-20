from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MarksEntryRequest(BaseModel):
    student_id: int
    subject_id: int
    exam_id: int
    marks: float = Field(..., ge=0.0, le=100.0)

class MarksCorrectionRequest(BaseModel):
    student_id: int
    subject_id: int
    exam_id: int
    corrected_marks: float = Field(..., ge=0.0, le=100.0)
    reason: Optional[str] = "Re-evaluation and authorized mark correction"

class EffectiveMarkResponse(BaseModel):
    ledger_id: int
    sequence_no: int
    student_id: int
    roll_number: str
    student_name: str
    department: str
    student_semester: int
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int
    exam_id: int
    exam_name: str
    academic_year: str
    marks: float
    event_type: str
    created_by: int
    faculty_name: str
    last_updated: datetime
    current_hash: str
