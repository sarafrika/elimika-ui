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
    <article className='rounded-[10px] border border-border bg-card px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-[0.9rem] font-medium text-muted-foreground'>
          {liveClass.timeLabel}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`${liveClass.title} options`}
              className='rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground'
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

      <h3 className='mt-1 text-[1.05rem] font-semibold text-foreground sm:text-[1.1rem]'>
        {liveClass.title}
      </h3>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='flex flex-wrap items-center gap-2 text-[0.9rem] text-muted-foreground'>
          <span className='font-semibold text-primary'>
            {liveClass.provider}
          </span>
          <span>|</span>
          <span>{liveClass.students}</span>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2 mt-2 self-end justify-end'>
        <InitialsGroup initials={liveClass.attendeeInitials} />
        <ActionButton href={liveClass.infoHref} label='View info' tone='muted' />
        <ActionButton href={liveClass.href} label={liveClass.actionLabel} />
      </div>
    </article>
  );
}

export function OverviewLiveClassesPanel({ liveClasses }: OverviewLiveClassesPanelProps) {
  return (
    <OverviewSectionShell title='Live Classes' onActionLabel='See All' onActionHref='/dashboard/classes'>
      {liveClasses.length ? (
        <div className='space-y-3'>
          {liveClasses.map(liveClass => (
            <LiveClassRow key={liveClass.id} liveClass={liveClass} />
          ))}
        </div>
      ) : (
        <p className='rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
          No live or imminent class instances found.
        </p>
      )}
    </OverviewSectionShell>
  );
}
