import { getClassRecurrencePatternOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';

export function RecurrencePatternCell({ recurrenceUuid }: { recurrenceUuid?: string }) {
  const { data, isLoading } = useQuery(
    getClassRecurrencePatternOptions({ path: { uuid: recurrenceUuid as string } })
  );

  if (isLoading) return <span className='text-muted-foreground'>Loading...</span>;

  return <span className='text-foreground'>{data?.data?.recurrence_type}</span>;
}

export function RecurrenceDaysCell({ recurrenceUuid }: { recurrenceUuid?: string }) {
  const { data, isLoading } = useQuery(
    getClassRecurrencePatternOptions({ path: { uuid: recurrenceUuid as string } })
  );

  if (isLoading) return <span className='text-muted-foreground'>Loading...</span>;

  return <span className='text-foreground'>{data?.data?.days_of_week}</span>;
}
