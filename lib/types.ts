export type Grade = 'K' | '1' | '2' | '3' | '4' | '5' | '6';
export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  grade_band?: GradeBand;   // students only
  teacher_id?: string;      // students only
  class_name?: string;      // teachers only
}

export interface Assignment {
  id: string;
  teacher_id: string;
  student_id: string;
  book_id: string;
  assigned_at: number;
  note?: string;
}
export type GradeBand = 'K-1' | '2-3' | '4-6';
export type ReadingMode = 'read-to-me' | 'read-with-me' | 'i-read' | 'practice';
export type Theme = 'default' | 'soft' | 'high-contrast' | 'dark';

export interface Word {
  word_id: string;
  text: string;
  audio_start_ms: number;
  audio_end_ms: number;
  definition?: string;
  phonetic?: string;
}

export interface Sentence {
  sentence_id: string;
  audio_start_ms: number;
  audio_end_ms: number;
  words: Word[];
}

export interface Paragraph {
  paragraph_id: string;
  sentences: Sentence[];
}

export interface Illustration {
  type: 'svg';
  svg: string;
  alt: string;
}

export interface BookPage {
  page_id: string;
  paragraphs: Paragraph[];
  illustration?: Illustration;
  layout: 'text-only' | 'text-left' | 'text-right' | 'text-top' | 'text-bottom';
}

export interface Book {
  book_id: string;
  title: string;
  author: string;
  grade: Grade;
  grade_band: GradeBand;
  lexile?: string;
  cover_color: string;
  cover_illustration: Illustration;
  pages: BookPage[];
  vocabulary?: Record<string, { definition: string; phonetic: string }>;
  tags: string[];
  reading_level: string;
}

export interface BookSummary {
  book_id: string;
  title: string;
  author: string;
  grade: Grade;
  grade_band: GradeBand;
  cover_color: string;
  cover_illustration: Illustration;
  page_count: number;
  tags: string[];
  reading_level: string;
  lexile?: string;
}

export interface AnalyticsEvent {
  event: string;
  session_id: string;
  timestamp: number;
  properties: Record<string, unknown>;
}

export interface ReaderSettings {
  theme: Theme;
  fontSize: 'small' | 'default' | 'large' | 'xlarge';
  fontFamily: 'default' | 'dyslexia';
  speed: 0.75 | 1 | 1.25 | 1.5;
  highlightEnabled: boolean;
  mode: ReadingMode;
}
