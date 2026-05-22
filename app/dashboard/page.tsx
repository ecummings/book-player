import Link from 'next/link';

const METRIC_CARDS = [
  {
    label: 'Books Read',
    value: '—',
    description: 'Total books completed this session',
    icon: '📚',
  },
  {
    label: 'Avg Time per Page',
    value: '—',
    description: 'Average reading time per page',
    icon: '⏱',
  },
  {
    label: 'Most Popular Book',
    value: '—',
    description: 'Most frequently opened title',
    icon: '⭐',
  },
  {
    label: 'Words Tapped',
    value: '—',
    description: 'Words tapped for pronunciation help',
    icon: '🔊',
  },
];

export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 0.25rem',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            Teacher Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Reading analytics overview
          </p>
        </div>

        <Link
          href="/"
          aria-label="Back to library"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: '0 1.25rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-fg)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9375rem',
          }}
        >
          ← Library
        </Link>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Info notice */}
        <div
          role="note"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            fontSize: '0.9375rem',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          Analytics are stored locally per session. To view your class data, export from the student device.
        </div>

        {/* Metric cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {METRIC_CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '1.75rem' }} aria-hidden="true">
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                {card.description}
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder table */}
        <div
          style={{
            marginTop: '2rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            Recent Reading Sessions
          </div>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--bg)' }}>
                {['Book', 'Grade', 'Pages Read', 'Words Tapped', 'Duration'].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: 'left',
                      padding: '0.625rem 1.25rem',
                      color: 'var(--muted)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontStyle: 'italic',
                  }}
                >
                  No sessions recorded yet. Open a book to start reading.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
