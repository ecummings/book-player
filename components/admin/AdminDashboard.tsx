'use client';
import { useEffect, useMemo, useState } from 'react';
import { VOICE_KEY } from '@/hooks/useSpeech';
import { AnalyticsEvent } from '@/lib/types';

const EVENTS_KEY = 'bp_analytics_events';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  if (ms < 1000) return '< 1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Session aggregation (for Sessions tab) ───────────────────────────────────

interface SessionSummary {
  session_id: string;
  book_id: string;
  book_title?: string;
  grade?: string;
  pages_viewed: number;
  words_tapped: number;
  sentences_replayed: number;
  audio_starts: number;
  dwell_ms: number;
  started_at: number;
  mode?: string;
}

function aggregateSessions(events: AnalyticsEvent[]): SessionSummary[] {
  const sessions = new Map<string, SessionSummary>();
  for (const ev of events) {
    const sid = ev.session_id;
    if (!sessions.has(sid)) {
      sessions.set(sid, {
        session_id: sid,
        book_id: String(ev.properties.book_id ?? ''),
        pages_viewed: 0,
        words_tapped: 0,
        sentences_replayed: 0,
        audio_starts: 0,
        dwell_ms: 0,
        started_at: ev.timestamp,
      });
    }
    const s = sessions.get(sid)!;
    if (ev.timestamp < s.started_at) s.started_at = ev.timestamp;
    switch (ev.event) {
      case 'book_opened':
        s.book_title = String(ev.properties.title ?? s.book_id);
        s.grade = String(ev.properties.grade_band ?? '');
        s.mode = String(ev.properties.mode ?? '');
        break;
      case 'page_viewed': s.pages_viewed++; break;
      case 'page_completed': s.dwell_ms += Number(ev.properties.dwell_ms ?? 0); break;
      case 'word_tapped': s.words_tapped++; break;
      case 'sentence_replayed': s.sentences_replayed++; break;
      case 'audio_started': s.audio_starts++; break;
    }
  }
  return Array.from(sessions.values()).sort((a, b) => b.started_at - a.started_at);
}

// ─── Voice selector ───────────────────────────────────────────────────────────

function VoiceSelector() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    setSelected(localStorage.getItem(VOICE_KEY) ?? '');
  }, []);

  const handleSelect = (uri: string) => {
    setSelected(uri);
    if (uri) localStorage.setItem(VOICE_KEY, uri);
    else localStorage.removeItem(VOICE_KEY);
  };

  const handlePreview = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance('The quick brown fox jumps over the lazy dog.');
    u.rate = 0.9;
    const voice = voices.find(v => v.voiceURI === selected);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  const card: React.CSSProperties = {
    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '1.25rem',
  };

  return (
    <div style={card}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700 }}>🎙 Reader Voice</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
        Choose the voice used for narration across all books. English voices are shown.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: 260, overflowY: 'auto' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: selected === '' ? 'var(--accent)' : 'transparent', color: selected === '' ? 'var(--accent-fg)' : 'var(--text)' }}>
          <input type="radio" name="voice" value="" checked={selected === ''} onChange={() => handleSelect('')} style={{ accentColor: 'var(--accent)' }} />
          <span><strong>System default</strong><span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.75 }}>Uses the device&apos;s default voice</span></span>
        </label>
        {voices.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '0.5rem' }}>No voices found. Try interacting with the page first.</p>}
        {voices.map(v => (
          <label key={v.voiceURI} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: selected === v.voiceURI ? 'var(--accent)' : 'transparent', color: selected === v.voiceURI ? 'var(--accent-fg)' : 'var(--text)' }}>
            <input type="radio" name="voice" value={v.voiceURI} checked={selected === v.voiceURI} onChange={() => handleSelect(v.voiceURI)} style={{ accentColor: 'var(--accent)' }} />
            <span><strong>{v.name}</strong><span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.75 }}>{v.lang}{v.localService ? ' · Local' : ' · Network'}</span></span>
          </label>
        ))}
      </div>
      <button onClick={handlePreview} style={{ minHeight: 44, padding: '0 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem' }}>
        🔊 Preview voice
      </button>
    </div>
  );
}

// ─── Statistics panel ─────────────────────────────────────────────────────────

interface StatRow { label: string; value: string | number; sub?: string }

