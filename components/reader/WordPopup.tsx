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

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 600;

export default function WordPopup({ word, definition, phonetic, x, y, onSound, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mobile = isMobile();

  // Delay outside-click registration to avoid catching the tap that opened the popup.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      function handler(e: MouseEvent | TouchEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      }
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('touchstart', handler);
      };
    }, 120);
    return () => { active = false; clearTimeout(timer); };
  }, [onClose]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const actionBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    width: '100%', minHeight: 48,
    padding: '0.5rem 0.875rem',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.9375rem', fontWeight: 600,
    textAlign: 'left', touchAction: 'manipulation',
  };

  /* ── MOBILE: full-width bottom sheet ──────────────────────────── */
  if (mobile) {
    return (
      <>
        <div className="word-sheet-backdrop" onClick={onClose} aria-hidden="true" />
        <div
          ref={ref}
          className="word-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={`Options for: ${word}`}
        >
          <div className="word-sheet-handle" />

          {/* Word + phonetic */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text)', flex: 1 }}>
              {word}
            </span>
            {phonetic && (
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                {phonetic}
              </span>
            )}
          </div>

          {/* Definition card */}
          {definition ? (
            <div style={{
              padding: '0.75rem 0.875rem',
              backgroundColor: 'var(--bg)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              fontSize: '1rem', lineHeight: 1.55,
              color: 'var(--text)',
              marginBottom: '0.875rem',
            }}>
              <span style={{ fontSize: '1.125rem', marginRight: '0.375rem' }} aria-hidden="true">📖</span>
              {definition}
            </div>
          ) : (
            <p style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              No definition available for this word.
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { onSound(); onClose(); }} style={{ ...actionBtn, flex: 1 }}>
              <span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔊</span>
              Sound it out
            </button>
            <button onClick={onClose} style={{ ...actionBtn, flex: 'none', paddingLeft: '1rem', paddingRight: '1rem' }}>
              Done
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── DESKTOP: positioned card near tapped word ────────────────── */
  const POP_W = 256;
  const approxH = definition ? 200 : 130;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x - POP_W / 2;
  let top = y - approxH - 16;

  if (left < 8) left = 8;
  if (left + POP_W > vw - 8) left = vw - POP_W - 8;
  if (top < 56) top = y + 28;
  if (top + approxH > vh - 8) top = vh - approxH - 8;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Options for: ${word}`}
      style={{
        position: 'fixed', left, top, width: POP_W,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
        zIndex: 200,
        padding: '0.875rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        animation: 'fade-in 0.15s ease',
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
          aria-label="Close"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '1rem',
            minWidth: 28, minHeight: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px', padding: 0, touchAction: 'manipulation',
          }}
        >
          ✕
        </button>
      </div>

      {/* Sound button */}
      <button onClick={() => { onSound(); onClose(); }} style={actionBtn}>
        <span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔊</span>
        Sound it out
      </button>

      {/* Definition */}
      {definition ? (
        <div style={{
          padding: '0.625rem 0.75rem',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '0.875rem', lineHeight: 1.55,
          color: 'var(--text)',
        }}>
          <span style={{ fontSize: '1rem', marginRight: '0.25rem' }} aria-hidden="true">📖</span>
          {definition}
        </div>
      ) : (
        <div style={{
          padding: '0.375rem 0.75rem',
          fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic',
        }}>
          No definition for this word.
        </div>
      )}
    </div>
  );
}
