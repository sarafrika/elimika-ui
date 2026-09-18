import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { applicationStatusDisplay, STATUS_TONE_CLASS } from '../application-display';
import type { TrainingApplicationKind } from '../types';

/** A training application's status pill, worded for the applicant or the owner. */
export function ApplicationStatusBadge({
  status,
  kind = 'course',
  hasPendingUpdate,
  viewer,
  className,
}: {
  status: string | null | undefined;
  kind?: TrainingApplicationKind;
  hasPendingUpdate?: boolean;
  viewer?: 'applicant' | 'owner';
  className?: string;
}) {
  const { label, tone } = applicationStatusDisplay(status, { hasPendingUpdate, viewer, kind });
  return (
    <Badge variant='outline' className={cn('rounded-md', STATUS_TONE_CLASS[tone], className)}>
      {label}
    </Badge>
  );
}
