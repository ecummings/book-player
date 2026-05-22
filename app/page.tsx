import { BookSummary } from '@/lib/types';
import AppRoot from '@/components/AppRoot';

async function getBookSummaries(): Promise<BookSummary[]> {
  const { ALL_BOOKS } = await import('@/data/books/index');
  const { bookToSummary } = await import('@/lib/books');
  return ALL_BOOKS.map(bookToSummary);
}

export default async function Home() {
  const books = await getBookSummaries();
  return <AppRoot books={books} />;
}
