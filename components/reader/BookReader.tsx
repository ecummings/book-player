'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book, ReadingMode, ReaderSettings } from '@/lib/types';
import { useSpeech } from '@/hooks/useSpeech';
import { useAnalytics } from '@/hooks/useAnalytics';
import { loadReaderSettings, saveReaderSettings } from '@/lib/storage';
import { COMMON_VOCABULARY } from '@/lib/vocabulary';
import BookSpread from './BookSpread';
import AudioControls from './AudioControls';
import WordPopup from './WordPopup';
import SettingsPanel from '@/components/ui/SettingsPanel';

interface Props {
  book: Book;
  initialSettings?: Partial<ReaderSettings>;
  onClose?: () => void;
}

interface PopupState {
  wordId: string;
  text: string;
  x: number;
  y: number;
  definition?: string;
  phonetic?: string;
}

function getDefaultMode(gradeBand: string): ReadingMode {
  if (gradeBand === 'K-1') return 'read-to-me';
  if (gradeBand === '2-3') return 'read-with-me';
  return 'i-read';
}

const MODES: { value: ReadingMode; label: string; icon: string }[] = [
  { value: 'read-to-me',   label: 'Read to Me',   icon: '🎧' },
  { value: 'read-with-me', label: 'Read With Me',  icon: '🤝' },
  { value: 'i-read',       label: 'I Read',        icon: '📖' },
  { value: 'practice',     label: 'Practice',      icon: '🎯' },
];

