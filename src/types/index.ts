export type ResidenceType = 'Hostel' | 'Outside' | 'Unknown';
export type VoterStatus = 'Voted' | 'Not yet marked' | 'Unable to confirm';
export type UserRole = 'viewer' | 'editor' | 'admin';
export type GenderType = 'Male' | 'Female';

export interface AuthUser {
  username: string;
  role: UserRole;
  displayName: string;
  token?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
  password?: string;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  course: string;
  year: string;
  residence: ResidenceType;
  status: VoterStatus;
  gender?: GenderType;
  notes?: string;
  votedAt?: string;
  votedBy?: string;
  updatedAt: string;
}

export type TabType = 'voters' | 'stats' | 'add' | 'tools';

export interface ElectionStats {
  total: number;
  voted: number;
  pending: number;
  unable: number;
  turnoutRate: number;
  hostelTotal: number;
  hostelVoted: number;
  outsideTotal: number;
  outsideVoted: number;
  maleTotal: number;
  maleVoted: number;
  femaleTotal: number;
  femaleVoted: number;
  courseStats: Record<string, { total: number; voted: number }>;
}

export interface SyncMessage {
  type: 'INIT' | 'UPDATE_VOTE' | 'ADD_STUDENT' | 'UPDATE_STUDENT' | 'DELETE_STUDENT' | 'BATCH_IMPORT' | 'RESET_ALL' | 'PING' | 'AUTH_ERROR';
  payload?: any;
  timestamp: number;
  senderId: string;
  token?: string;
}
