/**
 * Status tones shared by every dashboard. Semantic tokens only, so the palette check
 * stays green and the tones follow the active domain's theme in light and dark mode.
 */
export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'neutral';

export const statusToneClass: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-primary/30 bg-primary/10 text-primary',
  neutral: 'border-border/70 bg-muted/40 text-muted-foreground',
};

const TONE_BY_STATUS: Record<string, StatusTone> = {
  active: 'success',
  approved: 'success',
  assigned: 'success',
  completed: 'success',
  paid: 'success',
  published: 'success',
  settled: 'success',
  true: 'success',
  verified: 'success',
  accrued: 'warning',
  awaiting_class: 'warning',
  draft: 'warning',
  in_review: 'warning',
  pending: 'warning',
  pending_review: 'warning',
  processing: 'warning',
  submitted: 'warning',
  interviewing: 'info',
  offered: 'info',
  shortlisted: 'info',
  archived: 'destructive',
  disputed: 'destructive',
  dismissed: 'destructive',
  failed: 'destructive',
  false: 'destructive',
  inactive: 'destructive',
  rejected: 'destructive',
  suspended: 'destructive',
  cancelled: 'neutral',
  expired: 'neutral',
  not_selected: 'neutral',
  withdrawn: 'neutral',
};

const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());

/** Map any backend status string to a tone and a readable label. */
export function resolveStatusTone(status?: string | null): { tone: StatusTone; label: string } {
  const raw = (status ?? '').toString().trim();
  if (!raw) return { tone: 'neutral', label: 'Unknown' };

  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  return { tone: TONE_BY_STATUS[key] ?? 'neutral', label: titleCase(raw) };
}
