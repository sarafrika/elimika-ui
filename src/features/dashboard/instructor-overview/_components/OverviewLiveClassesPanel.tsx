import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';
import type { OverviewLiveClass } from './overview-data';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton, InitialsGroup } from './OverviewSharedBits';

type OverviewLiveClassesPanelProps = {
  liveClasses: OverviewLiveClass[];
};

function LiveClassRow({ liveClass }: { liveClass: OverviewLiveClass }) {
  return (
    <article className='border-border bg-card rounded-[10px] border px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-muted-foreground text-[0.9rem] font-medium'>{liveClass.timeLabel}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`${liveClass.title} options`}
              className='text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full transition'
            >
              <EllipsisVertical className='size-4' />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuItem asChild>
              <Link href={liveClass.infoHref} className='flex w-full items-center gap-2'>
                View info
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={liveClass.href} className='flex w-full items-center gap-2'>
                Manage class
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className='text-foreground mt-1 text-[1.05rem] font-semibold sm:text-[1.1rem]'>
        {liveClass.title}
      </h3>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-[0.9rem]'>
          <span className='text-primary font-semibold'>{liveClass.provider}</span>
          <span>|</span>
          <span>{liveClass.students}</span>
        </div>
      </div>

      <div className='mt-2 flex flex-wrap items-center justify-end gap-2 self-end'>
        <InitialsGroup initials={liveClass.attendeeInitials} />
        <ActionButton href={liveClass.infoHref} label='View info' tone='muted' />
        <ActionButton href={liveClass.href} label={liveClass.actionLabel} />
      </div>
    </article>
  );
}

export function OverviewLiveClassesPanel({ liveClasses }: OverviewLiveClassesPanelProps) {
  return (
    <OverviewSectionShell
      title='Live Classes'
      onActionLabel='See All'
      onActionHref='/dashboard/classes'
    >
      {liveClasses.length ? (
        <div className='space-y-3'>
          {liveClasses.map(liveClass => (
            <LiveClassRow key={liveClass.id} liveClass={liveClass} />
          ))}
        </div>
      ) : (
        <p className='border-border bg-card text-muted-foreground rounded-[10px] border border-dashed px-4 py-6 text-sm'>
          No live or imminent class instances found.
        </p>
      )}
    </OverviewSectionShell>
  );
}
