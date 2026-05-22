'use client';
import { useEffect } from 'react';
import { Book } from '@/lib/types';
import BookReader from './reader/BookReader';

interface Props {
  book: Book;
  onClose: () => void;
}

export default function BookPlayerModal({ book, onClose }: Props) {
  // Lock body scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on backdrop click (the outer wrapper, not the reader panel).
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    /* Semi-transparent backdrop */
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'flex-end',          // panel rises from the bottom
        justifyContent: 'center',
      }}
    >
      {/* Reader panel — full height on mobile, 96vh centered on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reading: ${book.title}`}
        style={{
          width: '100%',
          maxWidth: '860px',
          height: '96vh',
          backgroundColor: 'var(--bg)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modal-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.35)',
        }}
      >
        <BookReader book={book} onClose={onClose} />
      </div>
    </div>
  );
}
