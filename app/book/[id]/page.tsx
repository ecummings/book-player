import { ALL_BOOKS } from '@/data/books/index';
import BookReader from '@/components/reader/BookReader';
import { notFound } from 'next/navigation';

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = ALL_BOOKS.find(b => b.book_id === id);
  if (!book) notFound();
  return <BookReader book={book} />;
}
