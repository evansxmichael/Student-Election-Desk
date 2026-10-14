import type { Student, GenderType } from '../types';

/**
 * Returns the student's gender directly from their record (stored in JSON / database)
 */
export function getStudentGender(student: Partial<Student>): GenderType {
  return student.gender === 'Female' ? 'Female' : 'Male';
}