export default function BookReader({ book, initialSettings, onClose }: Props) {
  const router = useRouter();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const pageStartTimeRef = useRef(Date.now());

  const [settings, setSettings] = useState<ReaderSettings>(() => ({
    theme: 'default',
    fontSize: 'default',
    fontFamily: 'default',
    speed: 1,
    highlightEnabled: true,
    mode: getDefaultMode(book.grade_band),
    ...loadReaderSettings(),
    ...initialSettings,
  }));

  // Only apply data-theme to <html>. Font/size/dyslexia settings are scoped
  // to the .book-content wrapper so UI chrome never changes size.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', settings.theme);
    return () => { html.removeAttribute('data-theme'); };
  }, [settings.theme]);

  const { track } = useAnalytics(book.book_id);
  const currentPage = book.pages[currentPageIndex];

  const [isBookComplete, setIsBookComplete] = useState(false);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');

  const autoPlayRef = useRef(false);
  const playRef    = useRef<() => void>(() => {});
  const modeRef    = useRef(settings.mode);
  modeRef.current = settings.mode;

  const handlePageComplete = useCallback(() => {
    const dwell = Date.now() - pageStartTimeRef.current;
    track('page_completed', { page_index: currentPageIndex, dwell_ms: dwell });

    const mode = modeRef.current;
    if (mode === 'read-to-me' || mode === 'read-with-me') {
      setCurrentPageIndex(prev => {
        const next = prev + 1;
        if (next < book.pages.length) {
          track('page_viewed', { page_index: next, page_id: book.pages[next]?.page_id, direction: 'next' });
          pageStartTimeRef.current = Date.now();
          return next;
        }
        autoPlayRef.current = false;
        track('book_completed', { total_pages: book.pages.length });
        setIsBookComplete(true);
        return prev;
      });
    }
  }, [book.pages, track, currentPageIndex]);

  const { isPlaying, currentWordId, currentSentenceId, play, pause, stop, speakWord } = useSpeech(
    currentPage,
    settings.speed,
    handlePageComplete,
  );

  playRef.current = play;

  useEffect(() => {
    track('book_opened', { title: book.title, grade_band: book.grade_band, mode: settings.mode });
    track('page_viewed', { page_index: 0, page_id: book.pages[0]?.page_id });
    pageStartTimeRef.current = Date.now();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevAutoPageRef = useRef(-1);
  useEffect(() => {
    if (!autoPlayRef.current) return;
    if (prevAutoPageRef.current === currentPageIndex) return;
    prevAutoPageRef.current = currentPageIndex;
    const t = setTimeout(() => playRef.current(), 180);
    return () => clearTimeout(t);
  }, [currentPageIndex]);

  const handleRestart = useCallback(() => {
    stop();
    setIsBookComplete(false);
    setCurrentPageIndex(0);
    autoPlayRef.current = false;
    prevAutoPageRef.current = -1;
    pageStartTimeRef.current = Date.now();
    track('book_restarted', { book_id: book.book_id });
  }, [stop, track, book.book_id]);

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0) return;
      if (index >= book.pages.length) {
        setIsBookComplete(true);
        track('book_completed', { total_pages: book.pages.length });
        return;
      }
      const dwell = Date.now() - pageStartTimeRef.current;
      track('page_completed', { page_index: currentPageIndex, dwell_ms: dwell });
      stop();
      setPopup(null);
      setNavDirection(index > currentPageIndex ? 'forward' : 'backward');
      setCurrentPageIndex(index);
      track('page_viewed', { page_index: index, page_id: book.pages[index]?.page_id, direction: index > currentPageIndex ? 'next' : 'prev' });
      pageStartTimeRef.current = Date.now();
    },
    [book.pages, stop, track, currentPageIndex]
  );

  const handlePlay = useCallback(() => {
    autoPlayRef.current = true;
    play();
    track('audio_started', { page_index: currentPageIndex, speed: settings.speed });
  }, [play, track, currentPageIndex, settings.speed]);

  const handlePause = useCallback(() => {
    pause();
    track('audio_paused', { page_index: currentPageIndex });
  }, [pause, track, currentPageIndex]);

  const handleWordTap = useCallback(
    (wordId: string, text: string, x: number, y: number) => {
      const cleanText = text.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
      const vocab =
        book.vocabulary?.[cleanText] ??
        book.vocabulary?.[text.toLowerCase()] ??
        COMMON_VOCABULARY[cleanText] ??
        COMMON_VOCABULARY[text.toLowerCase()];
      setPopup({
        wordId,
        text: text.replace(/[^a-zA-Z'-]/g, ''),
        x, y,
        definition: vocab?.definition,
        phonetic: vocab?.phonetic,
      });
      track('word_tapped', { word_id: wordId, text, page_index: currentPageIndex, definition_shown: !!vocab });
    },
    [book.vocabulary, track, currentPageIndex]
  );

  const handleSoundWord = useCallback(() => {
    if (popup) speakWord(popup.text);
  }, [popup, speakWord]);

  const handleExit = useCallback(() => {
    stop();
    if (onClose) onClose();
    else router.push('/');
  }, [stop, onClose, router]);

  // Swipe navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    // Only treat as horizontal swipe if horizontal movement dominates
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (popup) { setPopup(null); return; }
    if (dx < 0) goToPage(currentPageIndex + 1);
    else goToPage(currentPageIndex - 1);
  }, [goToPage, currentPageIndex, popup]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === ' ') {
        e.preventDefault();
        if (popup) { setPopup(null); return; }
        isPlaying ? handlePause() : handlePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPage(currentPageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToPage(currentPageIndex + 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (popup) { setPopup(null); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, goToPage, currentPageIndex, settingsOpen, popup, handleExit]);

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveReaderSettings(next);
      return next;
    });
    track('setting_changed', { setting: key, value: String(value) });
  };

  const progressPct = ((currentPageIndex + 1) / book.pages.length) * 100;

  return (
    <div className="reader-root" style={{ height: '100%' }}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1rem',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <button
          onClick={handleExit}
          aria-label="Exit to library"
          style={{
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center',
            padding: '0 0.5rem', color: 'var(--text)',
            fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border)',
            background: 'none', cursor: 'pointer', fontSize: '0.9375rem',
            gap: '0.25rem',
          }}
        >
          ← <span style={{ fontSize: '0.8125rem' }}>Exit</span>
        </button>

        <div style={{ flex: 1, textAlign: 'center', padding: '0 0.5rem', minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: '0.9375rem', fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {book.title}
          </h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
            Page {currentPageIndex + 1} of {book.pages.length}
          </p>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          style={{
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center',
            justifyContent: 'center', backgroundColor: 'transparent',
            border: '1px solid var(--border)', borderRadius: '8px',
            cursor: 'pointer', color: 'var(--text)', fontSize: '1.125rem',
          }}
        >
          ⚙
        </button>
      </header>

      {/* ── Reading progress bar ─────────────────────────────────────── */}
      <div style={{ height: 3, backgroundColor: 'var(--border)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          backgroundColor: 'var(--accent)',
          transition: 'width 0.35s ease',
        }} />
      </div>

      {/* ── Mode selector ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.375rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => { stop(); updateSetting('mode', m.value); }}
            aria-label={`Mode: ${m.label}`}
            aria-pressed={settings.mode === m.value}
            style={{
              minHeight: 34, padding: '0 0.625rem',
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: settings.mode === m.value ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer',
              fontWeight: settings.mode === m.value ? 700 : 400,
              backgroundColor: settings.mode === m.value ? 'var(--accent)' : 'transparent',
              color: settings.mode === m.value ? 'var(--accent-fg)' : 'var(--text)',
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span aria-hidden="true">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Main reading area ────────────────────────────────────────── */}
      <main
        style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}
        onClick={() => popup && setPopup(null)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <BookSpread
          pages={book.pages}
          currentPageIndex={currentPageIndex}
          direction={navDirection}
          currentWordId={currentWordId}
          currentSentenceId={currentSentenceId}
          onWordTap={handleWordTap}
          gradeBand={book.grade_band}
          highlightEnabled={settings.highlightEnabled}
          fontSize={settings.fontSize}
          dyslexia={settings.fontFamily === 'dyslexia'}
        />
      </main>

      <AudioControls
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        speed={settings.speed}
        onSpeed={s => updateSetting('speed', s as ReaderSettings['speed'])}
        currentPage={currentPageIndex + 1}
        totalPages={book.pages.length}
        onPrev={() => goToPage(currentPageIndex - 1)}
        onNext={() => goToPage(currentPageIndex + 1)}
        gradeBand={book.grade_band}
        mode={settings.mode}
      />

      {popup && (
        <WordPopup
          word={popup.text}
          definition={popup.definition}
          phonetic={popup.phonetic}
          x={popup.x}
          y={popup.y}
          onSound={handleSoundWord}
          onClose={() => setPopup(null)}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={settings.theme}
        onTheme={t => updateSetting('theme', t as ReaderSettings['theme'])}
        fontSize={settings.fontSize}
        onFontSize={s => updateSetting('fontSize', s as ReaderSettings['fontSize'])}
        dyslexia={settings.fontFamily === 'dyslexia'}
        onDyslexia={b => updateSetting('fontFamily', b ? 'dyslexia' : 'default')}
        highlightEnabled={settings.highlightEnabled}
        onHighlight={b => updateSetting('highlightEnabled', b)}
      />

      {/* ── Book-complete overlay ────────────────────────────────────── */}
      {isBookComplete && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 300,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1rem', padding: '2rem', textAlign: 'center',
            animation: 'fade-in 0.3s ease',
          }}
        >
          <div style={{ fontSize: '4rem', lineHeight: 1 }}>🎉</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
            You finished the book!
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '1rem' }}>
            {book.title}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button
              onClick={handleRestart}
              style={{
                minHeight: 48, padding: '0 1.5rem', borderRadius: '12px',
                border: 'none', backgroundColor: 'var(--accent)', color: 'var(--accent-fg)',
                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              }}
            >
              🔄 Restart
            </button>
            <button
              onClick={() => { setIsBookComplete(false); goToPage(book.pages.length - 2); }}
              style={{
                minHeight: 48, padding: '0 1.5rem', borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)', backgroundColor: 'transparent',
                color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              }}
            >
              ← Go Back
            </button>
            <button
              onClick={handleExit}
              style={{
                minHeight: 48, padding: '0 1.5rem', borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.3)', backgroundColor: 'transparent',
                color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
