import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { COURSES, YEARS } from '../utils/constants';
import type { ResidenceType, VoterStatus } from '../types';
import { UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const AddStudentModal: React.FC = () => {
  const { addStudent, setActiveTab, userRole } = useElection();

  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [course, setCourse] = useState(COURSES[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [residence, setResidence] = useState<ResidenceType>('Hostel');
  const [status, setStatus] = useState<VoterStatus>('Not yet marked');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStudent({
      name: name.trim(),
      roll: roll.trim(),
      course,
      year,
      residence,
      status,
      notes: notes.trim(),
      votedAt: status === 'Voted' ? new Date().toISOString() : undefined,
    });

    setActiveTab('voters');
  };

  return (
    <div className="pb-28 px-4 max-w-xl mx-auto pt-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setActiveTab('voters')}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs touch-scale transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Voter Desk
        </button>
        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" />
          Spot Registration Desk
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="mb-5 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-serif font-bold text-slate-900 tracking-tight">
            Register Student to Polling Roll
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add an eligible student to the voter list on election day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Danish Ahmed"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold"
            />
          </div>

          {/* Roll No & Residence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Roll Number / Student ID
              </label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="e.g. 23BCS041"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Residence Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResidence('Hostel')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all touch-scale ${
                    residence === 'Hostel'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Hostel
                </button>
                <button
                  type="button"
                  onClick={() => setResidence('Outside')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all touch-scale ${
                    residence === 'Outside'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Outside
                </button>
              </div>
            </div>
          </div>

          {/* Course & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Course / Department *
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Stage / Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instant Vote Option */}
          <div className="pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mark Status Immediately?
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                <input
                  type="radio"
                  name="statusOption"
                  checked={status === 'Not yet marked'}
                  onChange={() => setStatus('Not yet marked')}
                  className="accent-blue-600 w-4 h-4"
                />
                Not yet marked (Pending)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-800 font-bold">
                <input
                  type="radio"
                  name="statusOption"
                  checked={status === 'Voted'}
                  onChange={() => setStatus('Voted')}
                  className="accent-emerald-600 w-4 h-4"
                />
                Mark as Voted Right Now
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Optional Booth / Verification Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ID verified by presiding officer, Booth 2"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {userRole === 'viewer' ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold text-center">
                View-Only Mode: You must switch to Editor or Admin in Settings to register new students.
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 touch-scale transition-all"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                Save Record to Roster
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
