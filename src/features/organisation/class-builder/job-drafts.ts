import type { Hiring, HiringJobRequest, Place } from './use-class-builder';

/** Unposted job forms, kept in this browser only; the API has no draft jobs. */
export type JobDraft = {
  id: string;
  savedAt: number;
  title: string;
  request: HiringJobRequest;
  place: Place;
  hiring: Hiring;
  instructorPay: string;
};

const KEY = 'elimika:org-job-drafts';
const MAX_DRAFTS = 20;

export function listJobDrafts(): JobDraft[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as JobDraft[]) : [];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

function write(drafts: JobDraft[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  } catch {
    // Storage is full or blocked; the form itself still works.
  }
}

export function saveJobDraft(draft: Omit<JobDraft, 'id' | 'savedAt'> & { id?: string }): JobDraft {
  const next: JobDraft = {
    ...draft,
    id: draft.id ?? `draft-${Date.now()}`,
    savedAt: Date.now(),
  };
  write([next, ...listJobDrafts().filter(existing => existing.id !== next.id)]);
  return next;
}

export function deleteJobDraft(id: string): JobDraft[] {
  const remaining = listJobDrafts().filter(draft => draft.id !== id);
  write(remaining);
  return remaining;
}

export function timeAgo(savedAt: number) {
  const minutes = Math.max(0, Math.round((Date.now() - savedAt) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
