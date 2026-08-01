import { FileText, User } from 'lucide-react';

import { RecentActivity } from '../types';

const ActivityIcon = ({ type }: { type: RecentActivity['type'] }) => {
  if (type === 'completion' || type === 'join') {
    return (
      <div className='bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full'>
        <User className='text-primary h-3.5 w-3.5' />
      </div>
    );
  }

  return (
    <div className='bg-primary/5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full'>
      <FileText className='text-primary h-3.5 w-3.5' />
    </div>
  );
};

interface RecentActivityListProps {
  activities: RecentActivity[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return <p className='text-muted-foreground text-sm'>No recent activity yet.</p>;
  }

  return (
    <div className='space-y-3'>
      {activities.map(activity => (
        <div key={activity.id} className='flex items-start gap-2.5'>
          <ActivityIcon type={activity.type} />

          <div className='min-w-0'>
            <p className='text-foreground text-sm leading-tight'>
              <span className='font-semibold'>{activity.student}</span> {activity.action}
              {activity.course && (
                <>
                  {' '}
                  <span className='text-primary font-medium'>{activity.course}</span>
                </>
              )}
            </p>

            <p className='text-muted-foreground mt-0.5 text-xs'>{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
