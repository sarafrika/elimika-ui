import Link from 'next/link';
import { OverviewSectionShell } from './OverviewSectionShell';
import { PersonAvatar } from './OverviewSharedBits';
import type { OverviewUpcomingClass } from './overview-data';

type OverviewUpcomingClassesPanelProps = {
  upcomingClasses: OverviewUpcomingClass[];
};

function UpcomingClassRow({ upcomingClass }: { upcomingClass: OverviewUpcomingClass }) {
  return (
    <Link href={upcomingClass.href} className='block'>
      <article className='flex items-start gap-3 border-b border-border/60 px-2 py-3 last:border-b-0'>
        <PersonAvatar name={upcomingClass.title} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-[1rem] font-semibold text-foreground sm:text-[1.05rem]'>
                {upcomingClass.title}
              </h3>
              <p className='truncate text-sm text-muted-foreground'>{upcomingClass.metaLabel}</p>
            </div>

            <div className='flex flex-col items-end gap-1'>
              {upcomingClass.status ? (
                <span className='rounded-full bg-warning/10 px-3 py-1 text-[0.75rem] font-medium text-warning dark:text-amber-300'>
                  {upcomingClass.status}
                </span>
              ) : null}
              <span className='text-right text-sm text-muted-foreground'>
                {upcomingClass.scheduleLabel}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function OverviewUpcomingClassesPanel({
  upcomingClasses,
}: OverviewUpcomingClassesPanelProps) {
  return (
      <OverviewSectionShell title='Upcoming Classes' onActionLabel='See All' onActionHref='/dashboard/calendar'>
      {upcomingClasses.length ? (
        <div className='rounded-[10px] border border-border bg-card px-2 py-1 shadow-sm'>
          {upcomingClasses.map(upcomingClass => (
            <UpcomingClassRow key={upcomingClass.id} upcomingClass={upcomingClass} />
          ))}
        </div>
      ) : (
        <p className='rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
          No upcoming class instances are scheduled right now.
        </p>
      )}
    </OverviewSectionShell>
  );
}
