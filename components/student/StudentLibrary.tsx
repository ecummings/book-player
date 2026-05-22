'use client';
import { useState, useCallback } from 'react';
import { BookSummary, Book, UserProfile, Assignment } from '@/lib/types';
import { getAssignments } from '@/lib/storage';
import { clearCurrentUser } from '@/lib/storage';
import BookPlayerModal from '@/components/BookPlayerModal';

interface Props {
  student: UserProfile;
  books: BookSummary[];
  onLogout: () => void;
}

const GRADES = ['All', 'K', '1', '2', '3', '4', '5', '6'];

export default function StudentLibrary({ student, books, onLogout }: Props) {
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [openBook, setOpenBook]           = useState<Book | null>(null);
  const [loadingId, setLoadingId]         = useState<string | null>(null);

  const assignments: Assignment[] = getAssignments().filter(a => a.student_id === student.id);
  const assignedBookIds = new Set(assignments.map(a => a.book_id));

  const filteredBooks = books.filter(b => {
    const matchesGrade  = selectedGrade === 'All' || b.grade === selectedGrade;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' || b.title.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q));
    return matchesGrade && matchesSearch;
  });

  const assignedBooks  = filteredBooks.filter(b => assignedBookIds.has(b.book_id));
  const otherBooks     = filteredBooks.filter(b => !assignedBookIds.has(b.book_id));

  const openBookById = useCallback(async (bookId: string) => {
    setLoadingId(bookId);
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (!res.ok) throw new Error('Not found');
      const book: Book = await res.json();
      setOpenBook(book);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handleLogout = () => {
    clearCurrentUser();
    onLogout();
  };

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        {/* Header */}
        <header style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>{student.avatar}</span>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Hi, {student.name.split(' ')[0]}!</h1>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>Grade {student.grade_band} · {assignedBookIds.size} book{assignedBookIds.size !== 1 ? 's' : ''} assigned</p>
                </div>
              </div>
              <button onClick={handleLogout} style={{ minHeight: 40, padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                Switch Profile
              </button>
            </div>

            {/* Search */}
            <div style={{ marginTop: '1rem' }}>
              <input
                type="search"
                placeholder="Search books..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search books"
                style={{ width: '100%', maxWidth: '380px', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', minHeight: 44 }}
              />
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
          {/* Grade filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} role="group" aria-label="Filter by grade">
            {GRADES.map(g => (
              <button key={g} onClick={() => setSelectedGrade(g)} aria-pressed={selectedGrade === g}
                style={{ minWidth: 44, minHeight: 44, padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: selectedGrade === g ? 700 : 400, backgroundColor: selectedGrade === g ? 'var(--accent)' : 'var(--surface)', color: selectedGrade === g ? 'var(--accent-fg)' : 'var(--text)', fontSize: '0.9375rem' }}>
                {g === 'All' ? 'All' : `Grade ${g}`}
              </button>
            ))}
          </div>

          {/* Assigned books */}
          {assignedBooks.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 Assigned by Your Teacher
              </h2>
              <BookGrid books={assignedBooks} loadingId={loadingId} onOpen={openBookById} badge="assigned" />
            </section>
          )}

          {/* All books */}
          <section>
            {assignedBooks.length > 0 && (
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700 }}>📚 All Books</h2>
            )}
            {otherBooks.length === 0 && assignedBooks.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem 0', fontSize: '1.125rem' }}>No books found.</p>
            ) : (
              <BookGrid books={otherBooks} loadingId={loadingId} onOpen={openBookById} />
            )}
          </section>
        </main>
      </div>

      {/* Popup player */}
      {openBook && <BookPlayerModal book={openBook} onClose={() => setOpenBook(null)} />}
    </>
  );
}

// ── Inline grid component ─────────────────────────────────────────────────────

function BookGrid({ books, loadingId, onOpen, badge }: {
  books: BookSummary[];
  loadingId: string | null;
  onOpen: (id: string) => void;
  badge?: 'assigned';
}) {
  if (books.length === 0) return null;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="student-book-grid">
        {books.map(book => (
          <BookTile key={book.book_id} book={book} loading={loadingId === book.book_id} onOpen={onOpen} badge={badge} />
        ))}
      </div>
      <style>{`
        @media (min-width: 600px)  { .student-book-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 900px)  { .student-book-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 1200px) { .student-book-grid { grid-template-columns: repeat(5, 1fr) !important; } }
      `}</style>
    </>
  );
}

function BookTile({ book, loading, onOpen, badge }: {
  book: BookSummary;
  loading: boolean;
  onOpen: (id: string) => void;
  badge?: 'assigned';
}) {
  return (
    <button
      onClick={() => !loading && onOpen(book.book_id)}
      disabled={loading}
      aria-label={`Open "${book.title}"`}
      style={{
        display: 'block', width: '100%', textAlign: 'left', border: 'none', padding: 0,
        borderRadius: '12px', overflow: 'hidden', minHeight: '200px',
        backgroundColor: book.cover_color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }}}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
    >
      {badge === 'assigned' && (
        <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#10b981', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', zIndex: 1 }}>
          ✓ Assigned
        </div>
      )}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 2 }}>
          <span style={{ color: '#fff', fontSize: '1.5rem' }}>⏳</span>
        </div>
      )}
      {book.cover_illustration && (
        <div style={{ width: '100%', height: '110px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: book.cover_illustration.svg }} />
      )}
      <div style={{ padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {book.title}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>{book.author}</div>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', padding: '1px 6px', borderRadius: '99px', fontSize: '0.6875rem', fontWeight: 600 }}>Grade {book.grade}</span>
          {book.lexile && <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 6px', borderRadius: '99px', fontSize: '0.6875rem' }}>{book.lexile}</span>}
        </div>
      </div>
    </button>
  );
}
