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
      className="page-illustration"
      aria-label={page.illustration.alt}
      role="img"
      dangerouslySetInnerHTML={{ __html: page.illustration.svg }}
    />
  ) : null;

  const textArea = (
    <div
      role="article"
      className="book-text"
    >
      {page.paragraphs.map(para => (
        <p key={para.paragraph_id} style={{ marginBottom: '1em', marginTop: 0 }}>
          {para.sentences.map(sentence =>
            sentence.words.map(word => (
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

  const { layout } = page;

  if (layout === 'text-only') {
    return <div className="page-layout page-layout-col">{textArea}</div>;
  }

  if (layout === 'text-bottom') {
    return (
      <div className="page-layout page-layout-col">
        {illustration}
        {textArea}
      </div>
    );
  }

  if (layout === 'text-top') {
    return (
      <div className="page-layout page-layout-col">
        {textArea}
        {illustration}
      </div>
    );
  }

  // text-right: illustration on left, text on right (stacks on mobile)
  if (layout === 'text-right') {
    return (
      <div className="page-layout page-layout-row">
        {illustration}
        {textArea}
      </div>
    );
  }

  // text-left: text on left, illustration on right (stacks on mobile)
  if (layout === 'text-left') {
    return (
      <div className="page-layout page-layout-row">
        {textArea}
        {illustration}
      </div>
    );
  }

  return (
    <div className="page-layout page-layout-col">
      {illustration}
      {textArea}
    </div>
  );
}
