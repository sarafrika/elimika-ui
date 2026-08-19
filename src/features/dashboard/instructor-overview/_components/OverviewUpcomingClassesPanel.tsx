import Link from 'next/link';
import { OverviewSectionShell } from './OverviewSectionShell';
import { PersonAvatar } from './OverviewSharedBits';
import type { OverviewUpcomingClass } from './overview-data';

type OverviewUpcomingClassesPanelProps = {
  upcomingClasses: OverviewUpcomingClass[];
};

function UpcomingClassRow({ upcomingClass }: { upcomingClass: OverviewUpcomingClass }) {
  const upcomingClassHref = `/dashboard/instructor/training-hub`;

  return (
    <Link href={upcomingClassHref} className='block'>
      <article className='border-border/60 flex gap-3 border-b px-2 py-3 last:border-b-0'>
        <div className='shrink-0'>
          <PersonAvatar name={upcomingClass.title} />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex min-w-0 items-center gap-2'>
            <h3 className='text-foreground min-w-0 truncate text-[1rem] font-semibold sm:text-[1.05rem]'>
              {upcomingClass.title}
            </h3>

            {upcomingClass.status ? (
              <span className='bg-warning/10 text-warning shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-medium dark:text-amber-300'>
                {upcomingClass.status}
              </span>
            ) : null}
          </div>

          <div className='mt-1.5 flex min-w-0 items-center justify-between gap-3'>
            <p className='text-muted-foreground min-w-0 truncate text-sm'>
              {upcomingClass.metaLabel}
            </p>

            <span className='text-muted-foreground shrink-0 text-right text-xs'>
              {upcomingClass.scheduleLabel}
            </span>
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
    <OverviewSectionShell
      title='Upcoming Classes'
      onActionLabel='See All'
      onActionHref='/dashboard/instructor/calendar'
    >
      {upcomingClasses.length ? (
        <div className=''>
          {upcomingClasses.map(upcomingClass => (
            <UpcomingClassRow key={upcomingClass.id} upcomingClass={upcomingClass} />
          ))}
        </div>
      ) : (
        <p className='border-border bg-card text-muted-foreground rounded-[10px] border border-dashed px-4 py-6 text-sm'>
          No upcoming class instances are scheduled right now.
        </p>
      )}
    </OverviewSectionShell>
  );
}
