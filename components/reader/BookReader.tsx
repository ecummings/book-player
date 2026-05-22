'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book, ReadingMode, ReaderSettings } from '@/lib/types';
import { useSpeech } from '@/hooks/useSpeech';
import { useAnalytics } from '@/hooks/useAnalytics';
import { loadReaderSettings, saveReaderSettings } from '@/lib/storage';
import PageContent from './PageContent';
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

const MODES: { value: ReadingMode; label: string }[] = [
  { value: 'read-to-me',  label: 'Read to Me' },
  { value: 'read-with-me',label: 'Read With Me' },
  { value: 'i-read',      label: 'I Read' },
  { value: 'practice',    label: 'Practice' },
];

export default function BookReader({ book, initialSettings, onClose }: Props) {
  const router = useRouter();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const pageStartTimeRef = useRef(Date.now());

  // Merge grade-band defaults → persisted user prefs → explicit initialSettings.
  // Grade band sets the reading MODE default; font/theme/size come from localStorage.
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

  // Apply all visual settings to <html> so CSS variables cascade everywhere.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', settings.theme);
    html.setAttribute('data-fontsize', settings.fontSize);
    html.setAttribute('data-gradeband', book.grade_band);
    html.setAttribute('data-dyslexia', settings.fontFamily === 'dyslexia' ? 'true' : 'false');
    return () => {
      html.removeAttribute('data-theme');
      html.removeAttribute('data-fontsize');
      html.removeAttribute('data-gradeband');
      html.removeAttribute('data-dyslexia');
    };
  }, [settings.theme, settings.fontSize, settings.fontFamily, book.grade_band]);

  const { track } = useAnalytics(book.book_id);
  const currentPage = book.pages[currentPageIndex];

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

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= book.pages.length) return;
      const dwell = Date.now() - pageStartTimeRef.current;
      track('page_completed', { page_index: currentPageIndex, dwell_ms: dwell });
      stop();
      setPopup(null);
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
      const vocab = book.vocabulary?.[cleanText] ?? book.vocabulary?.[text.toLowerCase()];
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

  const exitBtnStyle: React.CSSProperties = {
    minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center',
    padding: '0 0.5rem', color: 'var(--text)', textDecoration: 'none',
    fontWeight: 600, borderRadius: '6px', border: '1px solid var(--border)',
    background: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
    fontSize: 'inherit',
  };

  return (
    <div className="reader-root" data-dyslexia={settings.fontFamily === 'dyslexia' ? 'true' : 'false'}>
      {/* Top bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={handleExit} aria-label="Exit to library" style={exitBtnStyle}>
          ← Exit
        </button>

        <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textAlign: 'center', flex: 1, padding: '0 0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.title}
        </h1>

        <button onClick={() => setSettingsOpen(true)} aria-label="Open settings" style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)', fontSize: '1.25rem', WebkitTapHighlightColor: 'transparent' }}>
          ⚙
        </button>
      </header>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {MODES.map(m => (
          <button key={m.value} onClick={() => { stop(); updateSetting('mode', m.value); }} aria-label={`Mode: ${m.label}`} aria-pressed={settings.mode === m.value}
            style={{ minHeight: 36, padding: '0 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: settings.mode === m.value ? 700 : 400, backgroundColor: settings.mode === m.value ? 'var(--accent)' : 'transparent', color: settings.mode === m.value ? 'var(--accent-fg)' : 'var(--text)', fontSize: '0.8125rem', whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} onClick={() => popup && setPopup(null)}>
        {currentPage && (
          <PageContent
            page={currentPage}
            currentWordId={settings.highlightEnabled ? currentWordId : null}
            currentSentenceId={settings.highlightEnabled ? currentSentenceId : null}
            onWordTap={handleWordTap}
            gradeBand={book.grade_band}
            showIllustration={true}
          />
        )}
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
    </div>
  );
}
