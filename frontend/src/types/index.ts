export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Student {
  id: number;
  roll_number: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  created_at: string;
}

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  semester: number;
  credits: number;
}

export interface Exam {
  id: number;
  exam_name: string;
  academic_year: string;
  semester: number;
  exam_date: string;
}

export interface EffectiveMark {
  ledger_id: number;
  sequence_no: number;
  student_id: number;
  roll_number: string;
  student_name: string;
  department: string;
  student_semester: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  exam_id: number;
  exam_name: string;
  academic_year: string;
  marks: number;
  event_type: 'MARK_ENTERED' | 'MARK_CORRECTED';
  created_by: number;
  faculty_name: string;
  last_updated: string;
  current_hash: string;
}

export interface LedgerRecord {
  id: number;
  sequence_no: number;
  student_id: number;
  student_roll_snapshot: string;
  student_name_snapshot: string;
  subject_id: number;
  subject_code_snapshot: string;
  exam_id: number;
  exam_name_snapshot: string;
  marks: number;
  event_type: 'MARK_ENTERED' | 'MARK_CORRECTED';
  created_by: number;
  created_at: string;
  previous_hash: string;
  hash_payload: string;
  current_hash: string;
}

export interface LedgerState {
  last_sequence: number;
  last_hash: string;
  updated_at: string;
  total_records: number;
  latest_status: string;
}

export interface VerificationErrorDetail {
  sequence_no?: number | string;
  record_id?: number | null;
  student_roll?: string;
  student_name?: string;
  subject_code?: string;
  exam_name?: string;
  current_marks?: number;
  stored_payload?: string;
  expected_payload?: string;
  stored_hash?: string;
  calculated_hash?: string;
  errors: string[];
}

export interface VerificationReport {
  status: 'VALID' | 'TAMPERING_DETECTED' | 'CHAIN_BROKEN' | 'EMPTY_LEDGER' | 'VERIFICATION_ERROR';
  verified_at: string;
  records_checked: number;
  valid_records: number;
  invalid_records: number;
  invalid_details: VerificationErrorDetail[];
  ledger_state_valid: boolean;
  summary: string;
}

export interface DashboardStats {
  total_students: number;
  total_subjects: number;
  total_exams: number;
  total_ledger_records: number;
  latest_verification_status: string;
  detected_violations: number;
  last_verified_at: string | null;
  recent_ledger_entries: Array<{
    sequence_no: number;
    student_roll_snapshot: string;
    student_name_snapshot: string;
    subject_code_snapshot: string;
    marks: number;
    event_type: string;
    current_hash: string;
    created_at: string;
  }>;
  marks_distribution: Array<{
    grade_range: string;
    count: number;
  }>;
}

export interface DeviceStatus {
  device_id: string;
  is_online: boolean;
  last_communication: string | null;
  last_action: string | null;
  last_status: string | null;
  last_message: string | null;
}

export interface DeviceLog {
  id: number;
  device_id: string;
  action: string;
  status: string;
  message: string;
  created_at: string;
}
