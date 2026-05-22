import { UserProfile, Assignment, ReaderSettings } from './types';
import { DEMO_USERS, DEMO_ASSIGNMENTS } from './demoUsers';

const CURRENT_USER_KEY  = 'bp_current_user';
const ASSIGNMENTS_KEY   = 'bp_assignments';
const SETTINGS_KEY      = 'bp_reader_settings';
const SEEDED_KEY        = 'bp_seeded';

// ── Bootstrap ────────────────────────────────────────────────────────────────

export function seedIfNeeded() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEEDED_KEY)) return;
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(DEMO_ASSIGNMENTS));
  localStorage.setItem(SEEDED_KEY, '1');
}

// ── Current user ─────────────────────────────────────────────────────────────

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  return DEMO_USERS.find(u => u.id === id) ?? null;
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUser(user: UserProfile) {
  localStorage.setItem(CURRENT_USER_KEY, user.id);
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getAllUsers(): UserProfile[] {
  return DEMO_USERS;
}

// ── Assignments ───────────────────────────────────────────────────────────────

export function getAssignments(): Assignment[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ASSIGNMENTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveAssignments(assignments: Assignment[]) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function addAssignment(a: Assignment) {
  const existing = getAssignments();
  // Prevent duplicate
  if (existing.some(e => e.student_id === a.student_id && e.book_id === a.book_id)) return;
  saveAssignments([...existing, a]);
}

export function removeAssignment(id: string) {
  saveAssignments(getAssignments().filter(a => a.id !== id));
}

// ── Reader settings ───────────────────────────────────────────────────────────

export function loadReaderSettings(): Partial<ReaderSettings> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function saveReaderSettings(s: ReaderSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
