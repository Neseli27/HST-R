// ==================== Enum'lar ====================

export type Role =
  | "SUPERADMIN"
  | "HOSPITAL_ADMIN"
  | "DOCTOR"
  | "ASSISTANT"
  | "SECRETARY"
  | "PATIENT";

export type HospitalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type AppointmentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "PAUSED"
  | "RESUMED"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export type QueueEntryStatus =
  | "WAITING"
  | "NOTIFIED"
  | "CALLED"
  | "IN_ROOM"
  | "PAUSED"
  | "RETURNED"
  | "COMPLETED"
  | "SKIPPED";

export type NotificationType =
  | "QUEUE_ALERT"
  | "QUEUE_CALLED"
  | "APPOINTMENT_APPROVED"
  | "APPOINTMENT_REJECTED"
  | "CHECK_IN_REMINDER"
  | "GENERAL";

// ==================== Firestore Document Types ====================

export interface HospitalDoc {
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  taxNumber: string;
  status: HospitalStatus;
  logoUrl: string | null;
  qrToken: string; // Hastane QR kodu için unique token
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDoc {
  uid: string; // Firebase Auth UID
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  tcNo: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  birthDate: Date | null;
  role: Role;
  hospitalId: string | null;
  managedByDoctorId: string | null; // Asistan/sekreter hangi doktora bağlı
  avatarUrl: string | null;
  isActive: boolean;
  fcmTokens: string[]; // Push notification token'ları
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentDoc {
  name: string;
  hospitalId: string;
  createdAt: Date;
}

export interface DoctorDoc {
  userId: string; // users collection'daki doc ID
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  title: string; // Prof. Dr., Uzm. Dr. vb.
  specialization: string | null;
  roomNumber: string | null;
  dailyQuota: number;
  workingHours: WorkingHours;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  [day: string]: {
    start: string; // "09:00"
    end: string; // "17:00"
    slotMinutes: number; // 15
  } | null;
}

export interface ScheduleBlockDoc {
  doctorId: string;
  date: string; // "2024-03-15"
  reason: string | null;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
}

export interface AppointmentDoc {
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  departmentName: string;
  hospitalId: string;
  hospitalName: string;
  date: string; // "2024-03-15"
  timeSlot: string; // "09:15"
  status: AppointmentStatus;
  ticketCode: string; // "123-456"
  notes: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  checkedInAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueSessionDoc {
  doctorId: string;
  date: string; // "2024-03-15"
  isActive: boolean;
  currentNumber: number;
  nextOrderNumber: number; // Sıradaki atanacak orderNumber
  dailyPrefix: string; // Ticket kodu prefix'i (3 haneli)
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueEntryDoc {
  queueSessionId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  orderNumber: number; // Gerçek sıra (hasta görmez)
  displayCode: string; // "123-456" (hasta görür)
  status: QueueEntryStatus;
  priority: number; // 0=normal, 1=geri dönen hasta
  appointmentTime: string;
  calledAt: Date | null;
  enteredAt: Date | null;
  pausedAt: Date | null;
  returnedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDoc {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  sentAt: Date;
}

// ==================== API Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

// ==================== Constants ====================

export const QUEUE_RETURN_OFFSET = 2;
export const QUEUE_NOTIFY_AHEAD = 1;

export const DOCTOR_TITLES = [
  "Prof. Dr.",
  "Doç. Dr.",
  "Dr. Öğr. Üyesi",
  "Op. Dr.",
  "Uzm. Dr.",
  "Dr.",
] as const;

export const TURKISH_DAYS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};
