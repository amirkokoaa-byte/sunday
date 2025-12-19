
export enum RecordType {
  ATTENDANCE = 'حضور',
  VACATION = 'إجازة سنوية',
  MISSION = 'مأمورية'
}

export interface AttendanceRecord {
  id: string;
  userName: string;
  date: string; // ISO string
  dayName: string;
  type: RecordType;
}

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export type Theme = 'light' | 'dark' | 'glass' | 'corporate';

export type Page = 'attendance' | 'history' | 'settings' | 'my-logs';
