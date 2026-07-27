import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type StatusTone, resolveStatusTone, statusToneClass } from './admin-theme';

interface StatusBadgeProps {
  /** Raw status string from the backend (any enum/case) — auto-mapped to a tone + label. */
  status?: string | null;
  /** Override the resolved tone. */
  tone?: StatusTone;
  /** Override the displayed label. */
  label?: string;
  className?: string;
}

/**
 * Semantic status pill used everywhere statuses appear (verification, account, content,
 * moderation). Pass a raw status string and it resolves tone + label, or override either.
 */
export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  const resolved = resolveStatusTone(status);
  const finalTone = tone ?? resolved.tone;
  const finalLabel = label ?? resolved.label;

  return (
    <Badge
      variant='outline'
      className={cn('rounded-md px-2.5 py-0.5 text-xs font-medium', statusToneClass[finalTone], className)}
    >
      {finalLabel}
    </Badge>
  );
}
