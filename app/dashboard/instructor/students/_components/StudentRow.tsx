'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TableCell, TableRow } from '@/components/ui/table';
import { parseApiDate } from '@/lib/date';
import type { StudentRosterEntry } from '../types';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

export function StudentRow({ student }: { student: StudentRosterEntry }) {
  const router = useRouter();
  const classCount = student.classes.length;
  const courseCount = student.courses.length;
  const courseNames = student.courses.map(course => course.name).filter(Boolean);
  const joined = parseApiDate(student.student.joinedAt ?? student.profile?.created_date);
  const href = `/dashboard/instructor/students/${student.student.user_uuid}?sId=${student.student.uuid}`;

  return (
    <TableRow onClick={() => router.push(href)} className='hover:bg-muted/30 cursor-pointer'>
      <TableCell className='px-5 py-3.5'>
        <div className='flex min-w-48 items-center gap-3'>
          <Avatar className='size-9 shrink-0'>
            <AvatarFallback className={`text-xs font-semibold ${student.student.avatarColor}`}>
              {student.student.initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <Link
              href={href}
              onClick={event => event.stopPropagation()}
              className='text-foreground text-sm font-semibold hover:underline'
            >
              {student.student.full_name}
            </Link>
            <p className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
              ID {student.student.uuid.slice(0, 8)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className='w-80 max-w-80 min-w-64 px-5 py-3.5 whitespace-normal'>
        <p className='text-foreground text-[13px] font-semibold'>
          {courseNames[0] || student.classes[0]?.title || 'No course assigned'}
        </p>
        {courseNames.length > 1 && (
          <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed'>
            {courseNames.slice(1).join(' · ')}
          </p>
        )}
        <p className='text-muted-foreground mt-1 flex items-center gap-1.5 text-xs'>
          <span>
            {courseCount} {courseCount === 1 ? 'course' : 'courses'}
          </span>
          <span aria-hidden='true' className='bg-muted-foreground/60 size-0.5 rounded-full' />
          <span>
            {classCount} {classCount === 1 ? 'class' : 'classes'}
          </span>
        </p>
      </TableCell>
      <TableCell className='px-5 py-3.5'>
        <StatusBadge status={student.status} />
      </TableCell>
      <TableCell className='min-w-32 px-5 py-3.5'>
        <ProgressBar value={student.progress} />
      </TableCell>
      <TableCell className='text-muted-foreground px-5 py-3.5 text-[13px] tabular-nums'>
        {joined ? (
          <time dateTime={joined.toISOString()}>
            {new Intl.DateTimeFormat('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(joined.toDate())}
          </time>
        ) : (
          '—'
        )}
      </TableCell>
    </TableRow>
  );
}
