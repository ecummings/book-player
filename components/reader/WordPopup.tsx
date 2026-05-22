'use client';
import { useEffect, useRef } from 'react';

interface Props {
  word: string;
  definition?: string;
  phonetic?: string;
  x: number;
  y: number;
  onSound: () => void;
  onClose: () => void;
}

export default function WordPopup({ word, definition, phonetic, x, y, onSound, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside tap/click.
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  // Close on Escape.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Position popup so it stays inside the viewport.
  const POP_W = 240;
  const POP_H = definition ? 180 : 110;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 667;

  let left = x - POP_W / 2;
  let top = y - POP_H - 12;

  if (left < 8) left = 8;
  if (left + POP_W > vw - 8) left = vw - POP_W - 8;
  if (top < 8) top = y + 24; // flip below if too close to top

  // Clamp vertically.
  if (top + POP_H > vh - 8) top = vh - POP_H - 8;

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    minHeight: 44,
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    fontWeight: 600,
    textAlign: 'left',
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Options for word: ${word}`}
      aria-modal="true"
      style={{
        position: 'fixed',
        left,
        top,
        width: POP_W,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 200,
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Word header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text)' }}>
          {word}
        </span>
        {phonetic && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            {phonetic}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '1.125rem',
            padding: '0 0.25rem',
            minWidth: 32,
            minHeight: 32,
          }}
        >
          ✕
        </button>
      </div>

      {/* Sound button */}
      <button
        onClick={() => { onSound(); onClose(); }}
        style={btnStyle}
        aria-label={`Sound out: ${word}`}
      >
        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🔊</span>
        Sound it out
      </button>

      {/* Definition */}
      {definition ? (
        <div
          style={{
            padding: '0.625rem 0.75rem',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--text)',
          }}
        >
          <span style={{ fontSize: '1rem', marginRight: '0.375rem' }} aria-hidden="true">📖</span>
          {definition}
        </div>
      ) : (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
        >
          No definition available for this word.
        </div>
      )}
    </div>
  );
}
