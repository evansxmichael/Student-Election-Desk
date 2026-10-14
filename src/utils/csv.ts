import Papa from 'papaparse';
import type { Student } from '../types';

export const CSV_HEADERS = ['name', 'roll', 'course', 'year', 'residence', 'status', 'notes'];

export function exportStudentsToCsv(students: Student[], filename = 'student-election-register.csv') {
  const data = students.map((s) => ({
    name: s.name,
    roll: s.roll || '',
    course: s.course,
    year: s.year || '',
    residence: s.residence,
    status: s.status,
    notes: s.notes || '',
    votedAt: s.votedAt || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvTemplate() {
  const sample = [
    {
      name: 'Mohd Arshad',
      roll: '23CS001',
      course: 'B.Tech (Computer Science)',
      year: '3rd Year',
      residence: 'Hostel',
      status: 'Not yet marked',
      notes: '',
    },
    {
      name: 'Fatima Zahra',
      roll: '24MCA012',
      course: 'MCA',
      year: '1st Year',
      residence: 'Outside',
      status: 'Not yet marked',
      notes: '',
    },
  ];

  const csv = Papa.unparse(sample);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voter-roster-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCsvFile(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const list: Student[] = [];
          const now = new Date().toISOString();

          results.data.forEach((row: any, idx: number) => {
            const getVal = (field: string) => {
              const key = Object.keys(row).find((k) => k.trim().toLowerCase() === field.toLowerCase());
              return key ? String(row[key] || '').trim() : '';
            };

            const name = getVal('name') || getVal('student name') || getVal('voter name');
            const course = getVal('course') || getVal('department') || getVal('branch') || 'Other';
            if (!name) return;

            const roll = getVal('roll') || getVal('roll no') || getVal('id') || getVal('enrollment');
            const year = getVal('year') || getVal('stage') || getVal('semester') || '';
            const rawResidence = getVal('residence') || getVal('hostel');
            const residence = ['Hostel', 'Outside'].includes(rawResidence) ? (rawResidence as any) : 'Hostel';
            const rawStatus = getVal('status');
            const status = rawStatus === 'Voted' ? 'Voted' : 'Not yet marked';
            const notes = getVal('notes');

            list.push({
              id: `voter_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
              name,
              roll,
              course,
              year,
              residence,
              status,
              notes,
              updatedAt: now,
            });
          });

          if (list.length === 0) {
            reject(new Error('No valid student rows found. Ensure columns include "name" and "course".'));
          } else {
            resolve(list);
          }
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