function CategoryStats({ icon, title, stats, noDataMsg }: { icon: string; title: string; stats: StatRow[]; noDataMsg?: string }) {
  const hasAnyValue = stats.some(s => s.value !== 0 && s.value !== '—' && s.value !== '0');
  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span aria-hidden="true">{icon}</span> {title}
      </div>
      {!hasAnyValue && noDataMsg ? (
        <p style={{ padding: '1rem 1.25rem', color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>{noDataMsg}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0', padding: '0' }}>
          {stats.map((row, i) => (
            <div key={row.label} style={{ padding: '1rem 1.25rem', borderRight: i < stats.length - 1 ? '1px solid var(--border)' : undefined }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>{row.value}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{row.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatisticsPanel({ events }: { events: AnalyticsEvent[] }) {
  // ── Engagement ──────────────────────────────────────────────────
  const totalSessions = new Set(events.map(e => e.session_id)).size;
  const booksOpened = events.filter(e => e.event === 'book_opened').length;
  const booksCompleted = events.filter(e => e.event === 'book_completed').length;
  const pagesViewed = events.filter(e => e.event === 'page_viewed').length;
  const avgPagesPerSession = totalSessions > 0 ? (pagesViewed / totalSessions).toFixed(1) : '—';
  const completionRate = booksOpened > 0 ? `${Math.round(booksCompleted / booksOpened * 100)}%` : '—';

  // ── Fluency ─────────────────────────────────────────────────────
  const pageCompletions = events.filter(e => e.event === 'page_completed');
  const totalDwellMs = pageCompletions.reduce((s, e) => s + Number(e.properties.dwell_ms ?? 0), 0);
  const avgDwellMs = pageCompletions.length > 0 ? totalDwellMs / pageCompletions.length : 0;

  // ── Comprehension Support ────────────────────────────────────────
  const wordTapEvents = events.filter(e => e.event === 'word_tapped');
  const wordsTapped = wordTapEvents.length;
  const definitionsShown = wordTapEvents.filter(e => e.properties.definition_shown === true).length;
  const sentencesReplayed = events.filter(e => e.event === 'sentence_replayed').length;
  const wordFreq = new Map<string, number>();
  wordTapEvents.forEach(e => {
    const w = String(e.properties.text ?? '').replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (w) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  });
  const topWords = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── Audio Usage ──────────────────────────────────────────────────
  const audioStarts = events.filter(e => e.event === 'audio_started').length;
  const audioSessions = new Set(events.filter(e => e.event === 'audio_started').map(e => e.session_id)).size;
  const modeCounts: Record<string, number> = {};
  events.filter(e => e.event === 'book_opened').forEach(e => {
    const m = String(e.properties.mode ?? 'unknown');
    modeCounts[m] = (modeCounts[m] ?? 0) + 1;
  });
  const speedChanges = events.filter(e => e.event === 'setting_changed' && e.properties.setting === 'speed');
  const speedCounts: Record<string, number> = {};
  speedChanges.forEach(e => {
    const v = String(e.properties.value ?? '1');
    speedCounts[v] = (speedCounts[v] ?? 0) + 1;
  });
  const topSpeed = Object.entries(speedCounts).sort((a, b) => b[1] - a[1])[0];

  // ── Navigation ───────────────────────────────────────────────────
  const forwardNavs = events.filter(e => e.event === 'page_viewed' && e.properties.direction === 'next').length;
  const backNavs = events.filter(e => e.event === 'page_viewed' && e.properties.direction === 'prev').length;

  const noData = 'No data yet — open a book to start tracking.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {events.length === 0 && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          No reading data yet. Open a book to start collecting analytics.
        </div>
      )}

      <CategoryStats
        icon="📚" title="Engagement"
        noDataMsg={noData}
        stats={[
          { label: 'Sessions', value: totalSessions },
          { label: 'Books Opened', value: booksOpened },
          { label: 'Books Completed', value: booksCompleted, sub: booksOpened > 0 ? completionRate + ' completion rate' : undefined },
          { label: 'Avg Pages / Session', value: avgPagesPerSession },
        ]}
      />

      <CategoryStats
        icon="⚡" title="Fluency"
        noDataMsg={noData}
        stats={[
          { label: 'Pages Read', value: pagesViewed },
          { label: 'Avg Time / Page', value: avgDwellMs > 0 ? fmt(avgDwellMs) : '—', sub: 'Reading pace proxy' },
          { label: 'Total Reading Time', value: totalDwellMs > 0 ? fmt(totalDwellMs) : '—' },
        ]}
      />

      <CategoryStats
        icon="🧠" title="Comprehension Support"
        noDataMsg={noData}
        stats={[
          { label: 'Words Tapped', value: wordsTapped },
          { label: 'Definitions Shown', value: definitionsShown, sub: wordsTapped > 0 ? `${Math.round(definitionsShown / wordsTapped * 100)}% of taps` : undefined },
          { label: 'Sentences Replayed', value: sentencesReplayed },
        ]}
      />

      {topWords.length > 0 && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
            🔤 Most-Tapped Words
          </div>
          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {topWords.map(([word, count]) => (
              <span key={word} style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.25rem 0.625rem', fontSize: '0.875rem' }}>
                <strong>{word}</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <CategoryStats
        icon="🎧" title="Audio Usage"
        noDataMsg={noData}
        stats={[
          { label: 'Audio Starts', value: audioStarts },
          { label: 'Sessions with Audio', value: audioSessions },
          { label: 'Preferred Speed', value: topSpeed ? `${topSpeed[0]}×` : '—' },
        ]}
      />

      {Object.keys(modeCounts).length > 0 && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
            🎯 Reading Mode Distribution
          </div>
          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(modeCounts).sort((a, b) => b[1] - a[1]).map(([mode, count]) => (
              <div key={mode} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600 }}>{mode}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CategoryStats
        icon="🗺" title="Navigation"
        noDataMsg={noData}
        stats={[
          { label: 'Forward Page Turns', value: forwardNavs },
          { label: 'Back Page Turns', value: backNavs },
          { label: 'Avg Pages / Session', value: avgPagesPerSession },
        ]}
      />
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [tab, setTab] = useState<'overview' | 'sessions' | 'statistics' | 'voice'>('overview');

  useEffect(() => {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      try { setEvents(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const sessions = useMemo(() => aggregateSessions(events), [events]);

  const totalBooksOpened = events.filter(e => e.event === 'book_opened').length;
  const totalPagesRead = events.filter(e => e.event === 'page_viewed').length;
  const totalWordsTapped = events.filter(e => e.event === 'word_tapped').length;
  const totalDwell = sessions.reduce((acc, s) => acc + s.dwell_ms, 0);
  const avgDwellPerPage = totalPagesRead > 0 ? Math.round(totalDwell / totalPagesRead) : 0;

  const bookCounts = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const ev of events) {
      if (ev.event === 'book_opened') {
        const id = String(ev.properties.book_id ?? '');
        const title = String(ev.properties.title ?? id);
        map.set(id, { title, count: (map.get(id)?.count ?? 0) + 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [events]);

  const handleExport = () => {
    if (events.length === 0) return;
    const rows = [
      ['event', 'session_id', 'timestamp', 'book_id', 'properties'],
      ...events.map(e => [e.event, e.session_id, new Date(e.timestamp).toISOString(), String(e.properties.book_id ?? ''), JSON.stringify(e.properties)]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-player-analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all analytics data from this device? This cannot be undone.')) {
      localStorage.removeItem(EVENTS_KEY);
      setEvents([]);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 40, padding: '0 1rem', borderRadius: '6px', border: 'none',
    cursor: 'pointer', fontWeight: active ? 700 : 400,
    backgroundColor: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-fg)' : 'var(--text)',
    fontSize: '0.9375rem', whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent',
  });

  const metricCard = (icon: string, label: string, value: string, sub?: string) => (
    <div key={label} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ fontSize: '1.5rem' }} aria-hidden="true">{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Admin Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>Reading analytics &amp; configuration</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExport} disabled={events.length === 0} style={{ minHeight: 40, padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', cursor: events.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.875rem', opacity: events.length === 0 ? 0.5 : 1 }}>
            ⬇ Export CSV
          </button>
          <button onClick={handleClear} disabled={events.length === 0} style={{ minHeight: 40, padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: '#ef4444', cursor: events.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.875rem', opacity: events.length === 0 ? 0.5 : 1 }}>
            🗑 Clear Data
          </button>
          <a href="/" style={{ minHeight: 40, padding: '0 1rem', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
            ← Library
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {(['overview', 'statistics', 'sessions', 'voice'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'overview' ? '📊 Overview' : t === 'statistics' ? '📈 Statistics' : t === 'sessions' ? '📋 Sessions' : '🎙 Voice'}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            {events.length === 0 && (
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9375rem' }}>
                No reading data yet. Open a book to start collecting analytics.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
              {metricCard('📚', 'Books Opened', String(totalBooksOpened), 'Sessions recorded')}
              {metricCard('📄', 'Pages Read', String(totalPagesRead), 'Total page views')}
              {metricCard('🔊', 'Words Tapped', String(totalWordsTapped), 'Pronunciation requests')}
              {metricCard('⏱', 'Avg Time / Page', avgDwellPerPage > 0 ? fmt(avgDwellPerPage) : '—', 'Reading pace indicator')}
              {metricCard('📖', 'Unique Sessions', String(sessions.length), 'Reading sessions')}
            </div>
            {bookCounts.length > 0 && (
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>⭐ Most Opened Books</div>
                <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {bookCounts.slice(0, 5).map((b, i) => (
                    <div key={b.title} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--muted)', width: 20 }}>#{i + 1}</span>
                      <span style={{ flex: 1 }}>{b.title}</span>
                      <span style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: '12px', padding: '0.125rem 0.625rem', fontSize: '0.8125rem', fontWeight: 700 }}>{b.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Statistics ── */}
        {tab === 'statistics' && <StatisticsPanel events={events} />}

        {/* ── Sessions ── */}
        {tab === 'sessions' && (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Reading Sessions ({sessions.length})</div>
            {sessions.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No sessions recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 600 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                      {['Book', 'Grade', 'Mode', 'Pages', 'Words Tapped', 'Replays', 'Dwell Time', 'Started'].map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '0.625rem 1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.session_id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.book_title ?? s.book_id}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{s.grade}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{s.mode ?? '—'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.pages_viewed}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.words_tapped}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.sentences_replayed}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{s.dwell_ms > 0 ? fmt(s.dwell_ms) : '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(s.started_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Voice ── */}
        {tab === 'voice' && <VoiceSelector />}
      </main>
    </div>
  );
}
