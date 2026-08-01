import type { StudentRosterClass } from '../types';

interface CourseListProps {
  classes: StudentRosterClass[];
}

export function CourseList({ classes }: CourseListProps) {
  return (
    <div className='space-y-1'>
      {classes.map(item => (
        <div
          key={item.uuid}
          className='hover:bg-muted group flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 transition-colors'
        >
          <div className='flex min-w-0 items-center gap-2.5'>
            {item.course?.thumbnail_url ? (
              <img
                src={item.course.thumbnail_url}
                alt={item.course?.name ?? 'Course thumbnail'}
                className='h-6 w-6 shrink-0 rounded object-cover'
              />
            ) : (
              <div className='bg-muted-foreground/40 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold uppercase'>
                {item.title?.slice(0, 2)}
              </div>
            )}

            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors'>
                {item.title}
              </span>

              <span className='text-muted-foreground group-hover:text-primary truncate text-xs transition-colors'>
                {item?.course?.name}
              </span>
            </div>
          </div>
          <span className='text-muted-foreground ml-2 shrink-0 text-xs'>
            {Array.from(new Set(item?.enrollment?.map(e => e.student_uuid).filter(Boolean))).length}{' '}
            Students
          </span>
        </div>
      ))}
    </div>
  );
}
