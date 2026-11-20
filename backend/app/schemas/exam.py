from pydantic import BaseModel
from datetime import date

class ExamBase(BaseModel):
    exam_name: str
    academic_year: str
    semester: int
    exam_date: date

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
