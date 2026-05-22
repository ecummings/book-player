import { NextResponse } from 'next/server';
import { ALL_BOOKS } from '@/data/books/index';
import { bookToSummary } from '@/lib/books';

export function GET() {
  return NextResponse.json(ALL_BOOKS.map(bookToSummary));
}
