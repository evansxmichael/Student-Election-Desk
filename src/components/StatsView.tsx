import React from 'react';
import { useElection } from '../context/ElectionContext';
import { exportStudentsToCsv } from '../utils/csv';
import { BarChart3, Users, CheckCircle2, Clock, Home, Compass, Download, Printer } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { stats, students } = useElection();

  const hostelRate = stats.hostelTotal > 0 ? Math.round((stats.hostelVoted / stats.hostelTotal) * 100) : 0;
  const outsideRate = stats.outsideTotal > 0 ? Math.round((stats.outsideVoted / stats.outsideTotal) * 100) : 0;

  return (
    <div className="pb-28 px-4 max-w-6xl mx-auto pt-4 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Voter Turnout & Department Statistics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time voting participation and turnout percentage across courses and departments.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => exportStudentsToCsv(students)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 touch-scale shadow-2xs"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 touch-scale shadow-2xs"
            title="Print Turnout Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Grid (NJLI Clean Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">REGISTERED</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Total eligible students</p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">MARKED VOTED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-700">{stats.voted}</div>
          <p className="text-[11px] text-emerald-800/80 mt-0.5">Verified ballots</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">PENDING</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-700">{stats.pending}</div>
          <p className="text-[11px] text-amber-800/80 mt-0.5">Awaiting verification</p>
        </div>

        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">TURNOUT RATE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-blue-700">
            {stats.turnoutRate}%
          </div>
          <p className="text-[11px] text-blue-800/80 mt-0.5">Participation ratio</p>
        </div>
      </div>

      {/* Hostel vs Outside Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Residence Demographic Participation
        </h3>

        {/* Hostel Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              Hostel Students
            </span>
            <span className="text-slate-700 font-mono text-xs font-semibold">
              {stats.hostelVoted} / {stats.hostelTotal}{' '}
              <span className="text-blue-700 font-bold">({hostelRate}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${hostelRate}%` }}
            />
          </div>
        </div>

        {/* Outside Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-600" />
              Outside / Day Scholars
            </span>
            <span className="text-slate-700 font-mono text-xs font-semibold">
              {stats.outsideVoted} / {stats.outsideTotal}{' '}
              <span className="text-purple-700 font-bold">({outsideRate}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${outsideRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Department Breakdown List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
          Department-Wise Turnout Breakdown
        </h3>

        <div className="space-y-3.5">
          {Object.entries(stats.courseStats).map(([course, data]) => {
            const pct = data.total > 0 ? Math.round((data.voted / data.total) * 100) : 0;
            return (
              <div key={course} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-semibold truncate max-w-[220px]">
                    {course}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    <span className="text-blue-700 font-bold">{data.voted}</span> / {data.total}{' '}
                    <span className="font-semibold text-slate-600">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
