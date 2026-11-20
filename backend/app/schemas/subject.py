from pydantic import BaseModel

class SubjectBase(BaseModel):
    subject_code: str
    subject_name: str
    semester: int
    credits: int = 3

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
