import Link from 'next/link';
import { BookSummary } from '@/lib/types';

interface Props {
  book: BookSummary;
}

export default function BookCard({ book }: Props) {
  return (
    <Link
      href={`/book/${book.book_id}`}
      aria-label={`Read "${book.title}" by ${book.author}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '220px',
        backgroundColor: book.cover_color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      }}
    >
      {/* Cover illustration */}
      {book.cover_illustration && (
        <div
          aria-label={book.cover_illustration.alt}
          style={{
            width: '100%',
            height: '120px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: book.cover_illustration.svg }}
        />
      )}

      {/* Card body */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.title}
        </div>

        {/* Author */}
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem' }}>
          {book.author}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
          {/* Grade badge */}
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '99px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Grade {book.grade}
          </span>

          {/* Lexile badge */}
          {book.lexile && (
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '99px',
                fontSize: '0.75rem',
              }}
            >
              {book.lexile}
            </span>
          )}

          {/* Page count */}
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '99px',
              fontSize: '0.75rem',
            }}
          >
            {book.page_count} {book.page_count === 1 ? 'page' : 'pages'}
          </span>
        </div>

        {/* Tag chips — first 2 */}
        {book.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {book.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
