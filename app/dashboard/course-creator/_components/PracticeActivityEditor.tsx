'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import {
  createPracticeActivityMutation,
  deletePracticeActivityMutation,
  getPracticeActivitiesQueryKey,
  updatePracticeActivityMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  ActivityTypeEnum,
  type LessonPracticeActivity,
  SchemaEnum6 as PracticeActivityStatus,
} from '@/services/client/types.gen';

const draftSchema = z.object({
  uuid: z.string().optional(),
  title: z.string(),
  instructions: z.string(),
  points: z.number().finite().nonnegative(),
  savedTitle: z.string(),
  savedInstructions: z.string(),
});

type PracticeDraft = z.infer<typeof draftSchema>;

type PracticeActivityEditorProps = {
  id: string;
  index: number;
  courseUuid: string;
  lessonUuid: string;
  activity?: LessonPracticeActivity;
  kind?: 'quiz' | 'practical';
  onPersisted?: (uuid: string) => void;
  onRemove?: () => void;
};

function readDraft(
  key: string,
  kind: 'quiz' | 'practical',
  activity?: LessonPracticeActivity
): PracticeDraft {
  let cached: PracticeDraft | undefined;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(localStorage.getItem(key) ?? 'null'));
    if (parsed.success) cached = parsed.data;
  } catch {
    // Keep editing available when browser storage is unavailable.
  }
  const hasUnsavedChanges =
    cached &&
    (cached.title.trim() !== cached.savedTitle ||
      cached.instructions.trim() !== cached.savedInstructions);
  return {
    uuid: activity?.uuid ?? cached?.uuid,
    title:
      cached && hasUnsavedChanges
        ? cached.title
        : (activity?.title ??
          cached?.title ??
          (kind === 'quiz' ? 'Practice quiz' : 'Practical activity')),
    instructions:
      cached && hasUnsavedChanges
        ? cached.instructions
        : (activity?.instructions ?? cached?.instructions ?? ''),
    points: cached?.points ?? 10,
    savedTitle: activity?.title.trim() ?? cached?.savedTitle ?? '',
    savedInstructions: activity?.instructions?.trim() ?? cached?.savedInstructions ?? '',
  };
}

function storeDraft(prefix: string, id: string, draft: PracticeDraft) {
  try {
    const value = JSON.stringify(draft);
    localStorage.setItem(`${prefix}${id}`, value);
    if (draft.uuid) localStorage.setItem(`${prefix}${draft.uuid}`, value);
  } catch {
    // The API can still save title and instructions without browser storage.
  }
}

function savedUuid(response: unknown, fallback: string | undefined, kind: string): string {
  const envelope = asRecord(response);
  if (envelope?.error || envelope?.success === false) {
    throw new Error(getErrorMessage(response, `Unable to save ${kind}`));
  }
  const uuid = asRecord(envelope?.data)?.uuid ?? envelope?.uuid ?? fallback;
  if (typeof uuid !== 'string' || !uuid)
    throw new Error(`The ${kind} was not returned. Please try again.`);
  return uuid;
}

