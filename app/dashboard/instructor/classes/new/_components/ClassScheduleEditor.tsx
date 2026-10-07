'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { localDate, normalizeScheduleTimeZone, parseApiDate, toUtcIsoDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addSessionTemplateMutation,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  getClassScheduleInfiniteOptions,
  getClassScheduleQueryKey,
  getInstructorScheduleQueryKey,
  getScheduledInstanceQueryKey,
  rescheduleScheduledInstanceMutation,
  updateScheduledInstanceStatusMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ScheduledInstance } from '@/services/client/types.gen';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SessionDraft = { id: string; start: string; end: string; timezone: string };
export type ClassScheduleEditState = {
  saving: boolean;
  dirty: boolean;
  sessions: number;
  minutes: number;
  days: number;
};
const PAGE_SIZE = 50;

function editable(session: ScheduledInstance) {
  return (
    (parseApiDate(session.start_time)?.valueOf() ?? 0) > Date.now() &&
    !session.started_at && !session.concluded_at &&
    (!session.status || session.status === 'SCHEDULED')
  );
}

function sessionDraft(session: ScheduledInstance & { uuid: string }): SessionDraft {
  const timezone = normalizeScheduleTimeZone(session.timezone);
  return {
    id: session.uuid,
    start: parseApiDate(session.start_time)?.tz(timezone).format('YYYY-MM-DDTHH:mm') ?? '',
    end: parseApiDate(session.end_time)?.tz(timezone).format('YYYY-MM-DDTHH:mm') ?? '',
    timezone,
  };
}

function timeRange(draft: SessionDraft) {
  const instant = (value: string) => {
    const [date, time] = value.split('T');
    return new Date(toUtcIsoDateTime(date, time, draft.timezone));
  };
  const start = instant(draft.start);
  const end = instant(draft.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new Error('Each session needs an end time after its start time.');
  }
  return { start, end };
}

