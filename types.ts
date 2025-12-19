
export enum RecordType {
  ATTENDANCE = 'حضور',
  VACATION = 'إجازة سنوية',
  MISSION = 'مأمورية',
  LOC_ATTENDANCE = 'حضور موقع',
  LOC_DEPARTURE = 'انصراف موقع'
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
  date: string; // ISO string
  dayName: string;
  type: RecordType;
  isPrivate?: boolean;
  locationLink?: string;
  branchName?: string;
  accuracy?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export type Theme = 'light' | 'dark' | 'glass' | 'corporate' | 'midnight' | 'emerald' | 'rose';

export type Page = 'attendance' | 'history' | 'settings' | 'my-logs' | 'location-attendance';
