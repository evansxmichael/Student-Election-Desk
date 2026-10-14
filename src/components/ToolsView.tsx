import React, { useState, useEffect } from 'react';
import { useElection, getApiBase } from '../context/ElectionContext';
import { exportStudentsToCsv, downloadCsvTemplate, parseCsvFile } from '../utils/csv';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Radio,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  Trash2,
  Sparkles,
  UserCheck,
  Check,
  Copy,
  Database,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Shield,
  Lock,
  KeyRound,
  LogOut,
  UserPlus,
  Users,
  AlertCircle,
} from 'lucide-react';

export const ToolsView: React.FC = () => {
  const {
    students,
    batchImportStudents,
    clearAllStudents,
    loadSampleData,
    isWsConnected,
    volunteerName,
    setVolunteerName,
    userRole,
    currentUser,
    logout,
    accounts,
    addUser,
    updateUserPassword,
    deleteUser,
  } = useElection();

  const [mobileUrl, setMobileUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [tempVolunteerName, setTempVolunteerName] = useState(volunteerName);

  // Database Connection State
  const [dbUrl, setDbUrl] = useState('');
  const [dbStatus, setDbStatus] = useState<any>({ isConnected: false, type: 'PostgreSQL' });
  const [isDbConnecting, setIsDbConnecting] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [showAdvancedDb, setShowAdvancedDb] = useState(false);

  // User Management State
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [newPassword, setNewPassword] = useState('');
  const [userMgmtMessage, setUserMgmtMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Edit State
  const [editingPasswordFor, setEditingPasswordFor] = useState<string | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMgmtMessage(null);
    const res = await addUser({
      username: newUsername,
      displayName: newDisplayName || newUsername,
      role: newRole,
      password: newPassword,
    });

    if (res.success) {
      setUserMgmtMessage({ type: 'success', text: `Account @${newUsername.trim().toLowerCase()} created successfully!` });
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setShowAddUserForm(false);
      setTimeout(() => setUserMgmtMessage(null), 4000);
    } else {
      setUserMgmtMessage({ type: 'error', text: res.message || 'Failed to create user account.' });
    }
  };

  const handleSavePasswordChange = async (username: string) => {
    if (!editPasswordInput || editPasswordInput.trim().length < 4) {
      setUserMgmtMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    const res = await updateUserPassword(username, editPasswordInput.trim());
    if (res.success) {
      setUserMgmtMessage({ type: 'success', text: `Password updated for @${username}!` });
      setEditingPasswordFor(null);
      setEditPasswordInput('');
      setTimeout(() => setUserMgmtMessage(null), 4000);
    } else {
      setUserMgmtMessage({ type: 'error', text: res.message || 'Failed to update password.' });
    }
  };

  const handleDeleteUserAccount = async (username: string) => {
    if (!window.confirm(`Are you sure you want to delete login account @${username}?`)) return;

    const res = await deleteUser(username);
    if (res.success) {
      setUserMgmtMessage({ type: 'success', text: `Account @${username} deleted successfully.` });
      setTimeout(() => setUserMgmtMessage(null), 4000);
    } else {
      setUserMgmtMessage({ type: 'error', text: res.message || 'Could not delete user account.' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      const protocol = window.location.protocol;
      setMobileUrl(`${protocol}//${host}`);
    }

    // Check DB status on mount
    fetch(`${getApiBase()}/api/db/status`)
      .then((res) => res.json())
      .then((data) => {
        setDbStatus(data);
        if (data.maskedUrl) setDbUrl(data.maskedUrl);
      })
      .catch(() => {});
  }, []);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectDb = async () => {
    if (userRole !== 'admin') {
      setDbMessage('Admin access required to modify database configuration.');
      return;
    }

    if (!dbUrl || dbUrl.includes('****')) {
      setDbMessage('Please enter a valid database connection link.');
      return;
    }

    setIsDbConnecting(true);
    setDbMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/db/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify({ connectionUrl: dbUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus(data.status);
        setDbMessage(`Connected securely to ${data.status.type}! Voter roster is synchronized.`);
      } else {
        setDbMessage(data.message || 'Connection failed.');
      }
    } catch {
      setDbMessage('Could not reach backend sync server.');
    } finally {
      setIsDbConnecting(false);
    }
  };

  const handleSyncDb = async () => {
    if (userRole !== 'admin') {
      setDbMessage('Admin access required to sync database.');
      return;
    }

    setIsDbConnecting(true);
    setDbMessage('');
    try {
      const res = await fetch(`${getApiBase()}/api/db/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser?.token}`,
        },
      });
      const data = await res.json();
      setDbMessage(data.message || 'Roster synchronized successfully.');
    } catch {
      setDbMessage('Sync request failed.');
    } finally {
      setIsDbConnecting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole === 'viewer') {
      alert('View-Only Mode: You do not have permission to import voter files.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');
    try {
      const parsed = await parseCsvFile(file);
      batchImportStudents(parsed);
      alert(`Successfully added ${parsed.length} voters to the register!`);
    } catch (err: any) {
      setImportError(err.message || 'Failed to read CSV spreadsheet');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="pb-28 px-4 max-w-md mx-auto pt-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Chief Admin Access Required</h2>
        <p className="text-xs text-slate-500">
          This section is restricted to the Chief Election Officer. Your current role does not have authorization to view or configure desk settings.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-28 px-4 max-w-3xl mx-auto pt-4 space-y-5">
      <div>
        <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-blue-600" />
          Desk Settings & Security
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-based security permissions, multi-device mobile sync, and roster backup controls.
        </p>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Role-Based Access Control (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select permission mode for this device to prevent unauthorized tampering.
            </p>
          </div>
          <span
            className={`self-start sm:self-auto text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
              userRole === 'admin'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : userRole === 'editor'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {userRole === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
            ) : userRole === 'editor' ? (
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-amber-600" />
            )}
            Active Mode: {userRole === 'admin' ? 'Main Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}
          </span>
        </div>

        {/* Active Session & Log Out / Switch Option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{currentUser?.displayName || 'Active Account'}</span>
                <span className="text-[10px] text-slate-500 font-mono">(@{currentUser?.username || 'user'})</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Current Access: <strong className="text-slate-800 font-semibold">{userRole === 'admin' ? 'Chief Election Officer (Full Control)' : userRole === 'editor' ? 'Polling Agent / Officer (Ballot Marking)' : 'Viewer (Read-Only Observer)'}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold touch-scale transition-all"
            title="Log out and return to Login Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out / Switch Account</span>
          </button>
        </div>

        {/* 3-Role Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Role 1: Viewer (Read-Only) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Eye className="w-4 h-4" />
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                Tier 1
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">1. View Only (Observer)</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              For public screens or observers. Can browse voter list & live turnout. Cannot mark or change votes.
            </p>
            <div className="mt-3 text-[10px] font-semibold text-slate-500 space-y-1">
              <div className="text-emerald-700">✓ View Voter Roll</div>
              <div className="text-emerald-700">✓ View Live Analytics</div>
              <div className="text-rose-600">✕ Ballot Marking Locked</div>
              <div className="text-rose-600">✕ Settings Hidden</div>
            </div>
          </div>

          {/* Role 2: Editor (Polling Desk Officer) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                Tier 2
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">2. Editor (Polling Volunteer)</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              For desk volunteers. Can verify student ID, mark votes, undo mistakes, and spot-register new students.
            </p>
            <div className="mt-3 text-[10px] font-semibold text-slate-500 space-y-1">
              <div className="text-emerald-700">✓ Mark Students as Voted</div>
              <div className="text-emerald-700">✓ Spot Register Voters</div>
              <div className="text-rose-600">✕ Database Config Locked</div>
              <div className="text-rose-600">✕ Settings Hidden</div>
            </div>
          </div>

          {/* Role 3: Main Admin (Chief Election Officer) */}
          <div className="p-4 rounded-xl border border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-200 shadow-2xs text-left relative">
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-900">
                Current Active
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">3. Main Admin (Chief Officer)</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Full system control. Can configure cloud databases, delete records, clear rosters, and manage security.
            </p>
            <div className="mt-3 text-[10px] font-semibold text-slate-500 space-y-1">
              <div className="text-indigo-800 font-bold">✓ Full Unrestricted Power</div>
              <div className="text-indigo-800 font-bold">✓ Database Configuration</div>
              <div className="text-indigo-800 font-bold">✓ Delete & Reset Records</div>
              <div className="text-indigo-800 font-bold">✓ Exclusive Desk Settings Access</div>
            </div>
          </div>
        </div>


      </div>

      {/* ============================================================ */}
      {/* SECTION 2: AUTHORIZED LOGIN USERS & CREDENTIAL MANAGEMENT */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Authorized Login Users & Credentials
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add new polling officers, update account passwords, or delete credentials.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddUserForm(!showAddUserForm);
              setUserMgmtMessage(null);
            }}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs touch-scale transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showAddUserForm ? 'Close User Form' : 'Add New Login User'}</span>
          </button>
        </div>

        {/* User Management Feedback Banner */}
        {userMgmtMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              userMgmtMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {userMgmtMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{userMgmtMessage.text}</span>
          </div>
        )}

        {/* Add New User Form */}
        {showAddUserForm && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                Create New Authorized User
              </span>
              <button
                type="button"
                onClick={() => setShowAddUserForm(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Username / ID *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. agent2 or booth_officer"
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Polling Desk Officer 2"
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Assigned Permission Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="editor">Polling Agent / Officer (Ballot Marking & Spot Add)</option>
                  <option value="viewer">Viewer (Read-Only / Screen Display)</option>
                  <option value="admin">Main Admin (Chief Officer - Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Password (min 4 characters) *
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowAddUserForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs touch-scale transition-all"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* Existing Accounts List */}
        <div className="space-y-2">
          {accounts.map((acc) => {
            const isSelf = currentUser?.username.toLowerCase() === acc.username.toLowerCase();
            const isEditingPwd = editingPasswordFor === acc.username;

            return (
              <div
                key={acc.id || acc.username}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      acc.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : acc.role === 'editor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {acc.username[0].toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {acc.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        @{acc.username}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          Current Session
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                          acc.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : acc.role === 'editor'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {acc.role === 'admin' ? 'Main Admin' : acc.role === 'editor' ? 'Polling Agent' : 'Viewer'}
                      </span>

                      <span className="text-slate-400">•</span>

                      <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Encrypted (PBKDF2)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Actions: Change Password & Delete */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {isEditingPwd ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="password"
                        autoFocus
                        value={editPasswordInput}
                        onChange={(e) => setEditPasswordInput(e.target.value)}
                        placeholder="New Password (min 4)"
                        className="bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono w-36 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePasswordChange(acc.username)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold touch-scale"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPasswordFor(null);
                          setEditPasswordInput('');
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPasswordFor(acc.username);
                          setEditPasswordInput('');
                          setUserMgmtMessage(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold touch-scale transition-all shadow-2xs"
                        title="Change user password"
                      >
                        <KeyRound className="w-3 h-3 text-slate-500" />
                        <span>Change Password</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => handleDeleteUserAccount(acc.username)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSelf
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 hover:border-rose-200 touch-scale'
                        }`}
                        title={isSelf ? 'Cannot delete current logged-in account' : `Delete @${acc.username}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: CLOUD BACKUP & DATABASE (Admin Configurable) */}
      {/* ============================================================ */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Cloud Database & Backup
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                    dbStatus.isConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {dbStatus.isConnected ? 'Online & Backed Up' : 'Local Storage Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {dbStatus.isConnected
                  ? 'All votes and voter records are saved immediately and backed up to the cloud database in real-time.'
                  : 'Operating locally. All records are stored safely in local memory and file backup.'}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Sync Callout */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs mb-3 space-y-2">
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Backup Protection:
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              {dbStatus.isConnected ? 'Auto-Sync Active (Cloud PostgreSQL)' : 'Local File Protection Active'}
            </span>
          </div>

          {/* Collapsible Advanced DB Setup (Locked for non-admins) */}
          <div className="pt-2 border-t border-slate-200">
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={() => setShowAdvancedDb(!showAdvancedDb)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 touch-scale"
                >
                  {showAdvancedDb ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showAdvancedDb ? 'Hide Database Settings' : 'Configure Database Connection'}
                </button>

                {showAdvancedDb && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <input
                      type="text"
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      placeholder="Paste database connection link here..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={handleConnectDb}
                        disabled={isDbConnecting}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold touch-scale disabled:opacity-50"
                      >
                        {isDbConnecting ? 'Connecting...' : 'Save & Connect'}
                      </button>
                      {dbStatus.isConnected && (
                        <button
                          onClick={handleSyncDb}
                          disabled={isDbConnecting}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 touch-scale flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Sync Now
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Database connection settings are locked to Main Admin.
                </span>
                {dbStatus.isConnected && (
                  <button
                    onClick={handleSyncDb}
                    disabled={isDbConnecting}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 touch-scale flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh Sync
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {dbMessage && (
          <div className="text-xs p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium">
            {dbMessage}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: MOBILE QR CODE ACCESS */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              Quick Mobile Access
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2">Open on Mobile Phones & Tablets</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Volunteers can scan this QR code with their phone camera to instantly start marking votes from any mobile device.
            </p>
          </div>

          <div className="shrink-0 bg-white p-2 rounded-xl shadow-xs border border-slate-200">
            <QRCodeSVG value={mobileUrl || 'http://localhost:5173'} size={110} level="M" />
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Polling Desk Web Link
            </div>
            <div className="text-xs font-mono text-blue-700 truncate font-bold">
              {mobileUrl || 'http://localhost:5173'}
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 touch-scale border border-slate-200 shrink-0 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Multi-Device Live Sync Status */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800">
                {isWsConnected ? 'Live Multi-Device Sync Online' : 'Single Device Mode'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isWsConnected
                  ? 'Votes recorded on any phone or laptop update everywhere in real-time.'
                  : 'Working locally on this device.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: POLLING BOOTH VOLUNTEER TAG */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-600" />
          Polling Booth / Volunteer Name
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Enter your name or booth number (e.g. Desk 1 - Main Gate). This will be recorded whenever you mark a student as voted.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tempVolunteerName}
            onChange={(e) => setTempVolunteerName(e.target.value)}
            placeholder="e.g. Desk 1 - Main Entrance"
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
          />
          <button
            onClick={() => setVolunteerName(tempVolunteerName)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 touch-scale shrink-0"
          >
            Save Name
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: ROSTER & BACKUP DATA OPERATIONS */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Voter List & Backup Options
          </h3>
          <span className="text-xs font-mono text-slate-500 font-semibold">{students.length} voters registered</span>
        </div>

        {importError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Import CSV */}
          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer touch-scale flex items-center gap-3 transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Import Voter List (CSV)</div>
              <div className="text-[11px] text-slate-500 truncate">
                Upload spreadsheet with student roll numbers
              </div>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isImporting}
            />
          </label>

          {/* Export CSV Backup */}
          <button
            onClick={() => exportStudentsToCsv(students)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-3 touch-scale text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Download Polling Report (CSV)</div>
              <div className="text-[11px] text-slate-500 truncate">Export voter list with turnout status</div>
            </div>
          </button>

          {/* Template Download */}
          <button
            onClick={downloadCsvTemplate}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-3 touch-scale text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Download Sample Spreadsheet</div>
              <div className="text-[11px] text-slate-500 truncate">Template for preparing student voter data</div>
            </div>
          </button>

          {/* Print Register */}
          <button
            onClick={() => window.print()}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-3 touch-scale text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900">Print Paper Voter Roll</div>
              <div className="text-[11px] text-slate-500 truncate">Print physical paper roll for polling booth</div>
            </div>
          </button>
        </div>

        {/* Danger & Reset Actions (Admin Only) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          {userRole === 'admin' ? (
            <>
              <button
                onClick={loadSampleData}
                className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1.5 touch-scale"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Restore Initial List
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear ALL voter records? Export a backup first.')) {
                    clearAllStudents();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 touch-scale"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Voters
              </button>
            </>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Note: Database reset and clear roster actions require Main Admin authorization.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
