import { OverviewSectionShell } from './OverviewSectionShell';
import { PersonAvatar } from './OverviewSharedBits';
import type { OverviewUpcomingClass } from './overview-data';

type OverviewUpcomingClassesPanelProps = {
  upcomingClasses: OverviewUpcomingClass[];
};

function UpcomingClassRow({ upcomingClass }: { upcomingClass: OverviewUpcomingClass }) {
  return (
    <article className='flex items-start gap-3 border-b border-[#eef0fc] px-2 py-3 last:border-b-0'>
      <PersonAvatar name={upcomingClass.title} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h3 className='truncate text-[1rem] font-semibold text-slate-800 sm:text-[1.05rem]'>
              {upcomingClass.title}
            </h3>
            <p className='truncate text-sm text-slate-500'>{upcomingClass.metaLabel}</p>
          </div>

          <div className='flex flex-col items-end gap-1'>
            {upcomingClass.status ? (
              <span className='rounded-full bg-[#fdf0e6] px-3 py-1 text-[0.75rem] font-medium text-[#9a7a50]'>
                {upcomingClass.status}
              </span>
            ) : null}
            <span className='text-right text-sm text-slate-500'>{upcomingClass.scheduleLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OverviewUpcomingClassesPanel({
  upcomingClasses,
}: OverviewUpcomingClassesPanelProps) {
  return (
    <OverviewSectionShell title='Upcoming Classes' onActionLabel='See All' onActionHref='/dashboard/calendar' >
      {upcomingClasses.length ? (
        <div className='rounded-[10px] border border-[#e6e8fb] bg-white px-2 py-1 shadow-[0_6px_18px_rgba(99,102,241,0.04)]'>
          {upcomingClasses.map(upcomingClass => (
            <UpcomingClassRow key={upcomingClass.id} upcomingClass={upcomingClass} />
          ))}
        </div>
      ) : (
        <p className='rounded-[10px] border border-dashed border-[#d7dbfb] bg-white px-4 py-6 text-sm text-slate-500'>
          No upcoming class instances are scheduled right now.
        </p>
      )}
    </OverviewSectionShell>
  );
}
