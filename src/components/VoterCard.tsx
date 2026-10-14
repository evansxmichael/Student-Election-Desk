import React, { useState } from 'react';
import type { Student } from '../types';
import { useElection } from '../context/ElectionContext';
import { Check, Undo2, Home, Compass, Clock, Trash2, Pencil } from 'lucide-react';
import { EditStudentModal } from './EditStudentModal';
import { getStudentGender } from '../utils/gender';

interface VoterCardProps {
  student: Student;
}

export const VoterCard: React.FC<VoterCardProps> = ({ student }) => {
  const { toggleVoteStatus, deleteStudent, userRole } = useElection();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isVoted = student.status === 'Voted';
  const canVote = userRole !== 'viewer';
  const canAdmin = userRole === 'admin';

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-150 border bg-white ${
        isVoted
          ? 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Side: Student Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {student.name}
            </h3>

            {/* Roll ID Badge */}
            {student.roll && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {student.roll}
              </span>
            )}
          </div>

          {/* Course & Department */}
          <p className="text-xs text-slate-600 mt-1 font-medium truncate">
            <span className="text-slate-800 font-semibold">{student.course}</span>
            {student.year && <span className="text-slate-400"> • {student.year}</span>}
          </p>

          {/* Residence, Gender & Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                getStudentGender(student) === 'Female'
                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}
            >
              {getStudentGender(student)}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                student.residence === 'Hostel'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}
            >
              {student.residence === 'Hostel' ? (
                <Home className="w-3 h-3 text-blue-600" />
              ) : (
                <Compass className="w-3 h-3 text-purple-600" />
              )}
              {student.residence}
            </span>

            {student.notes && (
              <span className="text-[11px] text-slate-500 truncate max-w-[190px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                {student.notes}
              </span>
            )}

            {isVoted && student.votedAt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-semibold">
                <Clock className="w-3 h-3" />
                Voted {formatTime(student.votedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Action Button or Read-Only Badge */}
        <div className="shrink-0 flex items-center gap-1.5 self-center">
          {!canVote ? (
            isVoted ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                Voted
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200">
                Pending
              </span>
            )
          ) : isVoted ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                Voted
              </span>
              <button
                onClick={() => toggleVoteStatus(student.id)}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 touch-scale transition-all"
                title="Undo vote"
                aria-label="Undo vote"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => toggleVoteStatus(student.id)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs tracking-wide shadow-xs flex items-center gap-1.5 touch-scale transition-all"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Mark Voted
            </button>
          )}

          {canAdmin && (
            <>
              <button
                onClick={() => setIsEditOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-scale"
                title="Edit student details (Admin only)"
                aria-label="Edit student"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${student.name}?`)) {
                    deleteStudent(student.id);
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors touch-scale"
                title="Delete voter (Admin only)"
                aria-label="Delete voter"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin Edit Student Modal */}
      {canAdmin && (
        <EditStudentModal
          student={student}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
};
