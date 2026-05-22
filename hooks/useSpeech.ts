'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BookPage } from '@/lib/types';

export const VOICE_KEY = 'bp_voice_uri';

export interface WordEntry {
  wordId: string;
  sentenceId: string;
  text: string;
}

// Average spoken English: ~150 wpm at 1x rate.
const BASE_WPM = 150;

function buildWordList(page: BookPage): WordEntry[] {
  const list: WordEntry[] = [];
  for (const para of page.paragraphs) {
    for (const sentence of para.sentences) {
      for (const word of sentence.words) {
        list.push({ wordId: word.word_id, sentenceId: sentence.sentence_id, text: word.text });
      }
    }
  }
  return list;
}

function getPageText(page: BookPage): string {
  return buildWordList(page).map(w => w.text).join(' ');
}

// Detect browsers where onboundary word events are unreliable (iOS Safari).
function needsTimerFallback(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(ua.includes('CriOS') && ua.includes('Chrome'));
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
}

function getSelectedVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const uri = localStorage.getItem(VOICE_KEY);
  if (!uri) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.voiceURI === uri) ?? null;
}

export function useSpeech(
  page: BookPage | null,
  speed: number,
  onPageComplete?: () => void,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordId, setCurrentWordId] = useState<string | null>(null);
  const [currentSentenceId, setCurrentSentenceId] = useState<string | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const boundaryFiredRef = useRef(false);
  const useTimerRef = useRef(needsTimerFallback());
  const onPageCompleteRef = useRef(onPageComplete);
  onPageCompleteRef.current = onPageComplete;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    clearTimers();
    setIsPlaying(false);
    setCurrentWordId(null);
    setCurrentSentenceId(null);
  }, [clearTimers]);

  // Stop when page changes.
  useEffect(() => {
    stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearTimers();
    };
  }, [clearTimers]);

  const startTimerHighlighting = useCallback((words: WordEntry[], rate: number) => {
    clearTimers();
    const msPerWord = (60000 / (BASE_WPM * rate));
    words.forEach((word, i) => {
      const t = setTimeout(() => {
        setCurrentWordId(word.wordId);
        setCurrentSentenceId(word.sentenceId);
      }, i * msPerWord);
      timersRef.current.push(t);
    });
  }, [clearTimers]);

  const play = useCallback(() => {
    if (!page || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    clearTimers();

    const words = buildWordList(page);
    const text = getPageText(page);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.lang = 'en-US';

    const voice = getSelectedVoice();
    if (voice) utterance.voice = voice;

    boundaryFiredRef.current = false;

    // Build char-index → word map for boundary events.
    const charMap = new Map<number, WordEntry>();
    let charIndex = 0;
    for (const word of words) {
      charMap.set(charIndex, word);
      charIndex += word.text.length + 1;
    }

    utterance.onboundary = (event) => {
      if (event.name !== 'word') return;

      // First boundary: disable timer if it was set as a precaution.
      if (!boundaryFiredRef.current) {
        boundaryFiredRef.current = true;
        clearTimers();
      }

      const ci = event.charIndex;
      let best: WordEntry | undefined;
      let bestDiff = Infinity;
      for (const [idx, entry] of charMap) {
        const diff = Math.abs(idx - ci);
        if (diff < bestDiff) { bestDiff = diff; best = entry; }
      }
      if (best) {
        setCurrentWordId(best.wordId);
        setCurrentSentenceId(best.sentenceId);
      }
    };

    utterance.onend = () => {
      clearTimers();
      setIsPlaying(false);
      setCurrentWordId(null);
      setCurrentSentenceId(null);
      onPageCompleteRef.current?.();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      clearTimers();
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);

    // On iOS/Safari, start timer-based fallback immediately.
    // If boundary events do fire, clearTimers() above kills the timers.
    if (useTimerRef.current) {
      startTimerHighlighting(words, speed);
    } else {
      // Also start timer as insurance for browsers that silently drop boundary events.
      // It will be cancelled if boundary events arrive.
      const watchdog = setTimeout(() => {
        if (!boundaryFiredRef.current) {
          startTimerHighlighting(words, speed);
        }
      }, 800);
      timersRef.current.push(watchdog);
    }
  }, [page, speed, clearTimers, startTimerHighlighting]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    clearTimers();
    setIsPlaying(false);
  }, [clearTimers]);

  const resume = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPlaying(true);
  }, []);

  const speakWord = useCallback((text: string) => {
    window.speechSynthesis?.cancel();
    clearTimers();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.8;
    u.lang = 'en-US';
    const voice = getSelectedVoice();
    if (voice) u.voice = voice;
    window.speechSynthesis?.speak(u);
  }, [clearTimers]);

  const replaySentence = useCallback((sentenceId: string) => {
    if (!page) return;
    for (const para of page.paragraphs) {
      for (const sentence of para.sentences) {
        if (sentence.sentence_id === sentenceId) {
          const text = sentence.words.map(w => w.text).join(' ');
          window.speechSynthesis?.cancel();
          clearTimers();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = speed;
          u.lang = 'en-US';
          const voice = getSelectedVoice();
          if (voice) u.voice = voice;
          window.speechSynthesis?.speak(u);
          return;
        }
      }
    }
  }, [page, speed, clearTimers]);

  return { isPlaying, currentWordId, currentSentenceId, play, pause, resume, stop, speakWord, replaySentence };
}
