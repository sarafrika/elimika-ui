'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  addCourseLessonMutation,
  deleteCourseLessonMutation,
  getCourseLessonQueryKey,
  getCourseLessonsQueryKey,
  updateCourseLessonMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Lesson } from '@/services/client/types.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { planLessonOrder } from './lesson-order';

type SavedLesson = Lesson & { uuid: string };
type LessonEntry = { key: string; lesson?: SavedLesson };
export type LessonHeaderRenderer = (props: {
  pageCount: number;
  addPage: () => void;
  pagesBusy: boolean;
  savePages: () => void;
}) => ReactNode;

export type LessonPagesRenderer = (
  lesson: SavedLesson | undefined,
  index: number,
  renderHeader: LessonHeaderRenderer,
  saveLesson: () => Promise<SavedLesson>
) => ReactNode;

function savedLesson(result: {
  error?: unknown;
  success?: boolean;
  message?: string;
  data?: Lesson;
}) {
  if (result.error || result.success === false)
    throw new Error(result.message || 'Unable to save lesson.');
  if (!result.data?.uuid) throw new Error('The saved lesson did not return an ID.');
  return { ...result.data, uuid: result.data.uuid };
}

export function LessonOutline({
  courseId,
  lessons,
  isLoading,
  renderPages,
}: {
  courseId: string;
  lessons: SavedLesson[];
  isLoading: boolean;
  renderPages: LessonPagesRenderer;
}) {
  const [entries, setEntries] = useState<LessonEntry[]>(() =>
    [...lessons]
      .sort((a, b) => a.lesson_number - b.lesson_number)
      .map(lesson => ({ key: lesson.uuid, lesson }))
  );
  const entriesRef = useRef(entries);
  const removedIds = useRef(new Set<string>());
  const [busy, setBusy] = useState<string | null>(null);
  const locked = useRef(false);
  const [orderFailed, setOrderFailed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LessonEntry | null>(null);
  const create = useMutation(addCourseLessonMutation());
  const update = useMutation(updateCourseLessonMutation());
  const remove = useMutation(deleteCourseLessonMutation());
  const qc = useQueryClient();

  const commit = (next: LessonEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  };
  useEffect(() => {
    if (locked.current) return;
    const known = new Set(entriesRef.current.map(entry => entry.lesson?.uuid));
    const added = [...lessons]
      .sort((a, b) => a.lesson_number - b.lesson_number)
      .filter(lesson => !known.has(lesson.uuid) && !removedIds.current.has(lesson.uuid))
      .map(lesson => ({ key: lesson.uuid, lesson }));
    if (added.length) {
      const next = [...entriesRef.current, ...added];
      entriesRef.current = next;
      setEntries(next);
    }
  }, [lessons]);

  const remember = (key: string, lesson: SavedLesson) => {
    commit(entriesRef.current.map(entry => (entry.key === key ? { ...entry, lesson } : entry)));
  };
  const refresh = async () => {
    await qc.invalidateQueries({
      queryKey: getCourseLessonsQueryKey({
        path: { courseUuid: courseId },
        query: { pageable: { page: 0, size: 100 } },
      }),
    });
  };
  const persistOrder = async () => {
    const saved = entriesRef.current.flatMap(entry => (entry.lesson ? [entry.lesson] : []));
    try {
      for (const change of planLessonOrder(saved)) {
        const entry = entriesRef.current.find(item => item.lesson?.uuid === change.uuid);
        if (!entry?.lesson) continue;
        const response = await update.mutateAsync({
          path: { courseUuid: courseId, lessonUuid: change.uuid },
          body: { ...entry.lesson, lesson_number: change.number },
        });
        remember(entry.key, savedLesson(response));
        void qc.invalidateQueries({
          queryKey: getCourseLessonQueryKey({
            path: { courseUuid: courseId, lessonUuid: change.uuid },
          }),
        });
      }
      setOrderFailed(false);
      return true;
    } catch {
      setOrderFailed(true);
      toast.error('Lesson order could not be saved. Use Retry order to finish saving it.');
      return false;
    }
  };
  const reposition = (key: string, index: number) => {
    const next = [...entriesRef.current];
    const from = next.findIndex(entry => entry.key === key);
    if (from < 0 || index < 0 || index >= next.length) return;
    const [entry] = next.splice(from, 1);
    if (!entry) return;
    next.splice(index, 0, entry);
    commit(next);
  };

  const save = async (key: string, title: string) => {
    if (locked.current) throw new Error('Wait for the current lesson to finish saving.');
    if (!title.trim()) throw new Error('Enter a lesson title.');
    const entry = entriesRef.current.find(item => item.key === key);
    if (!entry) throw new Error('This lesson is no longer available.');
    if (entry.lesson?.title === title.trim()) return entry.lesson;
    locked.current = true;
    setBusy(key);
    try {
      const body: Lesson = entry.lesson
        ? { ...entry.lesson, title: title.trim() }
        : {
          course_uuid: courseId,
          title: title.trim(),
          status: 'DRAFT',
          lesson_number:
            Math.max(0, ...entriesRef.current.map(item => item.lesson?.lesson_number ?? 0)) + 1,
        };
      const response = entry.lesson
        ? await update.mutateAsync({
          path: { courseUuid: courseId, lessonUuid: entry.lesson.uuid },
          body,
        })
        : await create.mutateAsync({ path: { courseUuid: courseId }, body });
      const saved = savedLesson(response);
      remember(key, saved);
      await persistOrder();
      await refresh();
      void qc.invalidateQueries({
        queryKey: getCourseLessonQueryKey({
          path: { courseUuid: courseId, lessonUuid: saved.uuid },
        }),
      });
      return saved;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };

  const move = async (key: string, direction: -1 | 1) => {
    if (locked.current) return;
    const from = entriesRef.current.findIndex(entry => entry.key === key);
    if (from < 0 || from + direction < 0 || from + direction >= entriesRef.current.length) return;
    locked.current = true;
    setBusy('order');
    reposition(key, from + direction);
    try {
      await persistOrder();
      await refresh();
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const deleteLesson = async () => {
    if (!deleteTarget || locked.current) return;
    locked.current = true;
    setBusy(deleteTarget.key);
    try {
      if (deleteTarget.lesson) {
        const response = await remove.mutateAsync({
          path: { courseUuid: courseId, lessonUuid: deleteTarget.lesson.uuid },
        });
        if (
          response &&
          typeof response === 'object' &&
          (('error' in response && response.error) ||
            ('success' in response && response.success === false))
        ) {
          throw new Error('Unable to delete lesson.');
        }
        removedIds.current.add(deleteTarget.lesson.uuid);
      }
      commit(entriesRef.current.filter(entry => entry.key !== deleteTarget.key));
      setDeleteTarget(null);
      await persistOrder();
      await refresh();
      toast.success('Lesson deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete lesson.');
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>Lessons</p>
          <p className='text-muted-foreground text-sm'>
            Build each lesson with pages of text and optional attachments.
          </p>
        </div>
        <LessonAction
          label='Add lesson'
          disabled={!!busy || isLoading}
          onClick={() => commit([...entriesRef.current, { key: crypto.randomUUID() }])}
        >
          <Plus className='size-4' />
        </LessonAction>
      </div>
      {isLoading && !entries.length ? (
        <Skeleton className='h-56 w-full rounded-md' />
      ) : !entries.length ? (
        <EmptyState
          title='No lessons yet'
          description='Add a lesson and enter its title to get started.'
        />
      ) : (
        entries.map((entry, index) => (
          <InlineLesson
            key={entry.key}
            entry={entry}
            index={index}
            total={entries.length}
            disabled={!!busy}
            saving={busy === entry.key && !deleteTarget}
            onSave={title => save(entry.key, title)}
            onMove={direction => void move(entry.key, direction)}
            onDelete={() => {
              if (entry.lesson) setDeleteTarget(entry);
              else commit(entriesRef.current.filter(item => item.key !== entry.key));
            }}
            renderPages={renderPages}
          />
        ))
      )}
      {orderFailed && (
        <div role='alert' className='text-destructive flex items-center gap-2 text-sm'>
          Lesson order has not been saved.
          <LessonAction
            label='Retry order'
            variant='outline'
            disabled={!!busy}
            onClick={async () => {
              if (locked.current) return;
              locked.current = true;
              setBusy('order');
              try {
                await persistOrder();
                await refresh();
              } finally {
                locked.current = false;
                setBusy(null);
              }
            }}
          >
            {busy === 'order' ? <Spinner /> : <RotateCcw className='size-4' />}
          </LessonAction>
        </div>
      )}
      <DeleteModal
        open={!!deleteTarget}
        setOpen={open => {
          if (!open && !busy) setDeleteTarget(null);
        }}
        title='Delete lesson?'
        description='This lesson and all of its pages will be deleted.'
        onConfirm={() => void deleteLesson()}
        isLoading={!!busy}
        confirmText='Delete lesson'
      />
    </div>
  );
}

function InlineLesson({
  entry,
  index,
  total,
  disabled,
  saving,
  onSave,
  onMove,
  onDelete,
  renderPages,
}: {
  entry: LessonEntry;
  index: number;
  total: number;
  disabled: boolean;
  saving: boolean;
  onSave: (title: string) => Promise<SavedLesson>;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  renderPages: LessonPagesRenderer;
}) {
  const [title, setTitle] = useState(entry.lesson?.title ?? '');
  const header: LessonHeaderRenderer = ({ pageCount, addPage, pagesBusy, savePages }) => (
    <div className='flex flex-wrap items-center gap-2'>
      <span
        className='bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold'
        aria-label={`Lesson ${index + 1}`}
      >
        {index + 1}
      </span>
      <Input
        value={title}
        disabled={disabled || pagesBusy}
        onChange={event => setTitle(event.target.value)}
        className='min-w-40 flex-1'
        placeholder='Lesson title'
        aria-label={`Lesson ${index + 1} title`}
      />
      <span className='text-muted-foreground text-xs'>
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </span>
      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-label={`Add page to lesson ${index + 1}`}
        disabled={disabled || pagesBusy}
        onClick={addPage}
      >
        <Plus className='size-4' /> Add page
      </Button>
      <Button
        type='button'
        size='sm'
        aria-label={`Save lesson ${index + 1} and pages`}
        disabled={disabled || pagesBusy}
        onClick={savePages}
      >
        {saving || pagesBusy ? <Spinner /> : <Save className='size-4' />}
        {saving || pagesBusy ? 'Saving…' : 'Save lesson and pages'}
      </Button>
      <LessonAction
        label={`Delete lesson ${index + 1}`}
        variant='ghost'
        disabled={disabled || pagesBusy}
        onClick={onDelete}
      >
        <Trash2 className='text-destructive size-4' />
      </LessonAction>
      <LessonAction
        label={`Move lesson ${index + 1} up`}
        variant='ghost'
        disabled={disabled || pagesBusy || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className='size-4' />
      </LessonAction>
      <LessonAction
        label={`Move lesson ${index + 1} down`}
        variant='ghost'
        disabled={disabled || pagesBusy || index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown className='size-4' />
      </LessonAction>
    </div>
  );
  return renderPages(entry.lesson, index, header, () => onSave(title));
}

function LessonAction({ label, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type='button' size='icon' aria-label={label} {...props} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
