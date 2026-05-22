'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserProfile, BookSummary, Assignment, AnalyticsEvent, Book } from '@/lib/types';
import { DEMO_USERS } from '@/lib/demoUsers';
import { getAssignments, addAssignment, removeAssignment, clearCurrentUser } from '@/lib/storage';
import BookPlayerModal from '@/components/BookPlayerModal';

const EVENTS_KEY = 'bp_analytics_events';

interface Props {
  teacher: UserProfile;
  books: BookSummary[];
  onLogout: () => void;
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

function loadEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function fmt(ms: number): string {
  if (!ms || ms < 1000) return '< 1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface StudentStats {
  sessions: number;
  booksOpened: number;
  booksCompleted: number;
  pagesRead: number;
  wordsTapped: number;
  defsShown: number;
  totalDwellMs: number;
  avgDwellMs: number;
  lastSeen: number;
  topWords: [string, number][];
  modeUsage: Record<string, number>;
  audioStarts: number;
}

function computeStats(studentId: string, events: AnalyticsEvent[]): StudentStats {
  const ev = events.filter(e => e.properties.student_id === studentId);
  const sessions     = new Set(ev.map(e => e.session_id)).size;
  const booksOpened  = ev.filter(e => e.event === 'book_opened').length;
  const booksCompleted = ev.filter(e => e.event === 'book_completed').length;
  const pagesRead    = ev.filter(e => e.event === 'page_viewed').length;
  const wordTaps     = ev.filter(e => e.event === 'word_tapped');
  const wordsTapped  = wordTaps.length;
  const defsShown    = wordTaps.filter(e => e.properties.definition_shown === true).length;
  const completions  = ev.filter(e => e.event === 'page_completed');
  const totalDwellMs = completions.reduce((s, e) => s + Number(e.properties.dwell_ms ?? 0), 0);
  const avgDwellMs   = completions.length > 0 ? totalDwellMs / completions.length : 0;
  const lastSeen     = ev.length > 0 ? Math.max(...ev.map(e => e.timestamp)) : 0;
  const wordFreq     = new Map<string, number>();
  wordTaps.forEach(e => {
    const w = String(e.properties.text ?? '').replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (w) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  });
  const topWords = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const modeUsage: Record<string, number> = {};
  ev.filter(e => e.event === 'book_opened').forEach(e => {
    const m = String(e.properties.mode ?? 'unknown');
    modeUsage[m] = (modeUsage[m] ?? 0) + 1;
  });
  const audioStarts = ev.filter(e => e.event === 'audio_started').length;
  return { sessions, booksOpened, booksCompleted, pagesRead, wordsTapped, defsShown, totalDwellMs, avgDwellMs, lastSeen, topWords, modeUsage, audioStarts };
}

function generateInsights(student: UserProfile, stats: StudentStats, assignmentCount: number): string[] {
  const insights: string[] = [];
  if (stats.sessions === 0) {
    insights.push(`${student.name.split(' ')[0]} has not read anything yet${assignmentCount > 0 ? ` — ${assignmentCount} book${assignmentCount > 1 ? 's' : ''} assigned and waiting` : ''}.`);
    return insights;
  }

  // Engagement
  const completionRate = stats.booksOpened > 0 ? stats.booksCompleted / stats.booksOpened : 0;
  if (completionRate >= 0.7) {
    insights.push(`Strong engagement: completed ${stats.booksCompleted} of ${stats.booksOpened} books (${Math.round(completionRate * 100)}% completion rate).`);
  } else if (stats.booksOpened > 1) {
    insights.push(`Opened ${stats.booksOpened} books but completed ${stats.booksCompleted}. Shorter reading sessions or shorter books may help build completion confidence.`);
  }

  // Fluency — compare avg dwell time to grade-band expectations
  if (stats.avgDwellMs > 0 && stats.pagesRead >= 3) {
    const expected = student.grade_band === 'K-1' ? 60_000 : student.grade_band === '2-3' ? 42_000 : 28_000;
    const ratio = stats.avgDwellMs / expected;
    if (ratio < 0.5) {
      insights.push(`Average page time of ${fmt(stats.avgDwellMs)} is faster than expected for ${student.grade_band}. May be skimming — consider switching to "Read With Me" mode.`);
    } else if (ratio > 2.2) {
      insights.push(`Spending ${fmt(stats.avgDwellMs)} per page — above the expected range for ${student.grade_band}. This may signal reading difficulty; one-on-one support could help.`);
    } else {
      insights.push(`Reading pace of ${fmt(stats.avgDwellMs)}/page is within the expected range for ${student.grade_band}. Fluency looks on track.`);
    }
  }

  // Comprehension / vocabulary
  if (stats.wordsTapped >= 5) {
    const defPct = stats.wordsTapped > 0 ? Math.round(stats.defsShown / stats.wordsTapped * 100) : 0;
    insights.push(`Tapped ${stats.wordsTapped} words for pronunciation; ${stats.defsShown} definitions shown (${defPct}% lookup rate). Active vocabulary exploration is a good sign.`);
  } else if (stats.pagesRead >= 8 && stats.wordsTapped === 0) {
    insights.push(`No word taps recorded across ${stats.pagesRead} pages. Encourage use of the tap-to-pronounce feature to build vocabulary.`);
  }

  // Audio / mode
  const topMode = Object.entries(stats.modeUsage).sort((a, b) => b[1] - a[1])[0];
  if (topMode) {
    const modeLabel: Record<string, string> = { 'read-to-me': 'Read to Me', 'read-with-me': 'Read With Me', 'i-read': 'I Read', 'practice': 'Practice' };
    insights.push(`Preferred reading mode: "${modeLabel[topMode[0]] ?? topMode[0]}".${topMode[0] === 'read-to-me' && student.grade_band !== 'K-1' ? ' Consider encouraging "I Read" for more independent practice.' : ''}`);
  }

  return insights;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)', minWidth: 80 }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginTop: '0.125rem', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Student detail panel ──────────────────────────────────────────────────────

function StudentDetail({ student, stats, assignments, books, onClose, onAddAssignment, onRemoveAssignment }: {
  student: UserProfile;
  stats: StudentStats;
  assignments: Assignment[];
  books: BookSummary[];
  onClose: () => void;
  onAddAssignment: (bookId: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const [addingBook, setAddingBook] = useState(false);
  const [openBook, setOpenBook]     = useState<Book | null>(null);
  const [loadingId, setLoadingId]   = useState<string | null>(null);

  const assignedIds = new Set(assignments.map(a => a.book_id));
  const insights    = generateInsights(student, stats, assignments.length);

  const openPreview = async (bookId: string) => {
    setLoadingId(bookId);
    try {
      const res  = await fetch(`/api/books/${bookId}`);
      const book: Book = await res.json();
      setOpenBook(book);
    } catch { /* ignore */ }
    finally { setLoadingId(null); }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={`${student.name} details`}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480, backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 101, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>{student.avatar}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{student.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Grade {student.grade_band}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ minWidth: 36, minHeight: 36, background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <StatPill label="Sessions"   value={stats.sessions} />
          <StatPill label="Pages Read" value={stats.pagesRead} />
          <StatPill label="Books Done" value={stats.booksCompleted} />
          <StatPill label="Words Tapped" value={stats.wordsTapped} />
          {stats.avgDwellMs > 0 && <StatPill label="Avg/Page" value={fmt(stats.avgDwellMs)} />}
          {stats.lastSeen > 0 && <StatPill label="Last Seen" value={fmtDate(stats.lastSeen)} />}
        </div>

        {/* Teacher insights */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Teacher Insights</h3>
          {insights.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No data available yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {insights.map((ins, i) => (
                <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.55, color: 'var(--text)' }}>{ins}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Top vocabulary words */}
        {stats.topWords.length > 0 && (
          <section>
            <h3 style={{ margin: '0 0 0.625rem', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Most-Tapped Words</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {stats.topWords.map(([word, count]) => (
                <span key={word} style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}>
                  <strong>{word}</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>×{count}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Assignments */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>
              Assigned Books ({assignments.length})
            </h3>
            <button onClick={() => setAddingBook(v => !v)} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
              {addingBook ? '✕ Cancel' : '+ Assign Book'}
            </button>
          </div>

          {addingBook && (
            <div style={{ marginBottom: '0.75rem', maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {books.filter(b => !assignedIds.has(b.book_id)).map(b => (
                <button key={b.book_id} onClick={() => { onAddAssignment(b.book_id); setAddingBook(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 0.875rem', border: 'none', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: b.cover_color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{b.title}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Gr. {b.grade}</span>
                </button>
              ))}
              {books.filter(b => !assignedIds.has(b.book_id)).length === 0 && (
                <p style={{ padding: '1rem', color: 'var(--muted)', margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>All books already assigned.</p>
              )}
            </div>
          )}

          {assignments.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No books assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {assignments.map(a => {
                const book = books.find(b => b.book_id === a.book_id);
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {book && <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: book.cover_color, flexShrink: 0 }} />}
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>{book?.title ?? a.book_id}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{fmtDate(a.assigned_at)}</span>
                    <button onClick={() => openPreview(a.book_id)} disabled={loadingId === a.book_id}
                      style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem' }}>
                      Preview
                    </button>
                    <button onClick={() => onRemoveAssignment(a.id)} aria-label="Remove assignment"
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.125rem' }}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {openBook && <BookPlayerModal book={openBook} onClose={() => setOpenBook(null)} />}
    </>
  );
}

// ── Main teacher dashboard ────────────────────────────────────────────────────

export default function TeacherDashboard({ teacher, books, onLogout }: Props) {
  const [events, setEvents]           = useState<AnalyticsEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<'students' | 'overview'>('students');

  useEffect(() => {
    setEvents(loadEvents());
    setAssignments(getAssignments());
  }, []);

  const myStudents = DEMO_USERS.filter(u => u.role === 'student' && u.teacher_id === teacher.id);

  const statsMap = useMemo(() =>
    Object.fromEntries(myStudents.map(s => [s.id, computeStats(s.id, events)])),
    [myStudents, events]
  );

  const handleAddAssignment = useCallback((studentId: string, bookId: string) => {
    const a: Assignment = {
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      teacher_id: teacher.id,
      student_id: studentId,
      book_id: bookId,
      assigned_at: Date.now(),
    };
    addAssignment(a);
    setAssignments(getAssignments());
  }, [teacher.id]);

  const handleRemoveAssignment = useCallback((id: string) => {
    removeAssignment(id);
    setAssignments(getAssignments());
  }, []);

  const handleLogout = () => { clearCurrentUser(); onLogout(); };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 40, padding: '0 1.25rem', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontWeight: active ? 700 : 400,
    backgroundColor: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-fg)' : 'var(--text)',
    fontSize: '0.9375rem', whiteSpace: 'nowrap',
  });

  // Class-level aggregates for overview
  const classStats = useMemo(() => {
    const totalSessions  = myStudents.reduce((s, st) => s + statsMap[st.id].sessions, 0);
    const totalPages     = myStudents.reduce((s, st) => s + statsMap[st.id].pagesRead, 0);
    const totalWords     = myStudents.reduce((s, st) => s + statsMap[st.id].wordsTapped, 0);
    const totalCompleted = myStudents.reduce((s, st) => s + statsMap[st.id].booksCompleted, 0);
    const activeStudents = myStudents.filter(st => statsMap[st.id].sessions > 0).length;
    return { totalSessions, totalPages, totalWords, totalCompleted, activeStudents };
  }, [myStudents, statsMap]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <span style={{ fontSize: '2rem' }}>{teacher.avatar}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{teacher.name}</h1>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>{teacher.class_name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <a href="/admin" style={{ minHeight: 40, padding: '0 0.875rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>⚙ Admin</a>
            <button onClick={handleLogout} style={{ minHeight: 40, padding: '0 0.875rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Switch Profile</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.625rem 1.5rem', display: 'flex', gap: '0.375rem', overflowX: 'auto' }}>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>👥 My Students</button>
        <button style={tabStyle(tab === 'overview')} onClick={() => setTab('overview')}>📊 Class Overview</button>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ── Students tab ── */}
        {tab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myStudents.map(student => {
              const s = statsMap[student.id];
              const myAssignments = assignments.filter(a => a.student_id === student.id);
              return (
                <div key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedStudent(student)}
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>

                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{student.avatar}</span>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Grade {student.grade_band} · {myAssignments.length} assigned</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                    <StatPill label="Sessions"    value={s.sessions} />
                    <StatPill label="Pages Read"  value={s.pagesRead} />
                    <StatPill label="Words Tapped" value={s.wordsTapped} />
                    {s.lastSeen > 0 && <StatPill label="Last Seen" value={fmtDate(s.lastSeen)} />}
                  </div>

                  {s.sessions === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '99px', flexShrink: 0 }}>
                      Not started
                    </span>
                  )}

                  <span style={{ color: 'var(--muted)', fontSize: '1.25rem', flexShrink: 0 }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Class metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { icon: '👥', label: 'Active Students', value: `${classStats.activeStudents} / ${myStudents.length}` },
                { icon: '📖', label: 'Sessions Total', value: classStats.totalSessions },
                { icon: '📄', label: 'Pages Read', value: classStats.totalPages },
                { icon: '🔊', label: 'Words Tapped', value: classStats.totalWords },
                { icon: '✅', label: 'Books Completed', value: classStats.totalCompleted },
              ].map(m => (
                <div key={m.label} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{m.icon}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{m.value}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Per-student progress table */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Student Progress</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 550 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      {['Student', 'Grade', 'Sessions', 'Pages', 'Books Done', 'Avg/Page', 'Last Active'].map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '0.625rem 1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myStudents.map((student, i) => {
                      const s = statsMap[student.id];
                      return (
                        <tr key={student.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{student.avatar} {student.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{student.grade_band}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{s.sessions}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{s.pagesRead}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{s.booksCompleted}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{s.avgDwellMs > 0 ? fmt(s.avgDwellMs) : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s.lastSeen > 0 ? fmtDate(s.lastSeen) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Student detail panel */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          stats={statsMap[selectedStudent.id]}
          assignments={assignments.filter(a => a.student_id === selectedStudent.id)}
          books={books}
          onClose={() => setSelectedStudent(null)}
          onAddAssignment={bookId => handleAddAssignment(selectedStudent.id, bookId)}
          onRemoveAssignment={handleRemoveAssignment}
        />
      )}
    </div>
  );
}
