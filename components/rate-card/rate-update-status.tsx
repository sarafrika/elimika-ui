'use client';

import { Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useWithdrawRateUpdate } from '@/src/features/rate-card/hooks/use-rate-update-mutations';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';

export type RateUpdateStatusProps = {
  kind: TrainingApplicationKind;
  parentUuid: string;
  applicationUuid: string;
  /** `application.pending_rate_update_uuid`; renders nothing when empty. */
  pendingUpdateUuid?: string | null;
  /** Applicant only: offers Withdraw. Callers derive it from the viewer's role. */
  canWithdraw?: boolean;
  /** badge: the pill alone; inline: pill, reassurance and Withdraw. */
  variant?: 'badge' | 'inline';
  className?: string;
};

/** Shows that a rate update is awaiting approval, with Withdraw for the applicant. */
export function RateUpdateStatus({
  kind,
  parentUuid,
  applicationUuid,
  pendingUpdateUuid,
  canWithdraw = false,
  variant = 'inline',
  className,
}: RateUpdateStatusProps) {
  const withdraw = useWithdrawRateUpdate(kind, parentUuid, applicationUuid);
  if (!pendingUpdateUuid) return null;

  const badge = (
    <Badge
      variant='outline'
      className={cn(
        'border-warning/60 bg-warning/10 text-foreground rounded-md',
        variant === 'badge' && className
      )}
    >
      <Clock aria-hidden />
      Updates awaiting approval
    </Badge>
  );
  if (variant === 'badge') return badge;

  const onWithdraw = () =>
    withdraw.mutate(pendingUpdateUuid, {
      onSuccess: () => toast.success('Rate update withdrawn.'),
      onError: error => toast.error(error.message),
    });

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      {badge}
      <span className='text-muted-foreground text-xs'>The approved rates apply until then.</span>
      {canWithdraw ? (
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={onWithdraw}
          disabled={withdraw.isPending}
        >
          {withdraw.isPending ? <Spinner className='h-4 w-4' /> : null}
          Withdraw
        </Button>
      ) : null}
    </div>
  );
}
