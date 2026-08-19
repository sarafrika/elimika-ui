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
  const infoHref = `/dashboard/instructor/training-hub/classes/${liveClass?.id}`;
  const manageHref = `/dashboard/instructor/classes/new?id=${liveClass?.id}`;

  return (
    <article className='border-border/70 bg-card/80 rounded-[12px] border px-3.5 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <span className='bg-muted/50 text-muted-foreground rounded-full px-2 py-1 text-[0.72rem] font-medium'>
          {liveClass.timeLabel}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`${liveClass.title} options`}
              className='text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-full transition'
            >
              <EllipsisVertical className='size-4' />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuItem asChild>
              <Link href={infoHref} className='flex w-full items-center gap-2'>
                View info
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={manageHref} className='flex w-full items-center gap-2'>
                Manage class
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className='text-foreground mt-2 text-[1rem] font-semibold sm:text-[1.05rem]'>
        {liveClass.title}
      </h3>

      <div className='mt-2 flex flex-wrap items-center gap-2 text-[0.84rem] text-muted-foreground'>
        <span className='text-primary font-semibold'>{liveClass.provider}</span>
        <span className='text-muted-foreground/60'>|</span>
        <span>{liveClass.students}</span>
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
        <InitialsGroup initials={liveClass.attendeeInitials} />

        <div className='ml-auto flex flex-wrap items-center justify-end gap-2'>
          <ActionButton href={infoHref} label='View info' tone='muted' />
          <ActionButton href={manageHref} label={liveClass.actionLabel} />
        </div>
      </div>
    </article>
  );
}


export function OverviewLiveClassesPanel({ liveClasses }: OverviewLiveClassesPanelProps) {
  return (
    <OverviewSectionShell
      title='Live Classes'
      onActionLabel='See All'
      onActionHref='/dashboard/instructor/training-hub'
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
