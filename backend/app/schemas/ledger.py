from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class LedgerRecordResponse(BaseModel):
    id: int
    sequence_no: int
    student_id: int
    student_roll_snapshot: str
    student_name_snapshot: str
    subject_id: int
    subject_code_snapshot: str
    exam_id: int
    exam_name_snapshot: str
    marks: float
    event_type: str
    created_by: int
    created_at: datetime
    previous_hash: str
    hash_payload: str
    current_hash: str

class LedgerStateResponse(BaseModel):
    last_sequence: int
    last_hash: str
    updated_at: datetime
    total_records: int
    latest_status: str

class VerificationReportResponse(BaseModel):
    status: str
    verified_at: str
    records_checked: int
    valid_records: int
    invalid_records: int
    invalid_details: List[Any]
    ledger_state_valid: bool
    summary: str
