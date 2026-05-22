'use client';
import { BookPage } from '@/lib/types';
import WordSpan from './WordSpan';

interface Props {
  page: BookPage;
  currentWordId: string | null;
  currentSentenceId: string | null;
  onWordTap: (wordId: string, text: string, x: number, y: number) => void;
  gradeBand: string;
  active?: boolean;           // false = preview/greyed (other spread page)
  fontSize: string;
  dyslexia: boolean;
}

// Ensure the SVG fills its container by injecting preserveAspectRatio.
function injectFillAttr(svg: string): string {
  if (svg.includes('preserveAspectRatio')) return svg;
  return svg.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');
}

export default function BookPageView({
  page,
  currentWordId,
  currentSentenceId,
  onWordTap,
  gradeBand,
  active = true,
  fontSize,
  dyslexia,
}: Props) {
  const hasBg = !!page.illustration?.svg;
  const layout = page.layout;

  const textNodes = (
    /* book-content scopes font/grade/dyslexia vars to text only */
    <div
      className="book-content"
      data-fontsize={fontSize}
      data-gradeband={gradeBand}
      data-dyslexia={dyslexia ? 'true' : 'false'}
    >
      <div className="book-text">
        {page.paragraphs.map(para => (
          <p key={para.paragraph_id} style={{ marginBottom: '0.8em', marginTop: 0 }}>
            {para.sentences.map(sentence =>
              sentence.words.map(word => (
                <WordSpan
                  key={word.word_id}
                  wordId={word.word_id}
                  text={word.text}
                  sentenceId={sentence.sentence_id}
                  isHighlighted={currentWordId === word.word_id}
                  isSentenceActive={currentSentenceId === sentence.sentence_id}
                  onTap={active ? onWordTap : () => {}}
                  gradeBand={gradeBand}
                />
              ))
            )}
          </p>
        ))}
      </div>
    </div>
  );

  // Text-only page (no illustration)
  if (!hasBg || layout === 'text-only') {
    return (
      <div className="book-page-view" style={{ opacity: active ? 1 : 0.55 }}>
        <div className="book-page-view__text book-page-view__text--only">
          <div className="book-page-view__text-inner">{textNodes}</div>
        </div>
      </div>
    );
  }

  const panelClass = {
    'text-bottom': 'book-page-view__text--bottom',
    'text-top':    'book-page-view__text--top',
    'text-left':   'book-page-view__text--left',
    'text-right':  'book-page-view__text--right',
  }[layout] ?? 'book-page-view__text--bottom';

  return (
    <div className="book-page-view" style={{ opacity: active ? 1 : 0.55 }}>
      {/* Full-bleed illustrated background */}
      <div
        className="book-page-view__bg"
        aria-label={page.illustration!.alt}
        role="img"
        dangerouslySetInnerHTML={{ __html: injectFillAttr(page.illustration!.svg) }}
      />

      {/* Text panel overlaid on illustration */}
      <div className={`book-page-view__text ${panelClass}`}>
        <div className="book-page-view__text-inner">{textNodes}</div>
      </div>
    </div>
  );
}
