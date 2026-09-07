import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROSPECT_ACCESS_BLURB,
  PROSPECT_ACCESS_LABEL,
  PROSPECT_ACCESS_SOURCE,
  PROSPECT_GRANTS,
} from '@/src/features/catalogue/prospect';
import { GrantIcon, grantLabelClass, RailCard } from './RecordSurfaces';

/**
 * The access card that opens the rail.
 *
 * It answers three questions in the order a reader asks them: what access you
 * have, why you have it, and what that buys you — four lines of check, lock and
 * dash. Every word is the prospect's, because a public catalogue listing has
 * exactly one viewer state and never widens it: the API, not this route, is what
 * would ever say otherwise, and this page does not ask it.
 */
export function CourseAccessCard({ className }: { className?: string }) {
  return (
    <RailCard className={cn('border-primary/30 bg-primary/10', className)}>
      <div className='flex items-center gap-[9px]'>
        <span className='bg-primary/20 text-primary inline-flex size-8 flex-none items-center justify-center rounded-[10px]'>
          <ShieldCheck className='size-4' aria-hidden />
        </span>
        <span className='min-w-0'>
          <span className='block text-[13.5px] font-bold'>{PROSPECT_ACCESS_LABEL}</span>
          <span className='text-muted-foreground block text-[11.5px]'>
            {PROSPECT_ACCESS_SOURCE}
          </span>
        </span>
      </div>

      <p className='text-foreground/80 mt-[11px] text-[12.5px] leading-[1.55]'>
        {PROSPECT_ACCESS_BLURB}
      </p>

      <ul className='mt-3 flex flex-col gap-[7px]'>
        {PROSPECT_GRANTS.map(grant => (
          <li
            key={grant.label}
            className={cn('flex items-center gap-2 text-[12.5px]', grantLabelClass(grant.tone))}
          >
            <GrantIcon tone={grant.tone} className='size-[15px]' />
            {grant.label}
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
