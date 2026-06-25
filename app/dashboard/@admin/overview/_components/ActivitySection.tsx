import { Activity } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchAdminActivityFeed } from '@/services/admin';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function formatWhen(value?: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function ActivitySection() {
  const { events } = await fetchAdminActivityFeed().catch(() => ({ events: [] }));

  if (!events.length) {
    return (
      <EmptyState
        icon={Activity}
        variant='compact'
        title='No recent activity'
        description='System events will appear here as they happen.'
      />
    );
  }

  return (
    <ul className='divide-y divide-border/60'>
      {events.slice(0, 12).map((event, index) => {
        const when = formatWhen(event.occurred_at || event.created_at || event.timestamp);
        return (
          <li key={index} className='flex items-start justify-between gap-3 py-3'>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>
                {event.message || event.state || 'Event'}
              </p>
              <p className='truncate text-xs text-muted-foreground'>
                {event.actor_name || event.actor_identifier || 'System'}
                {when ? ` · ${when}` : ''}
              </p>
            </div>
            {event.severity ? <StatusBadge status={event.severity} /> : null}
          </li>
        );
      })}
    </ul>
  );
}
