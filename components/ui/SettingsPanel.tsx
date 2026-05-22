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

  const minSize = { minWidth: 44, minHeight: 44 };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 40,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          color: 'var(--text)',
          zIndex: 50,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              ...minSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '1.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Theme */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
            Theme
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(['default', 'soft', 'high-contrast', 'dark'] as const).map((t) => (
              <label
                key={t}
                style={{
                  ...minSize,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: theme === t ? 'var(--accent)' : 'transparent',
                  color: theme === t ? 'var(--accent-fg)' : 'var(--text)',
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => onTheme(t)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {t === 'default' ? 'Default' : t === 'soft' ? 'Soft' : t === 'high-contrast' ? 'High Contrast' : 'Dark'}
              </label>
            ))}
          </div>
        </section>

        {/* Font Size */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
            Font Size
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(['small', 'default', 'large', 'xlarge'] as const).map((s) => (
              <label
                key={s}
                style={{
                  ...minSize,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: fontSize === s ? 'var(--accent)' : 'transparent',
                  color: fontSize === s ? 'var(--accent-fg)' : 'var(--text)',
                }}
              >
                <input
                  type="radio"
                  name="fontSize"
                  value={s}
                  checked={fontSize === s}
                  onChange={() => onFontSize(s)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {s === 'small' ? 'Small' : s === 'default' ? 'Default' : s === 'large' ? 'Large' : 'Extra Large'}
              </label>
            ))}
          </div>
        </section>

        {/* Dyslexia Mode */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
            Dyslexia Mode
          </h3>
          <label
            style={{
              ...minSize,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0 0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={dyslexia}
              onChange={(e) => onDyslexia(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
            />
            <span>Enable dyslexia-friendly font spacing</span>
          </label>
        </section>

        {/* Word Highlight */}
        <section>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
            Word Highlight
          </h3>
          <label
            style={{
              ...minSize,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0 0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={highlightEnabled}
              onChange={(e) => onHighlight(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
            />
            <span>Highlight words as they are read</span>
          </label>
        </section>
      </div>
    </>
  );
}
