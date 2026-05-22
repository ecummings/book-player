'use client';

interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  speed: number;
  onSpeed: (s: number) => void;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  gradeBand: string;
  mode: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export default function AudioControls({
  isPlaying,
  onPlay,
  onPause,
  speed,
  onSpeed,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  gradeBand,
  mode,
}: Props) {
  const prevNextSize = gradeBand === 'K-1' ? 56 : gradeBand === '2-3' ? 48 : 44;
  const showSpeed = (gradeBand === '2-3' || gradeBand === '4-6') && mode !== 'i-read';

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 10,
      }}
    >
      {/* Speed controls */}
      {showSpeed && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              aria-label={`Set speed to ${s}x`}
              style={{
                minWidth: 44,
                minHeight: 44,
                padding: '0 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: speed === s ? 700 : 400,
                backgroundColor: speed === s ? 'var(--accent)' : 'var(--surface)',
                color: speed === s ? 'var(--accent-fg)' : 'var(--text)',
                fontSize: '0.875rem',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      )}

      {/* Main controls row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          style={{
            minWidth: prevNextSize,
            minHeight: prevNextSize,
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        {/* Center: play/pause + page indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          style={{
            minWidth: prevNextSize,
            minHeight: prevNextSize,
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
