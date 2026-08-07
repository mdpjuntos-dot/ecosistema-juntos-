export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  membershipType: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  description: string;
}

export interface InsuranceForm {
  id: string;
  studentId: string;
  company: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  uploadedAt: string;
  processedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'justified';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  formType?: string;
}

export interface YarbisAction {
  type:
    | 'open_form'
    | 'generate_receipt'
    | 'complete_insurance_form'
    | 'create_attendance_sheet'
    | 'fetch_data';
  payload?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}
