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

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    let x: number, y: number;
    if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      x = e.changedTouches[0].clientX;
      y = e.changedTouches[0].clientY;
    } else {
      const me = e as React.MouseEvent;
      x = me.clientX;
      y = me.clientY;
    }
    onTap(wordId, text, x, y);
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

  // Grade-band-appropriate minimum touch target.
  const minSize = gradeBand === 'K-1' ? 56 : gradeBand === '2-3' ? 48 : 44;

  return (
    <span
      className={classNames}
      role="button"
      tabIndex={0}
      aria-label={`Word: ${text}. Tap for options.`}
      onClick={handleTap}
      onTouchEnd={handleTap}
      onKeyDown={handleKeyDown}
      style={{ minHeight: minSize, display: 'inline', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
    >
      {text}{' '}
    </span>
  );
}
