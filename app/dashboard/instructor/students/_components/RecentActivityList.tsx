import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getStudentAvatarColor,
  getStudentInitials,
  type RecentActivity,
  type StudentRosterEntry,
} from '../types';

export function RecentActivityList({
  activities,
  students,
}: {
  activities: RecentActivity[];
  students?: StudentRosterEntry[];
}) {
  const identities = useMemo(
    () => new Map(students?.map(student => [student.student.full_name, student.student]) ?? []),
    [students]
  );
  if (!activities.length)
    return <EmptyState variant='plain' title='No recent activity yet' className='px-0 py-5' />;
  return (
    <div>
      {activities.map(activity => {
        const student = identities.get(activity.student);
        return (
          <div
            key={activity.id}
            className='border-border flex items-start gap-3 border-t py-2.5 first:border-0'
          >
            <Avatar className='size-8 shrink-0'>
              <AvatarFallback
                className={`text-[11px] font-semibold ${student?.avatarColor ?? getStudentAvatarColor(activity.student)}`}
              >
                {student?.initials ?? getStudentInitials(activity.student)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='text-foreground text-[13px] leading-relaxed'>
                <strong className='font-semibold'>{activity.student}</strong> {activity.action}
                {activity.course && (
                  <>
                    {' '}
                    <span className='text-primary font-semibold'>{activity.course}</span>
                  </>
                )}
              </p>
              <p className='text-muted-foreground mt-0.5 text-xs'>{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
