import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Student, VoterStatus, TabType, ElectionStats, SyncMessage, UserRole, AuthUser, UserAccount } from '../types';
import { SAMPLE_STUDENTS } from '../utils/constants';
import { sound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface ElectionContextType {
  students: Student[];
  filteredStudents: Student[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCourse: string;
  setSelectedCourse: (c: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedResidence: string;
  setSelectedResidence: (r: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  toggleVoteStatus: (id: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'updatedAt'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  batchImportStudents: (students: Student[]) => void;
  clearAllStudents: () => void;
  loadSampleData: () => void;
  stats: ElectionStats;
  isWsConnected: boolean;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  volunteerName: string;
  setVolunteerName: (name: string) => void;
  lastAction: { message: string; undoAction?: () => void } | null;
  clearLastAction: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  accounts: UserAccount[];
  addUser: (userData: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateUserPassword: (username: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (username: string) => Promise<{ success: boolean; message?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshAccounts: () => Promise<void>;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEY = 'campus_election_voters_v15';
const VOLUNTEER_KEY = 'campus_election_volunteer_name';
const ROLE_KEY = 'campus_election_user_role';
const AUTH_KEY = 'campus_election_auth_session';

// Dynamic server base URL
// Dynamic server base URL
export const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    // If running in production (e.g. on Vercel), route to live Render cloud backend
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.') && !host.startsWith('100.')) {
      return 'https://student-election-desk.onrender.com';
    }
    return `${window.location.protocol}//${host}:3001`;
  }
  return 'https://student-election-desk.onrender.com';
};

export const getWsBase = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    // If running in production (e.g. on Vercel), route to live Render cloud backend
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.') && !host.startsWith('100.')) {
      return 'wss://student-election-desk.onrender.com';
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${host}:3001`;
  }
  return 'wss://student-election-desk.onrender.com';
};

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username && parsed.role && parsed.token) return parsed;
      }
    } catch {}
    return null;
  });

  const isAuthenticated = Boolean(currentUser && currentUser.token);

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'viewer';
  });

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem(ROLE_KEY, role);
  };

  const [volunteerName, setVolunteerNameState] = useState<string>(() => {
    return currentUser ? currentUser.displayName : 'Guest Viewer';
  });

  const setVolunteerName = (name: string) => {
    setVolunteerNameState(name);
    localStorage.setItem(VOLUNTEER_KEY, name);
  };

  // Accounts state (Admin Only, populated from server)
  const [accounts, setAccounts] = useState<UserAccount[]>([]);

  // Function to fetch accounts securely from server
  const refreshAccounts = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || currentUser?.token;
    if (!token) return;

    try {
      const res = await fetch(`${getApiBase()}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAccounts(data);
        }
      }
    } catch (e) {
      console.error('[Auth] Failed to load server accounts:', e);
    }
  }, [currentUser?.token]);

  // Validate session on mount
  useEffect(() => {
    if (!currentUser?.token) return;

    fetch(`${getApiBase()}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Token expired or invalid
          logout();
        } else {
          res.json().then((data) => {
            if (data.user) {
              setUserRoleState(data.user.role);
              setVolunteerNameState(data.user.displayName);
              if (data.user.role === 'admin') {
                refreshAccounts(currentUser.token);
              }
            }
          });
        }
      })
      .catch(() => {});
  }, []);

  // Server-side user login
  const login = async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    const u = usernameInput.trim();
    const p = passwordInput.trim();

    if (!u || !p) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Invalid username or password.' };
      }

      const user: AuthUser = {
        username: data.user.username,
        role: data.user.role,
        displayName: data.user.displayName,
        token: data.token,
      };

      setCurrentUser(user);
      setUserRoleState(user.role);
      setVolunteerNameState(user.displayName);

      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, user.role);
      localStorage.setItem(VOLUNTEER_KEY, user.displayName);

      if (user.role === 'admin') {
        refreshAccounts(data.token);
      }

      return { success: true };
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        return {
          success: false,
          message: 'Server was waking up from idle mode. It is ready now — please tap Sign In again!',
        };
      }
      return { success: false, message: 'Unable to reach authentication server. Please check your network connection.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRoleState('viewer');
    setAccounts([]);
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  };

  // User Management Methods (Admin Only, Server Protected)
  const addUser = async (userData: Omit<UserAccount, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser?.token || userRole !== 'admin') {
      return { success: false, message: 'Admin privileges required to create accounts.' };
    }

    try {
      const res = await fetch(`${getApiBase()}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAccounts();
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to create user.' };
    } catch {
      return { success: false, message: 'Network error communicating with auth server.' };
    }
  };

  const updateUserPassword = async (username: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser?.token || userRole !== 'admin') {
      return { success: false, message: 'Admin privileges required to update user credentials.' };
    }

    try {
      const res = await fetch(`${getApiBase()}/api/users/${encodeURIComponent(username)}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAccounts();
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update password.' };
    } catch {
      return { success: false, message: 'Network error updating credentials.' };
    }
  };

  const deleteUser = async (username: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser?.token || userRole !== 'admin') {
      return { success: false, message: 'Admin privileges required to delete accounts.' };
    }

    try {
      const res = await fetch(`${getApiBase()}/api/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshAccounts();
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete user.' };
    } catch {
      return { success: false, message: 'Network error deleting user.' };
    }
  };

  // Students voter register
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_STUDENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedResidence, setSelectedResidence] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('voters');
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [lastAction, setLastAction] = useState<{ message: string; undoAction?: () => void } | null>(null);

  // WebSocket Server State
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState(getWsBase);

  const wsRef = useRef<WebSocket | null>(null);
  const myClientId = useRef(`client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

  // Persist to localStorage whenever students change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [students]);

  // Connect WebSocket for real-time multi-device sync
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      try {
        ws = new WebSocket(serverUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: SyncMessage = JSON.parse(event.data);
            if (data.senderId === myClientId.current) return;

            if (data.type === 'AUTH_ERROR') {
              alert(data.payload || (data as any).message || 'Action rejected: Unauthorized.');
              return;
            }

            if (data.type === 'INIT' && Array.isArray(data.payload) && data.payload.length > 0) {
              setStudents(data.payload);
            } else if (data.type === 'UPDATE_VOTE') {
              const { id, status, votedAt, votedBy } = data.payload;
              setStudents((prev) =>
                prev.map((s) => (s.id === id ? { ...s, status, votedAt, votedBy, updatedAt: new Date().toISOString() } : s))
              );
            } else if (data.type === 'ADD_STUDENT') {
              setStudents((prev) => [data.payload, ...prev]);
            } else if (data.type === 'UPDATE_STUDENT') {
              setStudents((prev) => prev.map((s) => (s.id === data.payload.id ? data.payload : s)));
            } else if (data.type === 'DELETE_STUDENT') {
              setStudents((prev) => prev.filter((s) => s.id !== data.payload.id));
            } else if (data.type === 'BATCH_IMPORT') {
              setStudents(data.payload);
            } else if (data.type === 'RESET_ALL') {
              setStudents([]);
            }
          } catch (e) {
            console.error('WS message error:', e);
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          ws.close();
        };
      } catch {
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [serverUrl]);

  // Broadcast function with cryptographic token attached
  const broadcastChange = (type: SyncMessage['type'], payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type,
          payload,
          timestamp: Date.now(),
          senderId: myClientId.current,
          token: currentUser?.token,
        })
      );
    }
  };

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    sound.setEnabled(val);
  };

  const toggleVoteStatus = (id: string) => {
    if (userRole === 'viewer') {
      alert('View-Only Mode: You do not have permission to mark or undo votes.');
      return;
    }

    const student = students.find((s) => s.id === id);
    if (!student) return;

    const newStatus: VoterStatus = student.status === 'Voted' ? 'Not yet marked' : 'Voted';
    const votedAt = newStatus === 'Voted' ? new Date().toISOString() : undefined;
    const votedBy = newStatus === 'Voted' ? volunteerName : undefined;

    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus, votedAt, votedBy, updatedAt: new Date().toISOString() } : s))
    );

    if (newStatus === 'Voted') {
      sound.playVoteSuccess();
      triggerHaptic('vote');
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#2563eb', '#10b981', '#6366f1'],
        disableForReducedMotion: true,
      });

      setLastAction({
        message: `Marked "${student.name}" as Voted`,
        undoAction: () => toggleVoteStatus(id),
      });
    } else {
      sound.playUndo();
      triggerHaptic('undo');
      setLastAction({
        message: `Reverted "${student.name}" to Not Marked`,
      });
    }

    broadcastChange('UPDATE_VOTE', { id, status: newStatus, votedAt, votedBy });
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'updatedAt'>) => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can add new candidates.');
      return;
    }

    const newStudent: Student = {
      ...studentData,
      id: `voter_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      updatedAt: new Date().toISOString(),
    };

    setStudents((prev) => [newStudent, ...prev]);
    broadcastChange('ADD_STUDENT', newStudent);
    sound.playVoteSuccess();
    triggerHaptic('vote');
    setLastAction({ message: `Added "${newStudent.name}" to register` });
  };

  const updateStudent = (updated: Student) => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can edit candidate records.');
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    broadcastChange('UPDATE_STUDENT', updated);
  };

  const deleteStudent = (id: string) => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can delete voter records.');
      return;
    }
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setStudents((prev) => prev.filter((x) => x.id !== id));
    broadcastChange('DELETE_STUDENT', { id });
    setLastAction({ message: `Deleted record for "${s.name}"` });
  };

  const batchImportStudents = (list: Student[]) => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can import voter files.');
      return;
    }
    setStudents(list);
    broadcastChange('BATCH_IMPORT', list);
    setLastAction({ message: `Imported ${list.length} voters into register` });
  };

  const clearAllStudents = () => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can clear the voter roster.');
      return;
    }
    setStudents([]);
    broadcastChange('RESET_ALL', null);
  };

  const loadSampleData = () => {
    if (userRole !== 'admin') {
      alert('Admin Access Required: Only the Main Admin can reset to original roster.');
      return;
    }
    setStudents(SAMPLE_STUDENTS);
    broadcastChange('BATCH_IMPORT', SAMPLE_STUDENTS);
  };

  const clearLastAction = () => setLastAction(null);

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.roll && s.roll.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q));

      const matchesCourse = !selectedCourse || s.course === selectedCourse;
      const matchesYear = !selectedYear || s.year === selectedYear;
      const matchesResidence = !selectedResidence || s.residence === selectedResidence;
      const matchesStatus = !selectedStatus || s.status === selectedStatus;

      return matchesQuery && matchesCourse && matchesYear && matchesResidence && matchesStatus;
    });
  }, [students, searchQuery, selectedCourse, selectedYear, selectedResidence, selectedStatus]);

  // Statistics calculation
  const stats: ElectionStats = useMemo(() => {
    const total = students.length;
    const voted = students.filter((s) => s.status === 'Voted').length;
    const unable = students.filter((s) => s.status === 'Unable to confirm').length;
    const pending = total - voted - unable;
    const turnoutRate = total > 0 ? Math.round((voted / total) * 1000) / 10 : 0;

    const hostel = students.filter((s) => s.residence === 'Hostel');
    const hostelTotal = hostel.length;
    const hostelVoted = hostel.filter((s) => s.status === 'Voted').length;

    const outside = students.filter((s) => s.residence === 'Outside');
    const outsideTotal = outside.length;
    const outsideVoted = outside.filter((s) => s.status === 'Voted').length;

    const courseStats: Record<string, { total: number; voted: number }> = {};
    students.forEach((s) => {
      const c = s.course || 'Other';
      if (!courseStats[c]) courseStats[c] = { total: 0, voted: 0 };
      courseStats[c].total += 1;
      if (s.status === 'Voted') courseStats[c].voted += 1;
    });

    return {
      total,
      voted,
      pending,
      unable,
      turnoutRate,
      hostelTotal,
      hostelVoted,
      outsideTotal,
      outsideVoted,
      courseStats,
    };
  }, [students]);

  return (
    <ElectionContext.Provider
      value={{
        students,
        filteredStudents,
        searchQuery,
        setSearchQuery,
        selectedCourse,
        setSelectedCourse,
        selectedYear,
        setSelectedYear,
        selectedResidence,
        setSelectedResidence,
        selectedStatus,
        setSelectedStatus,
        activeTab,
        setActiveTab,
        toggleVoteStatus,
        addStudent,
        updateStudent,
        deleteStudent,
        batchImportStudents,
        clearAllStudents,
        loadSampleData,
        stats,
        isWsConnected,
        serverUrl,
        setServerUrl,
        soundEnabled,
        setSoundEnabled,
        volunteerName,
        setVolunteerName,
        lastAction,
        clearLastAction,
        userRole,
        setUserRole,
        currentUser,
        isAuthenticated,
        accounts,
        addUser,
        updateUserPassword,
        deleteUser,
        login,
        logout,
        refreshAccounts,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) throw new Error('useElection must be used within an ElectionProvider');
  return context;
};
