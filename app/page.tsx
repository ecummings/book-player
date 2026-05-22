import { BookSummary } from '@/lib/types';
import LibraryPage from '@/components/library/LibraryPage';

async function getBooks(): Promise<BookSummary[]> {
  // Import directly for server-side (avoids fetch loop in dev)
  const { ALL_BOOKS } = await import('@/data/books/index');
  const { bookToSummary } = await import('@/lib/books');
  return ALL_BOOKS.map(bookToSummary);
}

export default async function Home() {
  const books = await getBooks();
  return <LibraryPage books={books} />;
}
