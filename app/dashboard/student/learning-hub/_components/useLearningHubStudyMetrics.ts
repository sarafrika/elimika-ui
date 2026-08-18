'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'elimika-student-learning-activity-v1';
const MIN_TRACKED_SESSION_MS = 30_000;
const WEEK_WINDOW_DAYS = 7;

type StudyActivityStore = Record<string, number>;

export type StudyMetrics = {
  weeklyStudyMinutes: number;
  studyStreakDays: number;
};

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function readStudyActivityStore(): StudyActivityStore {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, value]) => typeof value === 'number')
    );
  } catch {
    return {};
  }
}

function writeStudyActivityStore(store: StudyActivityStore) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function computeStudyMetrics(store: StudyActivityStore, liveStartedAt: number | null): StudyMetrics {
  const now = Date.now();
  const liveMinutes =
    liveStartedAt === null
      ? 0
      : Math.max(0, Math.round((now - liveStartedAt) / 60_000));
  const liveKey = liveMinutes > 0 ? getDateKey(new Date(now)) : null;
  const effectiveStore =
    liveKey === null
      ? store
      : {
          ...store,
          [liveKey]: (store[liveKey] ?? 0) + liveMinutes,
        };

  const weeklyStudyMinutes = Array.from({ length: WEEK_WINDOW_DAYS }).reduce((sum, _, index) => {
    const key = getDateKey(getDateDaysAgo(index));
    return sum + (effectiveStore[key] ?? 0);
  }, 0);

  const activeDays = Object.keys(effectiveStore)
    .filter((key) => (effectiveStore[key] ?? 0) > 0)
    .sort((left, right) => right.localeCompare(left));

  if (activeDays.length === 0) {
    return {
      weeklyStudyMinutes,
      studyStreakDays: 0,
    };
  }

  let streakDays = 0;
  const cursor = new Date(`${activeDays[0]}T00:00:00`);

  while (!Number.isNaN(cursor.getTime())) {
    const key = getDateKey(cursor);
    if ((effectiveStore[key] ?? 0) <= 0) {
      break;
    }

    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    weeklyStudyMinutes,
    studyStreakDays: streakDays,
  };
}

function recordStudyMinutes(startedAt: number) {
  if (typeof window === 'undefined') {
    return;
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < MIN_TRACKED_SESSION_MS) {
    return;
  }

  const store = readStudyActivityStore();
  const key = getDateKey();
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
  store[key] = (store[key] ?? 0) + minutes;
  writeStudyActivityStore(store);
}

export function useLearningHubStudyMetrics() {
  const [revision, setRevision] = useState(0);
  const sessionStartedAt = useRef<number | null>(null);

  const metrics = useMemo(
    () => computeStudyMetrics(readStudyActivityStore(), sessionStartedAt.current),
    [revision]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    sessionStartedAt.current = document.visibilityState === 'visible' ? Date.now() : null;

    const refresh = () => {
      setRevision((value) => value + 1);
    };

    refresh();

    const flush = () => {
      const startedAt = sessionStartedAt.current;
      if (startedAt === null) {
        return;
      }

      recordStudyMinutes(startedAt);
      sessionStartedAt.current = Date.now();
      refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
        sessionStartedAt.current = null;
        return;
      }

      sessionStartedAt.current = Date.now();
      refresh();
    };

    const handlePageHide = () => {
      flush();
      sessionStartedAt.current = null;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    const intervalId = window.setInterval(() => {
      if (sessionStartedAt.current !== null && document.visibilityState === 'visible') {
        refresh();
      }
    }, 60_000);

    return () => {
      flush();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.clearInterval(intervalId);
    };
  }, []);

  return metrics;
}
