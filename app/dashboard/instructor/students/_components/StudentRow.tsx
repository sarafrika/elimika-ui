import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

import { useRouter } from 'next/navigation';
import type { StudentRosterEntry } from '../types';

interface StudentRowProps {
  student: StudentRosterEntry;
}

export function StudentRow({ student }: StudentRowProps) {
  const router = useRouter();
  const classCount = student.classes.length;
  const courseCount = student.courses.length;
  const joinedDate = student.profile?.created_date ? new Date(student.profile.created_date) : null;

  return (
    <tr
      onClick={() =>
        router.push(
          `/dashboard/instructor/students/${student?.student?.user_uuid}?sId=${student?.student?.uuid}`
        )
      }
      className='border-border hover:bg-muted/40 cursor-pointer border-b transition-colors'
    >
      {/* Student */}
      <td className='px-2 py-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <div
            className={`flex min-h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold uppercase ${student.student.avatarColor}`}
          >
            {student.student.initials}
          </div>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-semibold'>
              {student.student.full_name}
            </p>
            <p className='text-muted-foreground text-xs'>ID: {student.student.uuid.slice(0, 8)}</p>
          </div>
        </div>
      </td>

      {/* Courses */}
      <td className='hidden px-2 py-3 sm:table-cell'>
        <div className='text-foreground space-y-0.5 text-sm font-medium'>
          {student.courses
            .map(c => c?.name)
            .filter(Boolean)
            .map((name, i) => (
              <p key={i} className='truncate'>
                {name}
              </p>
            ))}
        </div>

        <p className='text-muted-foreground space-x-1 text-xs'>
          {courseCount} {courseCount === 1 ? 'course' : 'courses'} •{'  '}
          {classCount} {classCount === 1 ? 'class' : 'classes'}
        </p>
      </td>

      {/* Status */}
      <td className='items-center py-3'>
        <StatusBadge status={student.status} />
      </td>

      {/* Progress */}
      <td className='hidden px-2 py-3 md:table-cell'>
        <ProgressBar value={student.progress} />
      </td>

      {/* Joined date */}
      <td className='hidden px-4 py-3 md:table-cell'>
        {joinedDate && !isNaN(joinedDate.getTime())
          ? new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).format(joinedDate)
          : '—'}
      </td>
    </tr>
  );
}
