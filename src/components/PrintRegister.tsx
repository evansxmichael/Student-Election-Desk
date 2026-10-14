import React from 'react';
import { useElection } from '../context/ElectionContext';

export const PrintRegister: React.FC = () => {
  const { students, stats } = useElection();

  return (
    <div className="hidden print:block p-4 text-black bg-white">
      <div className="border-b-2 border-black pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider">Campus Student Election Register</h1>
        <div className="flex justify-between text-xs mt-1">
          <span>Printed on: {new Date().toLocaleString()}</span>
          <span>
            Total Registered: <b>{stats.total}</b> | Voted: <b>{stats.voted}</b> ({stats.turnoutRate}%)
          </span>
        </div>
      </div>

      <table className="w-full text-left text-xs border border-gray-400">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-400 font-bold uppercase">
            <th className="p-2 border-r border-gray-400 w-10">#</th>
            <th className="p-2 border-r border-gray-400">Student Name</th>
            <th className="p-2 border-r border-gray-400">Roll No</th>
            <th className="p-2 border-r border-gray-400">Course & Year</th>
            <th className="p-2 border-r border-gray-400">Residence</th>
            <th className="p-2 border-r border-gray-400 w-24">Status</th>
            <th className="p-2 w-32">Signature / Audit</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={student.id} className="border-b border-gray-300">
              <td className="p-2 border-r border-gray-300 text-center">{idx + 1}</td>
              <td className="p-2 border-r border-gray-300 font-bold">{student.name}</td>
              <td className="p-2 border-r border-gray-300 font-mono">{student.roll || '—'}</td>
              <td className="p-2 border-r border-gray-300">
                {student.course} {student.year ? `(${student.year})` : ''}
              </td>
              <td className="p-2 border-r border-gray-300">{student.residence}</td>
              <td className="p-2 border-r border-gray-300 font-semibold">
                {student.status === 'Voted' ? '[X] VOTED' : '[ ] Pending'}
              </td>
              <td className="p-2 border-b border-gray-300"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
