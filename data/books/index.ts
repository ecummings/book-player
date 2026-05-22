import { Book, BookSummary } from '@/lib/types';
import sunflowerSeeds from './01-sunflower-seeds.json';
import littleRedFrog from './02-little-red-frog.json';
import countingStars from './03-counting-stars.json';
import theRainbow from './04-the-rainbow.json';
import bearsInTheWoods from './05-bears-in-the-woods.json';
import oceanAdventure from './06-ocean-adventure.json';
import codeBreakers from './07-code-breakers.json';
import theSecretGarden from './08-the-secret-garden.json';
import starsAndPlanets from './09-stars-and-planets.json';
import theRiverMystery from './10-the-river-mystery.json';

export const ALL_BOOKS: Book[] = [
  sunflowerSeeds as Book,
  littleRedFrog as Book,
  countingStars as Book,
  theRainbow as Book,
  bearsInTheWoods as Book,
  oceanAdventure as Book,
  codeBreakers as Book,
  theSecretGarden as Book,
  starsAndPlanets as Book,
  theRiverMystery as Book,
];

export function getBookSummaries(): BookSummary[] {
  return ALL_BOOKS.map(({ book_id, title, author, grade, grade_band, cover_color, cover_illustration, pages, tags, reading_level, lexile }) => ({
    book_id, title, author, grade, grade_band, cover_color, cover_illustration,
    page_count: pages.length, tags, reading_level, lexile,
  }));
}

export function getBookById(id: string): Book | undefined {
  return ALL_BOOKS.find(b => b.book_id === id);
}
