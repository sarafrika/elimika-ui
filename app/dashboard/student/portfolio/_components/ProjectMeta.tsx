import { CheckCircle2, CircleCheck, MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProjectMetaProps = {
  date: string;
  badge: string;
};

type StatusLineProps = {
  status?: 'approved' | 'verified';
  sponsor?: string;
  muted?: boolean;
};

export function ProjectDateBadge({ date, badge }: Pick<ProjectMetaProps, 'date' | 'badge'>) {
  return (
    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
      <span>{date}</span>
      <Badge
        variant='secondary'
        className='text-foreground border-transparent bg-[color-mix(in_srgb,var(--el-accent-amber)_24%,var(--card))] px-3 text-[11px] font-medium'
      >
        {badge}
      </Badge>
    </div>
  );
}

export function StatusLine({ status, sponsor, muted }: StatusLineProps) {
  if (!status && !sponsor) {
    return null;
  }

  return (
    <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
      {status === 'approved' ? (
        <span className='text-success inline-flex items-center gap-1.5 font-semibold'>
          <CircleCheck className='fill-success text-success-foreground size-4' />
          Approved
        </span>
      ) : null}

      {sponsor ? (
        <span
          className={cn(
            'flex min-w-0 items-start gap-1.5 font-medium',
            muted && 'text-muted-foreground'
          )}
        >
          <span className='shrink-0'>
            {muted ? (
              <MessageCircle className='text-primary size-4' />
            ) : (
              <CheckCircle2 className='text-primary size-4' />
            )}
          </span>

          <span className='min-w-0 leading-snug'>
            Verified by <strong className='text-primary break-words'>{sponsor}</strong>
          </span>
        </span>
      ) : null}
    </div>
  );
}
