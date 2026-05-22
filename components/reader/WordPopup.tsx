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

  // Delay registering the outside-click handler by one frame.
  // On mobile, the tap that opened the popup also generates a synthetic
  // mousedown event ~50–100ms later. Without the delay, that mousedown
  // hits document, is treated as an "outside click", and immediately closes
  // the popup before the user can see it.
  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      function handler(e: MouseEvent | TouchEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          onClose();
        }
      }

      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler, { passive: true });

      // Store cleanup on the timer-returned closure so we can run it on unmount.
      (handler as { cleanup?: () => void }).cleanup = () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('touchstart', handler);
      };

      // Attach to ref so unmount cleanup can call it.
      (ref as React.MutableRefObject<HTMLDivElement & { _handler?: typeof handler }>).current!._handler = handler;
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
      const h = (ref as React.MutableRefObject<(HTMLDivElement & { _handler?: (e: MouseEvent | TouchEvent) => void }) | null>).current?._handler;
      if (h) {
        document.removeEventListener('mousedown', h);
        document.removeEventListener('touchstart', h);
      }
    };
  }, [onClose]);

  // Escape key always works immediately.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Position popup inside viewport.
  const POP_W = 240;
  const approxH = definition ? 190 : 120;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 667;

  let left = x - POP_W / 2;
  let top = y - approxH - 16;

  if (left < 8) left = 8;
  if (left + POP_W > vw - 8) left = vw - POP_W - 8;
  if (top < 56) top = y + 28; // flip below tapped word if too close to top
  if (top + approxH > vh - 8) top = vh - approxH - 8;

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
    touchAction: 'manipulation',
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Options for: ${word}`}
      style={{
        position: 'fixed',
        left,
        top,
        width: POP_W,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        zIndex: 200,
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Word header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text)', flex: 1 }}>
          {word}
        </span>
        {phonetic && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            {phonetic}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Close word options"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '1rem',
            padding: '0 0.125rem',
            minWidth: 32,
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
          }}
        >
          ✕
        </button>
      </div>

      {/* Sound button */}
      <button
        onClick={() => { onSound(); onClose(); }}
        style={btnStyle}
        aria-label={`Sound out the word: ${word}`}
      >
        <span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔊</span>
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
            lineHeight: 1.55,
            color: 'var(--text)',
          }}
        >
          <span style={{ fontSize: '1rem', marginRight: '0.25rem' }} aria-hidden="true">📖</span>
          {definition}
        </div>
      ) : (
        <div
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
        >
          No definition for this word.
        </div>
      )}
    </div>
  );
}