export function ClassScheduleEditor({
  classUuid,
  instructorUuid,
  timezone,
  assertCanEdit,
  onStateChange,
  disabled,
}: {
  classUuid: string;
  instructorUuid?: string;
  timezone: string;
  assertCanEdit: () => Promise<void>;
  onStateChange: (state: ClassScheduleEditState) => void;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, SessionDraft>>({});
  const [added, setAdded] = useState<SessionDraft[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState('');
  const scheduleQuery = useInfiniteQuery({
    ...getClassScheduleInfiniteOptions({
      path: { uuid: classUuid }, query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    enabled: Boolean(classUuid),
    staleTime: STALE_TIMES.live,
    initialPageParam: { path: { uuid: classUuid }, query: { pageable: { page: 0, size: PAGE_SIZE } } },
    getNextPageParam: (lastPage, pages) => {
      const metadata = lastPage.data?.metadata;
      if (metadata?.hasNext === false || metadata?.last === true) return undefined;
      return metadata?.hasNext || (metadata?.totalPages ?? 0) > pages.length
        ? { path: { uuid: classUuid }, query: { pageable: { page: pages.length, size: PAGE_SIZE } } }
        : undefined;
    },
  });
  useEffect(() => {
    if (scheduleQuery.hasNextPage && !scheduleQuery.isFetching && !scheduleQuery.isFetchNextPageError) {
      void scheduleQuery.fetchNextPage();
    }
  }, [scheduleQuery.hasNextPage, scheduleQuery.isFetching, scheduleQuery.isFetchNextPageError, scheduleQuery.fetchNextPage]);

  const sessions = useMemo(() => {
    const unique = new Map<string, ScheduledInstance & { uuid: string }>();
    for (const page of scheduleQuery.data?.pages ?? []) {
      for (const session of page.data?.content ?? []) {
        if (session.uuid && session.status !== 'CANCELLED') {
          unique.set(session.uuid, { ...session, uuid: session.uuid });
        }
      }
    }
    return [...unique.values()].sort((a, b) =>
      (parseApiDate(a.start_time)?.valueOf() ?? 0) - (parseApiDate(b.start_time)?.valueOf() ?? 0)
    );
  }, [scheduleQuery.data]);
  const rescheduleMutation = useMutation(rescheduleScheduledInstanceMutation());
  const addMutation = useMutation(addSessionTemplateMutation());
  const cancelMutation = useMutation(updateScheduledInstanceStatusMutation());

  const saveMutation = useMutation({
    mutationFn: async (pending: {
      drafts: Record<string, SessionDraft>;
      removed: string[];
      added: SessionDraft[];
    }) => {
      const { drafts, removed, added } = pending;
      await assertCanEdit();
      const remaining = sessions.filter(session => !removed.includes(session.uuid));
      if (remaining.length + added.length === 0) throw new Error('Keep at least one class session.');
      const ranges = [
        ...remaining.map(session => ({
          draft: drafts[session.uuid] ?? sessionDraft(session),
          changed: Boolean(drafts[session.uuid]),
        })),
        ...added.map(draft => ({ draft, changed: true })),
      ].map(({ draft, changed }) => ({ ...timeRange(draft), changed }));
      if (ranges.some(range => range.changed && range.start.getTime() <= Date.now())) {
        throw new Error('Choose a future start time for each changed session.');
      }
      const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
      if (sorted.some((range, index) => index > 0 && range.start < sorted[index - 1]!.end &&
        (range.changed || sorted[index - 1]!.changed))) {
        throw new Error('Class sessions cannot overlap. Choose different dates or times.');
      }
      const changes = Object.entries(drafts).filter(([uuid]) => !removed.includes(uuid));
      for (const uuid of [...removed, ...changes.map(([uuid]) => uuid)]) {
        const session = sessions.find(session => session.uuid === uuid);
        if (!session || !editable(session)) {
          throw new Error('Sessions that have already started cannot be changed. Reload the schedule.');
        }
      }
      // Commit each successful change locally so a partial failure can be retried safely.
      for (const uuid of removed) {
        const response = await cancelMutation.mutateAsync({
          path: { instanceUuid: uuid }, query: { status: 'CANCELLED' },
        });
        if (response.error || response.success === false) throw new Error(response.message || 'Unable to remove this session.');
        setRemoved(previous => previous.filter(id => id !== uuid));
        setDrafts(previous => {
          const next = { ...previous };
          delete next[uuid];
          return next;
        });
      }
      for (const [uuid, draft] of changes) {
        const range = timeRange(draft);
        if (range.start.getTime() <= Date.now()) throw new Error('Changed sessions must start in the future.');
        const response = await rescheduleMutation.mutateAsync({
          path: { instanceUuid: uuid },
          body: { start_time: range.start, end_time: range.end, timezone: draft.timezone },
        });
        if (response.error || response.success === false) throw new Error(response.message || 'Unable to reschedule this session.');
        setDrafts(previous => {
          const next = { ...previous };
          delete next[uuid];
          return next;
        });
      }
      for (const draft of added) {
        const range = timeRange(draft);
        if (range.start.getTime() <= Date.now()) throw new Error('New sessions must start in the future.');
        const response = await addMutation.mutateAsync({
          path: { uuid: classUuid },
          body: {
            start_time: range.start, end_time: range.end, timezone: draft.timezone,
            conflict_resolution: 'FAIL',
          },
        });
        if (response.error || response.success === false) throw new Error(response.message || 'Unable to add this session.');
        setAdded(previous => previous.filter(item => item.id !== draft.id));
      }
    },
    onSuccess: () => {
      setError('');
      toast.success('Class schedule updated');
    },
    onError: failure => {
      const message = failure instanceof Error ? failure.message : 'Unable to save the schedule. Check for conflicts and retry the remaining changes.';
      setError(message);
      toast.error(message);
    },
    onSettled: async (_data, _error, pending) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: getClassScheduleQueryKey({
          path: { uuid: classUuid }, query: { pageable: {} },
        }).map(({ query, ...key }) => key) }),
        queryClient.invalidateQueries({ queryKey: getClassDefinitionQueryKey({ path: { uuid: classUuid } }) }),
        ...[...new Set([...pending.removed, ...Object.keys(pending.drafts)])].map(uuid => queryClient.invalidateQueries({
          queryKey: getScheduledInstanceQueryKey({ path: { instanceUuid: uuid } }),
        })),
      ];
      if (instructorUuid) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid } }) }),
          queryClient.invalidateQueries({ queryKey: getInstructorScheduleQueryKey({
            path: { instructorUuid }, query: { start: localDate(new Date()), end: localDate(new Date()) },
          }).map(({ query, ...key }) => key) })
        );
      }
      await Promise.all(invalidations);
    },
  });

  const changeCount = Object.keys(drafts).filter(uuid => !removed.includes(uuid)).length + added.length + removed.length;
  const totals = useMemo(() => {
    const current = [
      ...sessions.filter(session => !removed.includes(session.uuid))
        .map(session => drafts[session.uuid] ?? sessionDraft(session)),
      ...added,
    ];
    let minutes = 0;
    for (const draft of current) {
      try {
        const range = timeRange(draft);
        minutes += (range.end.getTime() - range.start.getTime()) / 60_000;
      } catch { /* Incomplete changes contribute no duration until both dates are valid. */ }
    }
    return {
      sessions: current.length,
      minutes,
      days: new Set(current.map(draft => draft.start.split('T')[0]).filter(Boolean)).size,
    };
  }, [sessions, drafts, added, removed]);
  useEffect(() => {
    onStateChange({ saving: saveMutation.isPending, dirty: changeCount > 0, ...totals });
  }, [saveMutation.isPending, changeCount, totals, onStateChange]);

  if (scheduleQuery.isError || scheduleQuery.data?.pages.some(page => page.error || page.success === false)) {
    return <EmptyState title='Unable to load class sessions' action={
      <Button type='button' variant='outline' onClick={() => void scheduleQuery.refetch()}>Try again</Button>
    } />;
  }
  if (scheduleQuery.isPending || scheduleQuery.hasNextPage) return <Skeleton className='h-48 w-full' />;

  const updateDraft = (draft: SessionDraft, field: 'start' | 'end', value: string, isNew: boolean) => {
    const next = { ...draft, [field]: value };
    if (isNew) setAdded(previous => previous.map(item => item.id === draft.id ? next : item));
    else {
      const original = sessions.find(session => session.uuid === draft.id);
      const baseline = original && sessionDraft(original);
      setDrafts(previous => {
        const updated = { ...previous };
        if (baseline && baseline.start === next.start && baseline.end === next.end) delete updated[draft.id];
        else updated[draft.id] = next;
        return updated;
      });
    }
  };
  const rows = [
    ...sessions.map(session => ({ draft: drafts[session.uuid] ?? sessionDraft(session), isNew: false, locked: !editable(session) })),
    ...added.map(draft => ({ draft, isNew: true, locked: false })),
  ];
  const busy = disabled || saveMutation.isPending;

  return (
    <section className='space-y-4 rounded-lg border p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='flex items-center gap-2 text-sm font-semibold'><CalendarDays className='size-4 text-primary' />Scheduled sessions</h2>
          <p className='mt-1 text-xs text-muted-foreground'>Change dates and times, or add and remove future sessions before learners enroll.</p>
        </div>
        <Button type='button' variant='outline' size='sm' disabled={busy} onClick={() =>
          setAdded(previous => [...previous, { id: crypto.randomUUID(), start: '', end: '', timezone: normalizeScheduleTimeZone(timezone) }])
        }><Plus className='size-4' />Add session</Button>
      </div>
      {rows.length === 0 && <EmptyState variant='compact' title='No scheduled sessions' description='Add a session to set the class date and time.' />}
      {rows.map(({ draft, isNew, locked }, index) => {
        const isRemoved = removed.includes(draft.id);
        let minutes: number | undefined;
        try {
          const range = timeRange(draft);
          minutes = (range.end.getTime() - range.start.getTime()) / 60_000;
        } catch { /* Incomplete dates are validated before saving. */ }
        return (
          <Card key={draft.id} className='py-0'>
            <CardContent className='space-y-3 p-4'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-medium'>{isNew ? 'New session' : `Session ${index + 1}`}{isRemoved ? ' · Will be removed' : locked ? ' · Read-only' : ''}</p>
                <Button type='button' variant='ghost' size='sm' disabled={locked || busy} onClick={() => {
                  if (isNew) setAdded(previous => previous.filter(item => item.id !== draft.id));
                  else setRemoved(previous => isRemoved ? previous.filter(id => id !== draft.id) : [...previous, draft.id]);
                }} aria-label={isRemoved ? `Keep session ${index + 1}` : `Remove session ${index + 1}`}>
                  {isRemoved ? 'Undo removal' : <Trash2 className='size-4' />}
                </Button>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {(['start', 'end'] as const).map(field => (
                  <div key={field} className='space-y-1'>
                    <label htmlFor={`${draft.id}-${field}`} className='text-xs font-medium'>{field === 'start' ? 'Starts' : 'Ends'}</label>
                    <Input id={`${draft.id}-${field}`} type='datetime-local' step={60} value={draft[field]}
                      disabled={locked || isRemoved || busy}
                      onChange={event => updateDraft(draft, field, event.target.value, isNew)} />
                  </div>
                ))}
              </div>
              <p className='text-xs text-muted-foreground'>{draft.timezone}{minutes !== undefined ? ` · ${minutes} minutes` : ''}</p>
            </CardContent>
          </Card>
        );
      })}
      {error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-xs text-muted-foreground'>{changeCount} unsaved schedule change{changeCount === 1 ? '' : 's'}</p>
        <Button type='button' disabled={!changeCount || busy} onClick={() => saveMutation.mutate({ drafts, removed, added })}>
          {saveMutation.isPending && <Spinner />}{saveMutation.isPending ? 'Saving schedule…' : 'Save schedule changes'}
        </Button>
      </div>
    </section>
  );
}
