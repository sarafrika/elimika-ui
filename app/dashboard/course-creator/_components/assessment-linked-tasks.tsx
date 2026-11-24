'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  deleteLineItemMutation,
  getCourseEvaluationPlanQueryKey,
  getLineItemsOptions,
  getLineItemsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { GetLineItemsResponse } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function AssessmentLinkedTasks({
  courseUuid,
  assessmentUuid,
  assessmentTitle,
  disabled,
  onManage,
}: {
  courseUuid: string;
  assessmentUuid: string;
  assessmentTitle: string;
  disabled?: boolean;
  onManage: () => void;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removing = useRef(false);
  const client = useQueryClient();
  const unlink = useMutation(deleteLineItemMutation());
  const query = useQuery({
    ...getLineItemsOptions({ path: { courseUuid, assessmentUuid } }),
    enabled: Boolean(courseUuid && assessmentUuid),
    staleTime: STALE_TIMES.entity,
  });
  const failed =
    query.isError ||
    Boolean(query.data?.error) ||
    query.data?.success === false ||
    (query.isSuccess && !Array.isArray(query.data?.data));
  const items = failed || !Array.isArray(query.data?.data) ? [] : query.data.data;

  async function unlinkTask(lineItemUuid: string) {
    if (disabled || removing.current || !courseUuid || !assessmentUuid) return;
    removing.current = true;
    setRemovingId(lineItemUuid);
    try {
      const result = await unlink.mutateAsync({
        path: { courseUuid, assessmentUuid, lineItemUuid },
      });
      if (
        result &&
        typeof result === 'object' &&
        (('error' in result && result.error) || ('success' in result && result.success === false))
      ) {
        throw new Error(getErrorMessage(result, 'Unable to unlink task.'));
      }
      client.setQueryData<GetLineItemsResponse>(
        getLineItemsQueryKey({ path: { courseUuid, assessmentUuid } }),
        current =>
          current?.data && Array.isArray(current.data)
            ? { ...current, data: current.data.filter(item => item.uuid !== lineItemUuid) }
            : current
      );
      toast.success('Task unlinked.');
      await Promise.all([
        client.invalidateQueries({
          queryKey: getLineItemsQueryKey({ path: { courseUuid, assessmentUuid } }),
        }),
        client.invalidateQueries({
          queryKey: getCourseEvaluationPlanQueryKey({ path: { courseUuid } }),
        }),
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to unlink task.'));
    } finally {
      removing.current = false;
      setRemovingId(null);
    }
  }

  return (
    <div className='min-w-56 space-y-2'>
      <div>
        {query.isPending ? (
          <div className='space-y-2' role='status' aria-label='Loading linked tasks'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-6 w-32' />
          </div>
        ) : failed ? (
          <div role='alert'>
            <EmptyState
              variant='compact'
              className='p-3'
              title='Unable to load linked tasks'
              action={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => void query.refetch()}
                >
                  Retry
                </Button>
              }
            />
          </div>
        ) : items.length > 0 ? (
          <ul
            className='flex max-h-56 flex-wrap gap-1.5 overflow-y-auto'
            aria-label={`Linked tasks for ${assessmentTitle}`}
          >
            {items.map((item, index) => (
              <li key={item.uuid ?? index} className='max-w-full'>
                <Badge
                  variant='secondary'
                  className='max-w-full gap-1 rounded-full py-0.5 pr-2.5 pl-1'
                >
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='hover:bg-destructive/10 hover:text-destructive size-5 shrink-0 rounded-full'
                    disabled={disabled || removingId !== null || !item.uuid}
                    aria-label={`Unlink ${item.title}`}
                    title={`Unlink ${item.title}`}
                    onClick={() => item.uuid && void unlinkTask(item.uuid)}
                  >
                    {removingId === item.uuid ? (
                      <Spinner className='size-3' />
                    ) : (
                      <X className='size-3' />
                    )}
                  </Button>
                  <span
                    className='max-w-52 truncate'
                    title={`${item.item_type_display || item.item_type.replaceAll('_', ' ')}: ${item.title}`}
                  >
                    {item.title}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='h-auto rounded-full border-dashed px-2.5 py-1 text-xs'
        disabled={disabled || removingId !== null}
        onClick={onManage}
      >
        <Plus className='size-3' /> Link items
      </Button>
    </div>
  );
}
