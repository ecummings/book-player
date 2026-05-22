'use client';
import { useState } from 'react';
import { BookSummary } from '@/lib/types';
import BookGrid from './BookGrid';

interface Props {
  books: BookSummary[];
}

export default function LibraryPage({ books }: Props) {
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter((book) => {
    const matchesGrade = selectedGrade === 'All' || book.grade === selectedGrade;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      book.title.toLowerCase().includes(query) ||
      book.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesGrade && matchesSearch;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem 1rem 1rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>
                Book Library
              </h1>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
                K–6 digital books for every reader
              </p>
            </div>
            <a href="/admin" style={{
              minHeight: 40, padding: '0 1rem', borderRadius: '8px',
              border: '1px solid var(--border)', backgroundColor: 'var(--surface)',
              color: 'var(--text)', textDecoration: 'none', fontWeight: 600,
              fontSize: '0.875rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
            }}>
              ⚙ Admin
            </a>
          </div>

          {/* Search input */}
          <div style={{ marginTop: '1rem' }}>
            <input
              type="search"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search books"
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '1rem',
                minHeight: 44,
              }}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <BookGrid
          books={filteredBooks}
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
        />
      </main>
    </div>
  );
}
