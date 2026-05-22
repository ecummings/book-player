import { Book, BookSummary, GradeBand } from './types';

export function getGradeBand(grade: string): GradeBand {
  if (grade === 'K' || grade === '1') return 'K-1';
  if (grade === '2' || grade === '3') return '2-3';
  return '4-6';
}

export function getMinTapSize(band: GradeBand): number {
  return band === 'K-1' ? 56 : band === '2-3' ? 48 : 44;
}

export function bookToSummary(book: Book): BookSummary {
  return {
    book_id: book.book_id,
    title: book.title,
    author: book.author,
    grade: book.grade,
    grade_band: book.grade_band,
    cover_color: book.cover_color,
    cover_illustration: book.cover_illustration,
    page_count: book.pages.length,
    tags: book.tags,
    reading_level: book.reading_level,
    lexile: book.lexile,
  };
}
