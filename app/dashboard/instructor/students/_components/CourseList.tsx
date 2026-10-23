import Image from 'next/image';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import type { StudentRosterClass } from '../types';

export function CourseList({ classes }: { classes: StudentRosterClass[] }) {
  if (!classes.length)
    return <EmptyState variant='plain' title='No classes to show' className='px-0 py-5' />;
  return (
    <div>
      {classes.map(item => {
        const imageUrl = toAuthenticatedMediaUrl(item.course?.thumbnail_url);
        const count = new Set(
          item.enrollment?.map(enrollment => enrollment.student_uuid).filter(Boolean)
        ).size;
        return (
          <div
            key={item.uuid ?? item.title}
            className='border-border flex min-w-0 items-center gap-3 border-t py-2.5 first:border-0'
          >
            <div className='border-border bg-muted/40 text-muted-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-xs font-bold uppercase'>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={36}
                  height={36}
                  alt=''
                  className='size-9 object-cover'
                />
              ) : (
                item.title?.slice(0, 2) || 'CL'
              )}
            </div>
            <div className='min-w-0 flex-1'>
              {item.uuid ? (
                <Link
                  href={`/dashboard/instructor/classes/overview/${item.uuid}`}
                  className='text-foreground hover:text-primary block truncate text-sm font-semibold hover:underline'
                >
                  {item.title || 'Untitled class'}
                </Link>
              ) : (
                <p className='text-foreground truncate text-sm font-semibold'>
                  {item.title || 'Untitled class'}
                </p>
              )}
              {item.course?.name && (
                <p className='text-muted-foreground mt-0.5 truncate text-xs'>{item.course.name}</p>
              )}
            </div>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {count} {count === 1 ? 'student' : 'students'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
