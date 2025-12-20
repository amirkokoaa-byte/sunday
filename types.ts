
export enum RecordType {
  ATTENDANCE = 'حضور',
  VACATION = 'إجازة سنوية',
  MISSION = 'مأمورية',
  LOC_ATTENDANCE = 'حضور موقع',
  LOC_DEPARTURE = 'انصراف موقع'
}

export enum VacationStatus {
  PENDING = 'قيد الانتظار',
  APPROVED = 'تم القبول',
  REJECTED = 'مرفوض'
}

export interface BranchLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserLocationConfig {
  userId: string;
  branches: BranchLocation[];
}

export interface AttendanceRecord {
  id: string;
  userName: string;
  department?: string;
  date: string; // ISO string
  dayName: string;
  type: RecordType;
  isPrivate?: boolean;
  locationLink?: string;
  branchName?: string;
  accuracy?: number;
}

export interface VacationRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  returnDate: string;
  daysCount: number;
  status: VacationStatus;
  createdAt: string;
}

export interface UserPermissions {
  attendance: boolean;
  locationAttendance: boolean;
  myLogs: boolean;
  history: boolean;
  settings: boolean;
  vacationRequest: boolean;
  adminVacations: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
  department?: string;
  isAdmin: boolean;
  permissions?: UserPermissions;
}

export type Theme = 'light' | 'dark' | 'glass' | 'corporate' | 'midnight' | 'emerald' | 'rose';

export type Page = 
  | 'attendance' 
  | 'history' 
  | 'settings' 
  | 'my-logs' 
  | 'location-attendance' 
  | 'vacation-request' 
  | 'admin-vacations';
