import React, { useState, useEffect } from 'react';
import { useElection } from '../context/ElectionContext';
import { COURSES, YEARS } from '../utils/constants';
import type { Student, ResidenceType, VoterStatus, GenderType } from '../types';
import { getStudentGender } from '../utils/gender';
import { X, Check, Edit, ShieldCheck, Home, Compass } from 'lucide-react';

interface EditStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const { updateStudent } = useElection();

  const [name, setName] = useState(student.name);
  const [roll, setRoll] = useState(student.roll || '');
  const [course, setCourse] = useState(student.course);
  const [year, setYear] = useState(student.year || YEARS[0]);
  const [residence, setResidence] = useState<ResidenceType>(student.residence);
  const [gender, setGender] = useState<GenderType>(student.gender || getStudentGender(student));
  const [status, setStatus] = useState<VoterStatus>(student.status);
  const [notes, setNotes] = useState(student.notes || '');

  // Reset local state when student changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(student.name);
      setRoll(student.roll || '');
      setCourse(student.course);
      setYear(student.year || YEARS[0]);
      setResidence(student.residence);
      setGender(student.gender || getStudentGender(student));
      setStatus(student.status);
      setNotes(student.notes || '');
    }
  }, [student, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Student = {
      ...student,
      name: name.trim(),
      roll: roll.trim(),
      course,
      year,
      residence,
      gender,
      status,
      notes: notes.trim(),
      votedAt: status === 'Voted' ? student.votedAt || new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    updateStudent(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Edit className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Voter Record
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Modify details for student #{student.roll || student.id.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Danish Ahmed"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold"
            />
          </div>

          {/* Roll Number & Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Roll Number / Student ID
              </label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="e.g. 26BTCS001HY"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Course / Department
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Gender & Residence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender Selection *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-scale ${
                    gender === 'Male'
                      ? 'border-sky-400 bg-sky-50 text-sky-900 shadow-2xs ring-1 ring-sky-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-scale ${
                    gender === 'Female'
                      ? 'border-pink-400 bg-pink-50 text-pink-900 shadow-2xs ring-1 ring-pink-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Residence
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResidence('Hostel')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-scale ${
                    residence === 'Hostel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Hostel
                </button>
                <button
                  type="button"
                  onClick={() => setResidence('Outside')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-scale ${
                    residence === 'Outside'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Outside
                </button>
              </div>
            </div>
          </div>

          {/* Ballot Status & Room / Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ballot Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VoterStatus)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
              >
                <option value="Not yet marked">Pending (Not yet marked)</option>
                <option value="Voted">Marked Voted</option>
                <option value="Unable to confirm">Unable to confirm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Room Number / Address Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Room 204, Block B"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 touch-scale transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Voter Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
