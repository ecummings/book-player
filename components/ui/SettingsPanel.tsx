'use client';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: string;
  onTheme: (t: string) => void;
  fontSize: string;
  onFontSize: (s: string) => void;
  dyslexia: boolean;
  onDyslexia: (b: boolean) => void;
  highlightEnabled: boolean;
  onHighlight: (b: boolean) => void;
}

const THEMES = [
  { value: 'default',       label: 'Default',       bg: '#ffffff', text: '#1a1a1a' },
  { value: 'soft',          label: 'Soft',           bg: '#fff8f0', text: '#2d2d2d' },
  { value: 'dark',          label: 'Dark',           bg: '#1a1a2e', text: '#e8e8e8' },
  { value: 'high-contrast', label: 'High Contrast',  bg: '#000000', text: '#ffffff' },
] as const;

const FONT_SIZES = [
  { value: 'small',   label: 'A',  displaySize: '0.85rem',  hint: 'Small' },
  { value: 'default', label: 'A',  displaySize: '1rem',     hint: 'Default' },
  { value: 'large',   label: 'A',  displaySize: '1.25rem',  hint: 'Large' },
  { value: 'xlarge',  label: 'A',  displaySize: '1.55rem',  hint: 'X-Large' },
] as const;

const PREVIEW_TEXT = 'The sun shines brightly today.';

function Toggle({ checked, onChange, label, id }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; id: string;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 48, padding: '0 0.25rem', cursor: 'pointer', gap: '1rem',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '0.9375rem', color: 'var(--text)' }}>{label}</span>
      {/* Visually hidden native checkbox for accessibility */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        aria-checked={checked}
      />
      {/* Visual toggle track */}
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: checked ? 'var(--accent)' : 'var(--border)',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </span>
    </label>
  );
}

export default function SettingsPanel({
  open,
  onClose,
  theme,
  onTheme,
  fontSize,
  onFontSize,
  dyslexia,
  onDyslexia,
  highlightEnabled,
  onHighlight,
}: Props) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 40,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reader settings"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: '320px',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          color: 'var(--text)',
          zIndex: 50,
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          animation: 'panel-slide-in 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0,
          backgroundColor: 'var(--surface)',
          zIndex: 1,
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              minWidth: 36, minHeight: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none',
              borderRadius: '8px', cursor: 'pointer',
              color: 'var(--muted)', fontSize: '1.125rem',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ── Theme ─────────────────────────────────────────────── */}
          <section>
            <h3 style={sectionLabel}>Theme</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => onTheme(t.value)}
                  aria-pressed={theme === t.value}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: '0.375rem', padding: '0.625rem',
                    border: '2px solid',
                    borderColor: theme === t.value ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '10px', cursor: 'pointer',
                    background: 'transparent',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Color swatch */}
                  <span style={{
                    display: 'flex', width: '100%', height: 28, borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}>
                    <span style={{ flex: 1, backgroundColor: t.bg }} />
                    <span style={{ width: 8, backgroundColor: t.text, opacity: 0.35 }} />
                  </span>
                  <span style={{
                    fontSize: '0.8125rem', fontWeight: theme === t.value ? 700 : 400,
                    color: 'var(--text)',
                  }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Font Size ──────────────────────────────────────────── */}
          <section>
            <h3 style={sectionLabel}>Book Text Size</h3>
            {/* Size picker chips */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => onFontSize(s.value)}
                  aria-pressed={fontSize === s.value}
                  title={s.hint}
                  style={{
                    flex: 1, minHeight: 44,
                    border: '2px solid',
                    borderColor: fontSize === s.value ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: fontSize === s.value ? 'var(--accent)' : 'transparent',
                    color: fontSize === s.value ? 'var(--accent-fg)' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: s.displaySize,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                    lineHeight: 1,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {/* Live preview — uses inline style so it reflects the setting without .book-content wrapper */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: { small: '0.875rem', default: '1rem', large: '1.25rem', xlarge: '1.5rem' }[fontSize] ?? '1rem',
              lineHeight: 1.6,
              color: 'var(--text)',
              transition: 'font-size 0.15s',
            }}>
              {PREVIEW_TEXT}
            </div>
          </section>

          {/* ── Reading Aid Toggles ────────────────────────────────── */}
          <section>
            <h3 style={sectionLabel}>Reading Aids</h3>
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '0 0.75rem', borderBottom: '1px solid var(--border)' }}>
                <Toggle
                  id="dyslexia-toggle"
                  checked={dyslexia}
                  onChange={onDyslexia}
                  label="Dyslexia-friendly font"
                />
              </div>
              <div style={{ padding: '0 0.75rem' }}>
                <Toggle
                  id="highlight-toggle"
                  checked={highlightEnabled}
                  onChange={onHighlight}
                  label="Highlight words while reading"
                />
              </div>
            </div>
          </section>

        </div>
      </div>

      <style>{`
        @keyframes panel-slide-in {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 0.625rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--muted)',
};
