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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${book.title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <BookReader book={book} onClose={onClose} />
    </div>
  );
}
