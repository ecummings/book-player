# K-6 Digital Book Player — Product Requirements Document

**Version**: 1.0  
**Date**: 2026-05-22  
**Author**: Product Team  
**Status**: Approved for Development

---

## 1. Overview

The K-6 Digital Book Player is a browser-based reading application designed for elementary school students in grades K through 6. It provides grade-appropriate digital book reading experiences with AI-assisted narration, synchronized word highlighting, multiple reading modes, and accessibility-first design. The platform supports COPPA/FERPA compliance, WCAG 2.2 AA accessibility, and a predictable, touch-friendly interface optimized for tablets, Chromebooks, laptops, and phones.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Increase reading engagement | 80% of students complete books they open |
| Support independent reading | Students can navigate without teacher intervention |
| Build fluency | Measurable improvement in words-per-minute over 8 weeks |
| Serve all learners | 100% of UI meets WCAG 2.2 AA |
| Protect student privacy | Zero PII transmitted to third-party analytics |

---

## 3. Target Users

| User | Description |
|------|-------------|
| Students K-1 | Ages 5-7; largely pre-readers or emerging readers; prefer simple, large UI |
| Students 2-3 | Ages 7-9; developing readers; benefit from optional read-aloud with speed control |
| Students 4-6 | Ages 9-12; independent readers; want annotation, vocabulary, chapter nav |
| Teachers | Assign books, monitor progress, view reading analytics |
| School Admins | Manage users, view district-level reports, configure RBAC |

---

## 4. Reading Modes

### 4.1 Read to Me
- System narrates the entire book automatically at a user-selected speed
- Every word highlights as it is spoken (word-level sync)
- Sentence or phrase highlights in a secondary color before word-level highlight
- Student can pause, replay sentence, or tap any word to re-hear it
- Available: all grades

### 4.2 Read with Me
- System reads aloud; student follows and reads along simultaneously
- Karaoke-style word progression with slight lead-ahead highlight
- Student can pause to "catch up"
- Available: K-3 primary, 4-6 optional

### 4.3 I Read
- No narration; student reads silently or aloud to themselves
- Tap-to-hear on any word still available
- Timer runs for fluency tracking (teacher-visible, not shown to student)
- Available: all grades

### 4.4 Practice Mode
- Sentence-by-sentence: system reads, student repeats
- Sentence replay button prominent
- Optional: record student voice (requires explicit opt-in, stored locally only for session)
- Available: K-3 primary

---

## 5. Grade-Band UX Specifications

### 5.1 K-1 (Kindergarten – Grade 1)

