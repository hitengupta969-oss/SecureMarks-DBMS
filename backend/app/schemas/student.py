from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    department: str
    semester: int

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    semester: Optional[int] = None

class StudentResponse(StudentBase):
    id: int
    created_at: datetime
