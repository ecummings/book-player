'use client';
import { useCallback, useEffect, useRef } from 'react';
import { AnalyticsEvent } from '@/lib/types';
import { getCurrentUserId } from '@/lib/storage';

const SESSION_KEY = 'bp_session_id';
const EVENTS_KEY  = 'bp_analytics_events';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function storeEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(EVENTS_KEY);
  const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
  events.push(event);
  if (events.length > 1000) events.splice(0, events.length - 1000);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function useAnalytics(bookId?: string) {
  const sessionId   = useRef(getSessionId());
  const sessionStart = useRef(Date.now());
  // Capture user at mount time; stable for the life of the component.
  const userId = useRef(getCurrentUserId());

  const track = useCallback((eventName: string, properties: Record<string, unknown> = {}) => {
    const event: AnalyticsEvent = {
      event: eventName,
      session_id: sessionId.current,
      timestamp: Date.now(),
      properties: {
        book_id: bookId,
        student_id: userId.current ?? undefined,
        ...properties,
      },
    };
    storeEvent(event);
  }, [bookId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        track('session_ended', { session_duration_ms: Date.now() - sessionStart.current });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [track]);

  return { track };
}
