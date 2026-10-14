import React from 'react';
import { useElection } from '../context/ElectionContext';
import { VoterCard } from './VoterCard';
import { COURSES } from '../utils/constants';
import { Filter, Plus, Sparkles, UserX } from 'lucide-react';

export const VoterList: React.FC = () => {
  const {
    filteredStudents,
    students,
    selectedCourse,
    setSelectedCourse,
    searchQuery,
    setSearchQuery,
    selectedResidence,
    setSelectedResidence,
    selectedStatus,
    setSelectedStatus,
    selectedGender,
    setSelectedGender,
    setActiveTab,
    loadSampleData,
    lastAction,
    clearLastAction,
    stats,
  } = useElection();

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedResidence('');
    setSelectedStatus('');
    setSelectedGender('');
  };

  const hasActiveFilters = Boolean(searchQuery || selectedCourse || selectedResidence || selectedStatus || selectedGender);

  return (
    <div className="pb-24 px-4 max-w-6xl mx-auto pt-4 space-y-4">
      {/* Main Election Hero Card */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-blue-950 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                STUDENT COUNCIL ELECTION
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 font-bold border border-blue-200">
                Official Voter Roll
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight leading-snug">
              Student Council Election: Voter Roll & Turnout Register
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Complete voter list for all departments, courses, and academic years. Search by student name or roll number, and track live voter turnout.
            </p>
          </div>

          {/* Institutional Stat Boxes on Right (NJLI style) */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <div className="bg-white border border-blue-200/80 rounded-xl px-4 py-2.5 text-center shadow-2xs min-w-[120px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                REGISTERED VOTERS
              </div>
              <div className="text-lg font-mono font-extrabold text-blue-700">
                {stats.total} <span className="text-xs font-semibold text-slate-500">Total</span>
              </div>
            </div>

            <div className="bg-white border border-blue-200/80 rounded-xl px-4 py-2.5 text-center shadow-2xs min-w-[150px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                PARTICIPATION TURNOUT
              </div>
              <div className="text-lg font-mono font-extrabold text-emerald-600">
                {stats.voted} / {stats.total} <span className="text-xs font-bold text-emerald-700">({stats.turnoutRate}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter by Department + Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 pb-1">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[200px] max-w-full">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full sm:w-auto bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 shadow-2xs"
            >
              <option value="">All Academic Departments</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 shrink-0 touch-scale transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-xs font-mono font-medium text-slate-500 shrink-0 self-start sm:self-center pl-6 sm:pl-0">
          Showing <span className="font-bold text-slate-900">{filteredStudents.length}</span> of {students.length} voters
        </div>
      </div>

      {/* Voter Cards List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-2.5">
          {filteredStudents.map((student) => (
            <VoterCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 my-4 shadow-2xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3 border border-slate-200">
            <UserX className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No voters found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {students.length === 0
              ? 'Your voter register is currently empty. You can add a voter or import an Excel/CSV roster.'
              : 'No students match your current search query or department filter.'}
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {students.length === 0 ? (
              <>
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-300 touch-scale shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Load Demo Roster
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 touch-scale shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add First Student
                </button>
              </>
            ) : (
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 hover:bg-slate-200 touch-scale"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Undo Banner */}
      {lastAction && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="truncate">{lastAction.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {lastAction.undoAction && (
              <button
                onClick={() => {
                  lastAction.undoAction?.();
                  clearLastAction();
                }}
                className="text-amber-300 hover:text-amber-200 font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600/50 touch-scale tracking-wider text-[11px]"
              >
                UNDO
              </button>
            )}
            <button
              onClick={clearLastAction}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
