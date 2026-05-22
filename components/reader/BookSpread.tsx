'use client';
import { useEffect, useState } from 'react';
import { BookPage } from '@/lib/types';
import BookPageView from './BookPageView';

interface Props {
  pages: BookPage[];
  currentPageIndex: number;
  direction: 'forward' | 'backward';
  currentWordId: string | null;
  currentSentenceId: string | null;
  onWordTap: (wordId: string, text: string, x: number, y: number) => void;
  gradeBand: string;
  highlightEnabled: boolean;
  fontSize: string;
  dyslexia: boolean;
}

function useIsSpread() {
  const [isSpread, setIsSpread] = useState(false);
  useEffect(() => {
    const check = () => setIsSpread(window.innerWidth >= 700);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  return isSpread;
}

export default function BookSpread({
  pages,
  currentPageIndex,
  direction,
  currentWordId,
  currentSentenceId,
  onWordTap,
  gradeBand,
  highlightEnabled,
  fontSize,
  dyslexia,
}: Props) {
  const isSpread = useIsSpread();

  const wordId  = highlightEnabled ? currentWordId  : null;
  const sentId  = highlightEnabled ? currentSentenceId : null;

  const currentPage  = pages[currentPageIndex];
  const previousPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;

  const turnClass = direction === 'forward' ? 'turn-forward' : 'turn-backward';

  // ── Single-page (mobile) ───────────────────────────────────────────
  if (!isSpread || !currentPage) {
    return (
      <div key={currentPageIndex} className={turnClass} style={{ width: '100%', height: '100%' }}>
        {currentPage && (
          <BookPageView
            page={currentPage}
            currentWordId={wordId}
            currentSentenceId={sentId}
            onWordTap={onWordTap}
            gradeBand={gradeBand}
            active={true}
            fontSize={fontSize}
            dyslexia={dyslexia}
          />
        )}
      </div>
    );
  }

  // ── Two-page spread (desktop) ──────────────────────────────────────
  // Left page = the page already read (previous). Dimmed, not interactive.
  // Right page = current (active, highlighted, interactive).
  return (
    <div className="book-spread">
      {/* Left page */}
      <div className="book-spread__page book-spread__page--left">
        {previousPage ? (
          <BookPageView
            page={previousPage}
            currentWordId={null}
            currentSentenceId={null}
            onWordTap={() => {}}
            gradeBand={gradeBand}
            active={false}
            fontSize={fontSize}
            dyslexia={dyslexia}
          />
        ) : (
          /* First page — blank left side with book cover feel */
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #1a0f0a 0%, #2d1a0d 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 60, height: 80,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.1)',
            }} />
          </div>
        )}
      </div>

      {/* Book spine */}
      <div className="book-spread__spine" />

      {/* Right page — new page animates in */}
      <div
        key={currentPageIndex}
        className={`book-spread__page book-spread__page--right ${turnClass}`}
      >
        <BookPageView
          page={currentPage}
          currentWordId={wordId}
          currentSentenceId={sentId}
          onWordTap={onWordTap}
          gradeBand={gradeBand}
          active={true}
          fontSize={fontSize}
          dyslexia={dyslexia}
        />
      </div>
    </div>
  );
}
