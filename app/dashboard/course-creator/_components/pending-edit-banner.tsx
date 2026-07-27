'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getPendingEditOptions,
  getPendingEditQueryKey,
  withdrawPendingEditMutation,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Tells a creator that their edit is waiting on an admin, and that learners are still being
 * served the previously approved version in the meantime.
 *
 * Without this, saving an edit to a published course looks like nothing happened: the form
 * reloads the live course, which deliberately still shows the old content.
 */
export function PendingEditBanner({ courseUuid }: { courseUuid: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data } = useQuery({
    ...getPendingEditOptions({ path: { uuid: courseUuid } }),
    enabled: !!courseUuid,
  });
  const pendingEdit = data?.data;

  const withdraw = useMutation(withdrawPendingEditMutation());

  if (!pendingEdit) return null;

  const submittedAt = pendingEdit.submitted_at
    ? new Date(pendingEdit.submitted_at).toLocaleString()
    : undefined;

  const onWithdraw = async () => {
    try {
      await withdraw.mutateAsync({ path: { uuid: courseUuid } });
      toast.success('Changes withdrawn. Your course is unchanged.');
      setConfirming(false);
      queryClient.invalidateQueries({
        queryKey: getPendingEditQueryKey({ path: { uuid: courseUuid } }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not withdraw the changes');
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-start gap-3'>
        <Clock className='mt-0.5 size-4 shrink-0 text-warning' />
        <div className='min-w-0'>
          <p className='text-sm font-medium'>Your changes are waiting for review</p>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Your course stays published and learners keep seeing the approved version until an
            admin reviews these changes.
            {submittedAt ? ` Submitted ${submittedAt}.` : ''}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className='flex shrink-0 gap-2'>
          <Button
            variant='destructive'
            size='sm'
            onClick={onWithdraw}
            disabled={withdraw.isPending}
          >
            Discard changes
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setConfirming(false)}
            disabled={withdraw.isPending}
          >
            Keep them
          </Button>
        </div>
      ) : (
        <Button
          variant='outline'
          size='sm'
          className='shrink-0'
          onClick={() => setConfirming(true)}
        >
          <Undo2 className='size-4' />
          Withdraw changes
        </Button>
      )}
    </div>
  );
}
