import { NextResponse } from 'next/server';
import { ALL_BOOKS } from '@/data/books/index';

export function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const book = ALL_BOOKS.find(b => b.book_id === id);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(book);
  });
}
