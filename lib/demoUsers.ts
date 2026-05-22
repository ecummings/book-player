import { UserProfile, Assignment } from './types';

export const DEMO_USERS: UserProfile[] = [
  { id: 'teacher_1', name: 'Ms. Johnson', role: 'teacher', avatar: '👩‍🏫', class_name: 'Room 12 · Grades K–2' },
  { id: 'teacher_2', name: 'Mr. Davis',   role: 'teacher', avatar: '👨‍🏫', class_name: 'Room 24 · Grades 4–6' },
  { id: 'student_1', name: 'Alex Chen',      role: 'student', avatar: '🧒', grade_band: 'K-1', teacher_id: 'teacher_1' },
  { id: 'student_2', name: 'Emma Rodriguez', role: 'student', avatar: '👧', grade_band: '2-3', teacher_id: 'teacher_1' },
  { id: 'student_3', name: 'Marcus Williams',role: 'student', avatar: '🧒', grade_band: '2-3', teacher_id: 'teacher_1' },
  { id: 'student_4', name: 'Sofia Patel',    role: 'student', avatar: '👧', grade_band: 'K-1', teacher_id: 'teacher_1' },
  { id: 'student_5', name: 'Jordan Lee',     role: 'student', avatar: '🧒', grade_band: '4-6', teacher_id: 'teacher_2' },
  { id: 'student_6', name: 'Amara Okafor',   role: 'student', avatar: '👧', grade_band: '4-6', teacher_id: 'teacher_2' },
  { id: 'student_7', name: 'Tyler Brown',    role: 'student', avatar: '🧒', grade_band: '4-6', teacher_id: 'teacher_2' },
  { id: 'student_8', name: 'Isabella Kim',   role: 'student', avatar: '👧', grade_band: '4-6', teacher_id: 'teacher_2' },
];

const NOW = Date.now();
const DAY = 86_400_000;

export const DEMO_ASSIGNMENTS: Assignment[] = [
  // Ms. Johnson's K-1 students
  { id: 'a1', teacher_id: 'teacher_1', student_id: 'student_1', book_id: '01-sunflower-seeds',  assigned_at: NOW - DAY * 3 },
  { id: 'a2', teacher_id: 'teacher_1', student_id: 'student_1', book_id: '02-little-red-frog',  assigned_at: NOW - DAY * 2 },
  { id: 'a3', teacher_id: 'teacher_1', student_id: 'student_4', book_id: '01-sunflower-seeds',  assigned_at: NOW - DAY * 3 },
  { id: 'a4', teacher_id: 'teacher_1', student_id: 'student_4', book_id: '03-counting-stars',   assigned_at: NOW - DAY },
  // Ms. Johnson's 2-3 students
  { id: 'a5', teacher_id: 'teacher_1', student_id: 'student_2', book_id: '04-the-rainbow',      assigned_at: NOW - DAY * 2 },
  { id: 'a6', teacher_id: 'teacher_1', student_id: 'student_2', book_id: '05-bears-in-the-woods', assigned_at: NOW - DAY },
  { id: 'a7', teacher_id: 'teacher_1', student_id: 'student_3', book_id: '04-the-rainbow',      assigned_at: NOW - DAY * 2 },
  { id: 'a8', teacher_id: 'teacher_1', student_id: 'student_3', book_id: '06-ocean-adventure',  assigned_at: NOW - DAY },
  // Mr. Davis's 4-6 students
  { id: 'a9',  teacher_id: 'teacher_2', student_id: 'student_5', book_id: '09-stars-and-planets', assigned_at: NOW - DAY * 4 },
  { id: 'a10', teacher_id: 'teacher_2', student_id: 'student_5', book_id: '07-code-breakers',     assigned_at: NOW - DAY * 2 },
  { id: 'a11', teacher_id: 'teacher_2', student_id: 'student_6', book_id: '09-stars-and-planets', assigned_at: NOW - DAY * 4 },
  { id: 'a12', teacher_id: 'teacher_2', student_id: 'student_6', book_id: '10-the-river-mystery', assigned_at: NOW - DAY },
  { id: 'a13', teacher_id: 'teacher_2', student_id: 'student_7', book_id: '08-the-secret-garden', assigned_at: NOW - DAY * 3 },
  { id: 'a14', teacher_id: 'teacher_2', student_id: 'student_7', book_id: '07-code-breakers',     assigned_at: NOW - DAY },
  { id: 'a15', teacher_id: 'teacher_2', student_id: 'student_8', book_id: '08-the-secret-garden', assigned_at: NOW - DAY * 3 },
  { id: 'a16', teacher_id: 'teacher_2', student_id: 'student_8', book_id: '10-the-river-mystery', assigned_at: NOW - DAY },
];
