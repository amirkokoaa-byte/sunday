
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
  isPrivate?: boolean; // حقل جديد لتحديد خصوصية السجل
}

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export type Theme = 'light' | 'dark' | 'glass' | 'corporate' | 'midnight' | 'emerald' | 'rose';

export type Page = 'attendance' | 'history' | 'settings' | 'my-logs';
