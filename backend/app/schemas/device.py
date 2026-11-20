from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DeviceMarksRequest(BaseModel):
    device_id: str = "ESP32_TERM_01"
    student_roll: str
    subject_code: str
    exam_id: int = 1
    marks: float = Field(..., ge=0.0, le=100.0)

class DeviceVerifyRequest(BaseModel):
    device_id: str = "ESP32_TERM_01"

class DeviceStatusResponse(BaseModel):
    device_id: str
    is_online: bool
    last_communication: Optional[datetime]
    last_action: Optional[str]
    last_status: Optional[str]
    last_message: Optional[str]

class DeviceLogResponse(BaseModel):
    id: int
    device_id: str
    action: str
    status: str
    message: Optional[str]
    created_at: datetime
