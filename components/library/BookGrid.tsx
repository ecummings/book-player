'use client';
import { BookSummary } from '@/lib/types';
import BookCard from './BookCard';

interface Props {
  books: BookSummary[];
  selectedGrade: string;
  onGradeChange: (g: string) => void;
}

const GRADES = ['All', 'K', '1', '2', '3', '4', '5', '6'];

export default function BookGrid({ books, selectedGrade, onGradeChange }: Props) {
  return (
    <div>
      {/* Grade filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
        role="group"
        aria-label="Filter by grade"
      >
        {GRADES.map((g) => (
          <button
            key={g}
            onClick={() => onGradeChange(g)}
            aria-label={g === 'All' ? 'Show all grades' : `Grade ${g}`}
            aria-pressed={selectedGrade === g}
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: '0 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontWeight: selectedGrade === g ? 700 : 400,
              backgroundColor: selectedGrade === g ? 'var(--accent)' : 'var(--surface)',
              color: selectedGrade === g ? 'var(--accent-fg)' : 'var(--text)',
              fontSize: '0.9375rem',
            }}
          >
            {g === 'All' ? 'All' : `Grade ${g}`}
          </button>
        ))}
      </div>

      {/* Book grid */}
      {books.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--muted)',
            fontSize: '1.125rem',
          }}
        >
          No books found for this grade
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}
          className="book-grid"
        >
          {books.map((book) => (
            <BookCard key={book.book_id} book={book} />
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .book-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .book-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
