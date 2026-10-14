import React from 'react';
import { useElection } from '../context/ElectionContext';
import {
  Search,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  User,
  Eye,
  Edit3,
  Shield,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedResidence,
    setSelectedResidence,
    selectedStatus,
    setSelectedStatus,
    selectedGender,
    setSelectedGender,
    stats,
    isWsConnected,
    soundEnabled,
    setSoundEnabled,
    volunteerName,
    activeTab,
    setActiveTab,
    userRole,
    currentUser,
    logout,
  } = useElection();

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs no-print">
      {/* NJLI-Style Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">STUDENT COUNCIL</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                ELECTION
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
              Official Polling Desk
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (like NJLI) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/80 text-xs">
          <button
            onClick={() => setActiveTab('voters')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'voters'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Voter Desk
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turnout Analytics
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'add'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Spot Registration
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'tools'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desk Settings
            </button>
          )}
        </nav>

        {/* Right Side: Search Box + Audio Toggle + User Account / Log Out */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voters, roll no..."
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-8 pr-12 py-2 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-44 lg:w-56"
            />
            <span className="absolute right-2 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-400 font-mono">
              Ctrl K
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 touch-scale transition-all"
            title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* User Account / Role Badge & Log Out */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l border-slate-200">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] font-bold text-slate-900 leading-tight">
                {currentUser?.displayName || (userRole === 'admin' ? 'Chief Admin' : userRole === 'editor' ? 'Polling Agent' : 'Guest Viewer')}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {userRole === 'admin' ? 'Admin Access' : userRole === 'editor' ? 'Editor Access' : 'View Only'}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold touch-scale transition-all"
              title="Log Out and return to sign in page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Election Header & Polling Status Banner */}
      <div className="bg-[#fcfdfd] border-t border-slate-100 px-4 py-3.5 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Breadcrumb & Status Tags */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Campus Election</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">Live Polling Desk</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-blue-700 tracking-wider uppercase">
                Official Voting Roll
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Voter List
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                <User className="w-3 h-3 text-slate-500" />
                {volunteerName}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  userRole === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : userRole === 'editor'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {userRole === 'admin' ? (
                  <Shield className="w-3 h-3 text-indigo-600" />
                ) : userRole === 'editor' ? (
                  <Edit3 className="w-3 h-3 text-blue-600" />
                ) : (
                  <Eye className="w-3 h-3 text-amber-600" />
                )}
                Role: {userRole === 'admin' ? 'Main Admin' : userRole === 'editor' ? 'Polling Agent' : 'Viewer'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {isWsConnected ? 'Live Multi-Device Sync Active' : 'Offline Mode'}
              </span>
            </div>
          </div>

          {/* Institutional KPI Summary Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                VOTER PARTICIPATION
              </div>
              <div className="text-sm font-mono font-extrabold text-blue-700">
                {stats.voted} / {stats.total}{' '}
                <span className="text-xs font-semibold text-emerald-600">({stats.turnoutRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (Visible on mobile) */}
        <div className="mt-3 sm:hidden">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name or roll number..."
              className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips (NJLI style pill buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 touch-scale ${
              !selectedStatus
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Students ({stats.total})
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Not yet marked' ? '' : 'Not yet marked')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedStatus === 'Not yet marked'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Voted' ? '' : 'Voted')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedStatus === 'Voted'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Marked Voted ({stats.voted})
          </button>

          <span className="w-px h-4 bg-slate-200 shrink-0 mx-1" />

          <button
            onClick={() => setSelectedResidence(selectedResidence === 'Hostel' ? '' : 'Hostel')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedResidence === 'Hostel'
                ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Hostel ({stats.hostelTotal})
          </button>
          <button
            onClick={() => setSelectedResidence(selectedResidence === 'Outside' ? '' : 'Outside')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedResidence === 'Outside'
                ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Outside / Day Scholar ({stats.outsideTotal})
          </button>

          <span className="w-px h-4 bg-slate-200 shrink-0 mx-1" />

          <button
            onClick={() => setSelectedGender(selectedGender === 'Male' ? '' : 'Male')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedGender === 'Male'
                ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Boys / Male ({stats.maleTotal})
          </button>
          <button
            onClick={() => setSelectedGender(selectedGender === 'Female' ? '' : 'Female')}
            className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 touch-scale ${
              selectedGender === 'Female'
                ? 'bg-pink-100 text-pink-900 border border-pink-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Girls / Female ({stats.femaleTotal})
          </button>
        </div>
      </div>
    </header>
  );
};
