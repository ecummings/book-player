'use client';
import { BookPage } from '@/lib/types';
import WordSpan from './WordSpan';

interface Props {
  page: BookPage;
  currentWordId: string | null;
  currentSentenceId: string | null;
  onWordTap: (wordId: string, text: string, x: number, y: number) => void;
  gradeBand: string;
  showIllustration: boolean;
}

export default function PageContent({
  page,
  currentWordId,
  currentSentenceId,
  onWordTap,
  gradeBand,
  showIllustration,
}: Props) {
  const illustration = page.illustration && showIllustration ? (
    <div
      aria-label={page.illustration.alt}
      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: page.illustration.svg }}
    />
  ) : null;

  const textArea = (
    <div
      role="article"
      className="book-text"
      style={{ flex: 1, minWidth: 0 }}
    >
      {page.paragraphs.map((para) => (
        <p key={para.paragraph_id} style={{ marginBottom: '1em' }}>
          {para.sentences.map((sentence) =>
            sentence.words.map((word) => (
              <WordSpan
                key={word.word_id}
                wordId={word.word_id}
                text={word.text}
                sentenceId={sentence.sentence_id}
                isHighlighted={currentWordId === word.word_id}
                isSentenceActive={currentSentenceId === sentence.sentence_id}
                onTap={onWordTap}
                gradeBand={gradeBand}
              />
            ))
          )}
        </p>
      ))}
    </div>
  );

  const layout = page.layout;

  if (layout === 'text-only') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {textArea}
      </div>
    );
  }

  if (layout === 'text-bottom') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {illustration}
        {textArea}
      </div>
    );
  }

  if (layout === 'text-top') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {textArea}
        {illustration}
      </div>
    );
  }

  if (layout === 'text-right') {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', height: '100%', alignItems: 'flex-start' }}>
        {illustration}
        {textArea}
      </div>
    );
  }

  if (layout === 'text-left') {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', height: '100%', alignItems: 'flex-start' }}>
        {textArea}
        {illustration}
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {illustration}
      {textArea}
    </div>
  );
}
