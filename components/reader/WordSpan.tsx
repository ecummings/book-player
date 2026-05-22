'use client';
import { useCallback, useState } from 'react';

interface Props {
  wordId: string;
  text: string;
  sentenceId: string;
  isHighlighted: boolean;
  isSentenceActive: boolean;
  onTap: (wordId: string, text: string, x: number, y: number) => void;
  gradeBand: string;
}

export default function WordSpan({
  wordId,
  text,
  isHighlighted,
  isSentenceActive,
  onTap,
  gradeBand,
}: Props) {
  const [tapped, setTapped] = useState(false);

  // Use onClick only. touch-action: manipulation (in CSS) removes the 300ms
  // delay on mobile without needing a separate onTouchEnd handler.
  // A separate onTouchEnd would cause the handler to fire twice on mobile
  // (touchend → then synthetic click), which breaks popup timing.
  const handleClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onTap(wordId, text, e.clientX, e.clientY);
    setTapped(true);
    setTimeout(() => setTapped(false), 600);
  }, [wordId, text, onTap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onTap(wordId, text, rect.left + rect.width / 2, rect.top);
        setTapped(true);
        setTimeout(() => setTapped(false), 600);
      }
    },
    [wordId, text, onTap]
  );

  const classNames = [
    'word-span',
    isHighlighted ? 'highlighted' : '',
    isSentenceActive ? 'sentence-active' : '',
    tapped ? 'tapped' : '',
  ].filter(Boolean).join(' ');

  const minSize = gradeBand === 'K-1' ? 56 : gradeBand === '2-3' ? 48 : 44;

  return (
    <span
      className={classNames}
      role="button"
      tabIndex={0}
      aria-label={`${text} — tap for options`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ minHeight: minSize, display: 'inline', cursor: 'pointer' }}
    >
      {text}{' '}
    </span>
  );
}
