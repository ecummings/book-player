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
const SPEED_LABELS: Record<number, string> = { 0.75: '¾×', 1: '1×', 1.25: '1¼×', 1.5: '1½×' };

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
  const isKinder = gradeBand === 'K-1';
  const showSpeed = (gradeBand === '2-3' || gradeBand === '4-6') && mode !== 'i-read';
  const btnSize = isKinder ? 52 : 44;
  const playSize = isKinder ? 68 : 60;

  // Build page dots — cap at 20 before switching to numeric only
  const showDots = totalPages <= 20;

  return (
    <div className="audio-controls">

      {/* ── Speed strip (only when relevant) ──────────────────────── */}
      {showSpeed && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              aria-label={`Speed ${s}x`}
              aria-pressed={speed === s}
              style={{
                minWidth: 48, minHeight: 32,
                padding: '0 0.5rem',
                border: '1.5px solid',
                borderColor: speed === s ? 'var(--accent)' : 'var(--border)',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: speed === s ? 700 : 400,
                backgroundColor: speed === s ? 'var(--accent)' : 'transparent',
                color: speed === s ? 'var(--accent-fg)' : 'var(--muted)',
                fontSize: '0.8125rem',
                transition: 'all 0.15s',
              }}
            >
              {SPEED_LABELS[s] ?? `${s}×`}
            </button>
          ))}
        </div>
      )}

      {/* ── Main controls row ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '0.5rem',
      }}>

        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          style={{
            minWidth: btnSize, minHeight: btnSize,
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            backgroundColor: 'var(--bg)',
            color: currentPage <= 1 ? 'var(--border)' : 'var(--text)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Center: dots + play */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.375rem', minWidth: 0,
        }}>
          {/* Play / Pause button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? 'Pause reading' : 'Play reading'}
            style={{
              width: playSize, height: playSize,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: isKinder ? '1.875rem' : '1.625rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
              transition: 'transform 0.1s, box-shadow 0.1s',
              flexShrink: 0,
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Page progress dots or text */}
          {showDots ? (
            <div style={{
              display: 'flex', gap: '4px', flexWrap: 'wrap',
              justifyContent: 'center', maxWidth: 200,
            }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === currentPage - 1 ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i < currentPage ? 'var(--accent)' : 'var(--border)',
                    transition: 'width 0.25s ease, background-color 0.25s',
                    display: 'inline-block',
                  }}
                />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
              {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {/* Next */}
        <button
          onClick={onNext}
          aria-label="Next page"
          style={{
            minWidth: btnSize, minHeight: btnSize,
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
