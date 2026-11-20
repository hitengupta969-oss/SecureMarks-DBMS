import {
  User, Student, Subject, Exam, EffectiveMark,
  LedgerRecord, LedgerState, VerificationReport,
  DashboardStats, DeviceStatus, DeviceLog
} from '../types';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('securemarks_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => request<User>('/auth/me'),

  // Dashboard
  getDashboardStats: async () => request<DashboardStats>('/dashboard/stats'),

  // Students
  getStudents: async (params?: { department?: string; semester?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.append('department', params.department);
    if (params?.semester) q.append('semester', params.semester.toString());
    if (params?.search) q.append('search', params.search);
    return request<Student[]>(`/students?${q.toString()}`);
  },
  getStudent: async (id: number) => request<Student>(`/students/${id}`),
  createStudent: async (data: Omit<Student, 'id' | 'created_at'>) => {
    return request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStudent: async (id: number, data: Partial<Student>) => {
    return request<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteStudent: async (id: number) => {
    return request<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Subjects
  getSubjects: async () => request<Subject[]>('/subjects'),
  createSubject: async (data: Omit<Subject, 'id'>) => {
    return request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Exams
  getExams: async () => request<Exam[]>('/exams'),
  createExam: async (data: Omit<Exam, 'id'>) => {
    return request<Exam>('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Marks
  getEffectiveMarks: async (params?: { student_id?: number; subject_id?: number; exam_id?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.student_id) q.append('student_id', params.student_id.toString());
    if (params?.subject_id) q.append('subject_id', params.subject_id.toString());
    if (params?.exam_id) q.append('exam_id', params.exam_id.toString());
    if (params?.search) q.append('search', params.search);
    return request<EffectiveMark[]>(`/marks?${q.toString()}`);
  },
  enterMarks: async (data: { student_id: number; subject_id: number; exam_id: number; marks: number }) => {
    return request<{ message: string; sequence_no: number; current_hash: string; previous_hash: string }>('/marks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  correctMarks: async (data: { student_id: number; subject_id: number; exam_id: number; corrected_marks: number; reason?: string }) => {
    return request<{ message: string; sequence_no: number; current_hash: string; previous_hash: string }>('/marks/correct', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Ledger
  getLedgerRecords: async (limit = 100, offset = 0) => {
    return request<LedgerRecord[]>(`/ledger?limit=${limit}&offset=${offset}`);
  },
  getLedgerRecord: async (sequence_no: number) => {
    return request<LedgerRecord>(`/ledger/${sequence_no}`);
  },
  getLedgerStatus: async () => request<LedgerState>('/ledger/status'),
  verifyLedger: async () => {
    return request<VerificationReport>('/ledger/verify', {
      method: 'POST',
    });
  },

  // Device / Hardware
  submitDeviceMarks: async (data: { student_roll: string; subject_code: string; marks: number; device_id?: string }) => {
    return request<{ status: string; sequence_no: number; current_hash: string; message: string }>('/device/marks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  verifyDeviceLedger: async (device_id = 'ESP32_TERM_01') => {
    return request<{ status: string; records_checked: number; invalid_records: number; summary: string }>('/device/verify', {
      method: 'POST',
      body: JSON.stringify({ device_id }),
    });
  },
  getDeviceStatus: async (device_id = 'ESP32_TERM_01') => {
    return request<DeviceStatus>(`/device/status?device_id=${device_id}`);
  },
  getDeviceLogs: async (limit = 50) => {
    return request<DeviceLog[]>(`/device/logs?limit=${limit}`);
  },

  // Demo Tampering
  simulateTamper: async (sequence_no: number, tampered_marks: number) => {
    return request<{
      success: boolean;
      message: string;
      target_sequence: number;
      original_marks: number;
      tampered_marks: number;
      verification_result: VerificationReport;
    }>('/demo/tamper', {
      method: 'POST',
      body: JSON.stringify({ sequence_no, tampered_marks }),
    });
  },
  restoreTampered: async (sequence_no?: number) => {
    return request<{
      success: boolean;
      message: string;
      verification_result: VerificationReport;
    }>('/demo/restore', {
      method: 'POST',
      body: JSON.stringify({ sequence_no }),
    });
  },
};