| Property | Value |
|----------|-------|
| Base font size | 28–36px |
| Line height | 1.8 |
| Font | Rounded, humanist (e.g., Nunito, Andika) |
| Controls | Minimal — play/pause, next page, exit |
| Word highlight color | Bright yellow (#FFE066) |
| Tap targets | 56×56px minimum |
| Progress indicator | Stars or simple picture-based |
| Vocabulary panel | Hidden |
| Chapter nav | Hidden |
| Annotations | Disabled |
| Default mode | Read to Me |

### 5.2 Grade 2-3

| Property | Value |
|----------|-------|
| Base font size | 24–30px |
| Line height | 1.6 |
| Font | Clean, slightly condensed (e.g., Open Sans, Atkinson Hyperlegible) |
| Controls | Play/pause, next/prev page, speed selector, settings |
| Word highlight color | Yellow (#FFE066); current sentence soft blue underline |
| Tap targets | 48×48px minimum |
| Progress indicator | Page number + book percentage |
| Vocabulary panel | Optional, toggled by teacher |
| Chapter nav | Optional |
| Annotations | Disabled |
| Default mode | Read with Me |

### 5.3 Grade 4-6

| Property | Value |
|----------|-------|
| Base font size | 20–26px |
| Line height | 1.5 |
| Font | Readable serif or clean sans (e.g., Literata, Inter) |
| Controls | Full — play/pause, speed, chapter nav, annotations, vocabulary, settings |
| Word highlight color | Light yellow; optional per student preference |
| Tap targets | 44×44px minimum |
| Progress indicator | Chapter + page fraction |
| Vocabulary panel | Shown on tap or on hover (desktop) |
| Chapter nav | Visible sidebar or chapter menu |
| Annotations | Highlight + sticky note |
| Default mode | I Read |

---

## 6. Typography

- **K-1**: Nunito or Andika — rounded, friendly letterforms; avoid serif for early readers
- **2-3**: Atkinson Hyperlegible — designed for low-vision readers; open counters
- **4-6**: Literata (Google Fonts) or Inter — reading-optimized metrics
- **Font loading**: self-hosted via `/public/fonts/` — no external font requests (privacy/COPPA)
- **Size control**: user can increase/decrease ±2 steps from grade default
- **Letter spacing**: 0.05em default; dyslexia mode adds 0.12em
- **Word spacing**: 0.1em default; dyslexia mode adds 0.2em
- **Line length**: 60–75 characters per line (responsive)

---

## 7. Color and Highlighting

| Token | Default | Soft | High Contrast | Dark |
|-------|---------|------|---------------|------|
| Background | #FFFFFF | #FFF8F0 | #000000 | #1A1A2E |
| Text | #1A1A1A | #2D2D2D | #FFFFFF | #E8E8E8 |
| Word highlight | #FFE066 | #FFD54F | #00FF41 | #FFE066 |
| Sentence underline | #B3D9FF | #A5C8F0 | #00BFFF | #4A90D9 |
| Tap-to-hear ring | #FF6B35 | #F4844F | #FF0000 | #FF6B35 |
| Link/button accent | #2563EB | #3B72D9 | #FFFF00 | #60A5FA |

- All color combinations: ≥ 4.5:1 contrast ratio (text), ≥ 3:1 (UI components)
- Word highlight does not obscure descenders — use padding-based highlight, not text-shadow

---

## 8. Layout and Controls

```
┌────────────────────────────────────────────┐
│ [Exit]          Book Title           [⚙️]  │
├────────────────────────────────────────────┤
│                                            │
│              Page Content                  │
│         (text + illustration)              │
│                                            │
├────────────────────────────────────────────┤
│ [◀ Prev]   [▶ Play/Pause]    [▶▶ Next]    │
│         [0.75x] [1x] [1.25x] [1.5x]       │
│              Page 3 of 12                  │
└────────────────────────────────────────────┘
```

- **Exit** (top left): always visible, returns to library
- **Settings** (top right): font size, theme, highlight color
- **Play/Pause** (bottom center): 64×64px, high contrast
- **Prev/Next page** (bottom left/right): 56×56px
- **Speed controls** (K-1: hidden, 2-3+: shown below controls)
- No hover-only interactions — tablet/touch is primary
- Keyboard: Space = play/pause, ← → = prev/next page, Esc = exit

---

## 9. Audio / Text Synchronization Data Model

```json
{
  "book_id": "uuid",
  "pages": [
    {
      "page_id": "p1",
      "paragraphs": [
        {
          "paragraph_id": "para1",
          "sentences": [
            {
              "sentence_id": "s1",
              "audio_start_ms": 0,
              "audio_end_ms": 3200,
              "words": [
                { "word_id": "w1", "text": "The", "audio_start_ms": 0, "audio_end_ms": 350 },
                { "word_id": "w2", "text": "bear", "audio_start_ms": 360, "audio_end_ms": 700 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

For MVP: Web Speech API `SpeechSynthesisUtterance` with `onboundary` events provides word-level timing at no cost without external audio files. Word index maps directly to DOM spans for real-time highlighting.

---

## 10. Tap-to-Hear (Word Pronunciation)

- Tap any word: system speaks the word in isolation at 0.8x speed
- Orange ring animates around the tapped word
- Tooltip shows definition if vocabulary data available for that word
- Double-tap: speaks word + definition sentence
- K-1: single-tap only (definition hidden)
- 4-6: definition panel slides in from bottom with word, phonetic, definition, example

---

## 11. Accessibility

- **WCAG 2.2 AA** throughout (target AAA where feasible)
- **Keyboard navigation**: full keyboard control, visible focus ring (3px offset)
- **Screen reader**: all interactive elements have `aria-label`; reading area has `role="article"`
- **Font resizing**: user can increase up to 200% without horizontal scroll
- **Motion**: `prefers-reduced-motion` respected — no auto-play animations
- **Dyslexia mode**: OpenDyslexic font option + increased letter/word spacing
- **Color blindness**: highlight colors tested with deuteranopia and protanopia simulators
- **Audio descriptions**: illustrations have `alt` text
- **Session timeout warning**: 5-minute warning before auto-logout with dismissible dialog

---

## 12. Analytics Events

All events are pseudonymous (no PII). Student identified by opaque `session_id` only.

| Event | Properties |
|-------|-----------|
| `book_opened` | book_id, grade, mode, timestamp |
| `page_viewed` | book_id, page_id, dwell_ms |
| `audio_started` | book_id, page_id, speed |
| `audio_paused` | book_id, page_id, position_ms |
| `audio_completed` | book_id, page_id |
| `word_highlighted` | book_id, word_id, timestamp |
| `word_tapped` | book_id, word_id, definition_shown |
| `sentence_replayed` | book_id, sentence_id |
| `page_completed` | book_id, page_id, time_on_page_ms |
| `book_completed` | book_id, total_time_ms, pages_read |
| `question_answered` | book_id, question_id, correct, attempts |
| `setting_changed` | setting_name, old_value, new_value |
| `session_ended` | session_duration_ms, books_opened |

Events are stored in `localStorage` per session and POSTed to `/api/analytics` on `session_ended` or `visibilitychange`.

---

## 13. Teacher Dashboard

- View student reading activity per book
- See completion rates, average time on page, words-per-minute estimate
- Filter by: student, book, date range, grade
- Export as CSV
- Assign books to class/individual
- No individual word-level data visible to teacher (aggregate only)

---

## 14. Privacy & Compliance

| Requirement | Implementation |
|-------------|----------------|
| COPPA | No PII collected for users under 13; parental consent flow for accounts |
| FERPA | Student data accessible only to assigned teachers and admins; RBAC enforced |
| Data minimization | Only events listed in §12 collected; no browsing history, no device fingerprint |
| Analytics IDs | Pseudonymous `session_id` only; no cross-session linking without login |
| Fonts | Self-hosted; no Google Fonts CDN requests |
| Third-party scripts | None in student-facing pages |
| Data retention | Analytics purged after 180 days; configurable by district admin |
| Recording | Student voice recording opt-in only, session-local, never uploaded |

---

## 15. Responsive Design

| Breakpoint | Target Device | Layout |
|------------|--------------|--------|
| < 480px | Phone | Single column, bottom controls pinned |
| 480–768px | Tablet portrait | Single column, larger tap targets |
| 768–1024px | Tablet landscape / Chromebook | Two-column (text + illustration side by side for image-heavy pages) |
| > 1024px | Laptop / desktop | Max-width 800px centered, sidebar for chapter nav |

---

## 16. Missing Requirements (Added to Baseline)

The following requirements were identified as gaps in the research package and are included here:

1. **Offline support**: Service Worker caches up to 5 books for offline reading; sync analytics on reconnect
2. **District SSO**: SAML 2.0 / OAuth 2.0 integration with Google Workspace for Education and Clever
3. **Content Management**: Teacher-facing book upload tool (ePub or structured JSON); auto-extracts text for TTS
4. **Pronunciation Dictionary**: District-editable pronunciation overrides (e.g., student names, local geography)
5. **Comprehension Questions**: Optional post-page or post-book multiple-choice questions with immediate feedback
6. **Reading Level Indicator**: Lexile / DRA level shown to teacher; student sees "For grade X readers"
7. **Bookmarking**: Students can mark a page to return later; persisted per student account
8. **Print View**: Clean, paginated print stylesheet for offline or classroom use
9. **Parental View**: Read-only parent portal showing books read, time spent, progress
10. **Multi-language Support**: UI strings in English + Spanish MVP; RTL-ready architecture

---

## 17. MVP Scope

**In MVP:**
- Book library (home screen) with grade filter
- Book reader with all 4 modes
- Web Speech API TTS with word highlighting
- 3 themes (default, high-contrast, dark)
- Font size controls
- Tap-to-hear
- Basic analytics event logging (localStorage)
- 10 sample books K-6 with illustrations
- Teacher dashboard (read-only, local data)
- Keyboard navigation
- Mobile responsive

**Post-MVP (Phase 2):**
- Offline/service worker
- District SSO
- Book upload CMS
- Pronunciation dictionary
- Parental portal
- Multi-language

---

## 18. Technical Architecture

```
book-player/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Library home
│   │   ├── book/[id]/page.tsx  # Book reader
│   │   ├── dashboard/page.tsx  # Teacher dashboard
│   │   └── api/
│   │       ├── books/route.ts  # GET /api/books, GET /api/books/:id
│   │       └── analytics/route.ts # POST /api/analytics
│   ├── components/
│   │   ├── reader/
│   │   │   ├── BookReader.tsx
│   │   │   ├── PageContent.tsx
│   │   │   ├── WordSpan.tsx
│   │   │   ├── AudioControls.tsx
│   │   │   ├── SpeedSelector.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── library/
│   │   │   ├── BookGrid.tsx
│   │   │   └── BookCard.tsx
│   │   └── ui/
│   │       ├── ThemeProvider.tsx
│   │       └── GradeBandProvider.tsx
│   ├── hooks/
│   │   ├── useSpeech.ts
│   │   ├── useWordHighlight.ts
│   │   └── useAnalytics.ts
│   ├── lib/
│   │   ├── books.ts
│   │   └── analytics.ts
│   └── data/
│       └── books/              # 10 sample books as JSON
├── public/
│   └── fonts/                  # Self-hosted fonts
├── PRD.md
└── README.md
```

**Stack:**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + CSS variables for theming
- Web Speech API (no external TTS cost)
- JSON data files (no DB required for MVP)
- Vitest + Testing Library for unit tests

---

## 19. Non-Functional Requirements

| NFR | Target |
|-----|--------|
| Initial page load | < 2s on 4G (Lighthouse Performance ≥ 90) |
| Time to first word highlight | < 500ms after play pressed |
| Accessibility score | Lighthouse Accessibility = 100 |
| Browser support | Chrome 110+, Firefox 115+, Safari 16+, Edge 110+ |
| Font load | < 300ms (FOUT prevented with `font-display: swap`) |
| Max bundle size | < 200KB JS gzipped (initial route) |
| Uptime | 99.9% (static hosting viable) |