export function PracticeActivityEditor({
  id,
  index,
  courseUuid,
  lessonUuid,
  activity,
  kind = 'practical',
  onPersisted,
  onRemove,
}: PracticeActivityEditorProps) {
  const storagePrefix = `elimika:${kind}:${courseUuid}:${lessonUuid}:`;
  const [draft, setDraft] = useState(() => readDraft(`${storagePrefix}${id}`, kind, activity));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const lastAction = useRef<'save' | 'remove'>('save');
  const queryClient = useQueryClient();
  const create = useMutation(createPracticeActivityMutation());
  const update = useMutation(updatePracticeActivityMutation());
  const remove = useMutation(deletePracticeActivityMutation());
  const pending = busy || create.isPending || update.isPending || remove.isPending;
  const queryKey = getPracticeActivitiesQueryKey({
    path: { courseUuid, lessonUuid },
    query: { pageable: {} },
  });
  const dirty =
    !draft.uuid ||
    draft.title.trim() !== draft.savedTitle ||
    draft.instructions.trim() !== draft.savedInstructions;

  useEffect(() => {
    storeDraft(storagePrefix, id, draft);
  }, [draft, id, storagePrefix]);

  const patch = (value: Partial<PracticeDraft>) => {
    setDraft(current => ({ ...current, ...value }));
    setError('');
  };

  const save = async () => {
    if (inFlight.current || !dirty) return;
    if (!draft.title.trim() || !draft.instructions.trim()) {
      setError('Enter a title and instructions before saving.');
      return;
    }
    inFlight.current = true;
    lastAction.current = 'save';
    setBusy(true);
    setError('');
    const body: LessonPracticeActivity = {
      title: draft.title.trim(),
      instructions: draft.instructions.trim(),
      activity_type:
        activity?.activity_type ??
        (kind === 'quiz' ? ActivityTypeEnum.EXERCISE : ActivityTypeEnum.HANDS_ON),
      grouping: activity?.grouping,
      estimated_minutes: activity?.estimated_minutes,
      materials: activity?.materials,
      expected_output: activity?.expected_output,
      // Omitting display_order appends both kinds in API creation order, across pages.
      ...(activity?.display_order !== undefined ? { display_order: activity.display_order } : {}),
      status: activity?.status ?? PracticeActivityStatus.PUBLISHED,
      active: activity?.active ?? true,
    };
    try {
      const response = draft.uuid
        ? await update.mutateAsync({
            body,
            path: { courseUuid, lessonUuid, activityUuid: draft.uuid },
          })
        : await create.mutateAsync({ body, path: { courseUuid, lessonUuid } });
      const uuid = savedUuid(response, draft.uuid, kind);
      const savedDraft = {
        ...draft,
        uuid,
        savedTitle: body.title,
        savedInstructions: body.instructions,
      };
      storeDraft(storagePrefix, id, savedDraft);
      setDraft(savedDraft);
      await queryClient.invalidateQueries({
        queryKey,
      });
      onPersisted?.(uuid);
    } catch (cause) {
      setError(getErrorMessage(cause, `Unable to save ${kind}. Please try again.`));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    lastAction.current = 'remove';
    setBusy(true);
    setError('');
    try {
      if (draft.uuid) {
        const response = await remove.mutateAsync({
          path: { courseUuid, lessonUuid, activityUuid: draft.uuid },
        });
        const envelope = asRecord(response);
        if (envelope?.error || envelope?.success === false) {
          throw new Error(getErrorMessage(response, `Unable to remove ${kind}`));
        }
        await queryClient.invalidateQueries({
          queryKey,
        });
      }
      try {
        localStorage.removeItem(`${storagePrefix}${id}`);
        if (draft.uuid) localStorage.removeItem(`${storagePrefix}${draft.uuid}`);
      } catch {
        // Removing the activity remains available without browser storage.
      }
      onRemove?.();
    } catch (cause) {
      setError(getErrorMessage(cause, `Unable to remove ${kind}. Please try again.`));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Card className='gap-3 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <Badge variant='outline' className='shrink-0 capitalize'>
          {kind}
        </Badge>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          disabled={pending}
          aria-label={`Remove activity ${index + 1}`}
          onClick={() => void handleRemove()}
        >
          <Trash2 className='text-destructive h-4 w-4' />
        </Button>
      </div>
      <div className='space-y-2'>
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input
          id={`${id}-title`}
          value={draft.title}
          disabled={pending}
          aria-label={`Activity ${index + 1} title`}
          onChange={event => patch({ title: event.target.value })}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor={`${id}-instructions`}>Instructions</Label>
        <Textarea
          id={`${id}-instructions`}
          rows={3}
          value={draft.instructions}
          disabled={pending}
          aria-label={`Activity ${index + 1} instructions`}
          placeholder='What learners do, and how they get feedback.'
          onChange={event => patch({ instructions: event.target.value })}
        />
      </div>
      {pending ? (
        <p
          role='status'
          className='text-muted-foreground flex items-center gap-2 text-xs sm:col-span-3'
        >
          <Spinner />
          {lastAction.current === 'remove' ? 'Removing…' : 'Saving…'}
        </p>
      ) : error ? (
        <div
          role='alert'
          className='text-destructive flex flex-wrap items-center gap-2 text-xs sm:col-span-3'
        >
          <span>{error}</span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void (lastAction.current === 'remove' ? handleRemove() : save())}
          >
            Retry
          </Button>
        </div>
      ) : dirty ? (
        <p className='text-muted-foreground text-xs sm:col-span-3'>
          Save the title and instructions to publish this activity and make it visible.
        </p>
      ) : (
        <p role='status' className='text-muted-foreground text-xs sm:col-span-3'>
          Saved
        </p>
      )}
      <div className='flex justify-end'>
        <Button type='button' disabled={pending || !dirty} onClick={() => void save()}>
          {pending && lastAction.current === 'save' && <Spinner />}
          {kind === 'quiz' ? 'Save Quiz' : 'Save Practical Activity'}
        </Button>
      </div>
    </Card>
  );
}
