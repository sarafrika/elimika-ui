import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resolveStatusTone, statusToneClass, type StatusTone } from './tone';

interface StatusBadgeProps {
  /** Raw status string from the API, in any case. Resolved to a tone and a label. */
  status?: string | null;
  /** Override the resolved tone. */
  tone?: StatusTone;
  /** Override the resolved label. */
  label?: string;
  className?: string;
}

/** Status pill used wherever a record carries a state. */
export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  const resolved = resolveStatusTone(status);

  return (
    <Badge
      variant='outline'
      className={cn(
        'rounded-sm px-2 py-0.5 text-xs font-semibold',
        statusToneClass[tone ?? resolved.tone],
        className
      )}
    >
      {label ?? resolved.label}
    </Badge>
  );
}
