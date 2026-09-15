import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export function WorkbookError({
  title = 'Unable to load class data',
  retry,
}: {
  title?: string;
  retry: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description='Please try again.'
      action={
        <Button variant='outline' onClick={retry}>
          Retry
        </Button>
      }
    />
  );
}
