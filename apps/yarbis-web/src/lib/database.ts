/**
 * Database service - SQLite in production, localStorage for now
 */

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  membershipType: string;
}

export interface Receipt {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'justified';
}

// In-memory database (in production, use SQLite/Supabase)
class Database {
  private students: Map<string, Student> = new Map();
  private receipts: Map<string, Receipt> = new Map();
  private attendance: Map<string, AttendanceRecord> = new Map();
  private studentCounter = 0;
  private receiptCounter = 0;

  // Students
  addStudent(student: Omit<Student, 'id'>): Student {
    this.studentCounter++;
    const id = `STU-${String(this.studentCounter).padStart(4, '0')}`;
    const newStudent = { ...student, id };
    this.students.set(id, newStudent);
    this.saveToLocalStorage();
    return newStudent;
  }

  getStudent(id: string): Student | undefined {
    return this.students.get(id);
  }

  findStudent(name: string): Student | undefined {
    const search = name.toLowerCase();
    for (const student of this.students.values()) {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      if (fullName.includes(search) || search.includes(fullName)) {
        return student;
      }
    }
    return undefined;
  }

  getAllStudents(): Student[] {
    return Array.from(this.students.values());
  }

  updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const student = this.students.get(id);
    if (!student) return undefined;

    const updated = { ...student, ...updates };
    this.students.set(id, updated);
    this.saveToLocalStorage();
    return updated;
  }

  // Receipts
  addReceipt(receipt: Omit<Receipt, 'id'>): Receipt {
    this.receiptCounter++;
    const id = `REC-${String(this.receiptCounter).padStart(6, '0')}`;
    const newReceipt = { ...receipt, id };
    this.receipts.set(id, newReceipt);
    this.saveToLocalStorage();
    return newReceipt;
  }

  getReceipt(id: string): Receipt | undefined {
    return this.receipts.get(id);
  }

  getReceiptsByStudent(studentId: string): Receipt[] {
    return Array.from(this.receipts.values()).filter(
      (r) => r.studentId === studentId
    );
  }

  getPendingReceipts(): Receipt[] {
    return Array.from(this.receipts.values()).filter(
      (r) => r.status !== 'paid'
    );
  }

  getAllReceipts(): Receipt[] {
    return Array.from(this.receipts.values());
  }

  updateReceipt(id: string, updates: Partial<Receipt>): Receipt | undefined {
    const receipt = this.receipts.get(id);
    if (!receipt) return undefined;

    const updated = { ...receipt, ...updates };
    this.receipts.set(id, updated);
    this.saveToLocalStorage();
    return updated;
  }

  // Attendance
  addAttendance(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const id = `ATT-${Date.now()}`;
    const newRecord = { ...record, id };
    this.attendance.set(id, newRecord);
    this.saveToLocalStorage();
    return newRecord;
  }

  getAttendanceByDate(date: string): AttendanceRecord[] {
    return Array.from(this.attendance.values()).filter(
      (r) => r.date === date
    );
  }

  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return Array.from(this.attendance.values()).filter(
      (r) => r.studentId === studentId
    );
  }

  getAllAttendance(): AttendanceRecord[] {
    return Array.from(this.attendance.values());
  }

  // Persistence
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const data = {
      students: Array.from(this.students.entries()),
      receipts: Array.from(this.receipts.entries()),
      attendance: Array.from(this.attendance.entries()),
      studentCounter: this.studentCounter,
      receiptCounter: this.receiptCounter,
    };

    localStorage.setItem('yarbis_db', JSON.stringify(data));
  }

  loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const data = localStorage.getItem('yarbis_db');
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      this.students = new Map(parsed.students);
      this.receipts = new Map(parsed.receipts);
      this.attendance = new Map(parsed.attendance);
      this.studentCounter = parsed.studentCounter || 0;
      this.receiptCounter = parsed.receiptCounter || 0;
    } catch (error) {
      console.error('Error loading database from localStorage:', error);
    }
  }

  // Statistics
  getStatistics() {
    const students = this.students.size;
    const activeStudents = Array.from(this.students.values()).filter(
      (s) => s.status === 'active'
    ).length;
    const pendingReceipts = this.getPendingReceipts();
    const totalDebt = pendingReceipts.reduce((sum, r) => sum + r.amount, 0);
    const totalCollected = Array.from(this.receipts.values())
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalStudents: students,
      activeStudents,
      inactiveStudents: students - activeStudents,
      totalReceipts: this.receipts.size,
      pendingReceipts: pendingReceipts.length,
      totalDebt,
      totalCollected,
      attendanceRecords: this.attendance.size,
    };
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
    dbInstance.loadFromLocalStorage();
  }
  return dbInstance;
}

export default Database;
