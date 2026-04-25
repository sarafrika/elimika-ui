'use client';

import type { TrainingHubWaitingStudent } from './training-hub-data';

type WaitingListItemProps = {
  student: TrainingHubWaitingStudent;
};

export function WaitingListItem({ student }: WaitingListItemProps) {
  const initials = student.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2);

  return (
    <article className='flex items-center gap-3 rounded-[12px] border border-border/60 bg-card px-3 py-2.5 shadow-sm'>
      <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_18%,transparent),color-mix(in_srgb,var(--primary)_8%,transparent))] text-[0.82rem] font-semibold text-primary'>
        {initials}
      </span>

      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h3 className='truncate text-[1rem] font-semibold text-foreground'>{student.name}</h3>
            <p className='truncate text-[0.79rem] text-muted-foreground sm:text-[0.82rem]'>
              {student.email}
            </p>
            <p className='mt-1 truncate text-[0.75rem] text-muted-foreground/90 sm:text-[0.79rem]'>
              {student.classTitle} • {student.scheduleLabel}
            </p>
          </div>
          <span className='text-[0.78rem] font-medium text-muted-foreground'>{student.age}</span>
        </div>
      </div>

      {student.status ? (
        <span className='inline-flex rounded-full bg-warning/10 px-3 py-1 text-[0.74rem] font-medium text-warning dark:text-amber-300'>
          {student.status}
        </span>
      ) : null}
    </article>
  );
}
