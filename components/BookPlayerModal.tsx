'use client';
import { useEffect } from 'react';
import { Book } from '@/lib/types';
import BookReader from './reader/BookReader';

interface Props {
  book: Book;
  onClose: () => void;
}

export default function BookPlayerModal({ book, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reading: ${book.title}`}
        className="modal-panel"
      >
        <BookReader book={book} onClose={onClose} />
      </div>
    </div>
  );
}
