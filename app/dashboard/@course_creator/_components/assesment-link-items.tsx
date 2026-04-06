'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Layers,
  Loader2,
  MessageSquare,
  Mic2,
  Search,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import {
  createLineItemMutation,
  deleteLineItemMutation,
  getCourseLessonsOptions,
  getLineItemsOptions,
  getLineItemsQueryKey,
  searchAssignmentsOptions,
  searchQuizzesOptions,
  updateLineItemMutation,
} from '../../../../services/client/@tanstack/react-query.gen';

export type TaskItemType =
  | 'assignment'
  | 'quiz'
  | 'project'
  | 'attendance'
  | 'discussion'
  | 'lab'
  | 'presentation'
  | 'reflection';

export type TaskItem = {
  uuid: string;
  title: string;
  description?: string;
  item_type: TaskItemType;
  max_score?: number;
  rubric_uuid?: string;
  display_order?: number;
  /** lesson this task belongs to — used for sub-grouping */
  lesson_uuid: string;
};

export type LinkedLineItem = {
  uuid: string;
  task_uuid: string;
  title: string;
  item_type: TaskItemType;
};

export type LinkItemsModalProps = {
  open: boolean;
  onClose: () => void;
  courseUuid: string;
  assessmentUuid: string;
  linkedItems: LinkedLineItem[];
  onSuccess?: () => void;
};

type CategoryMeta = {
  label: string;
  icon: React.ElementType;
  color: string;
};

export const CATEGORY_META: Record<TaskItemType, CategoryMeta> = {
  attendance: {
    label: 'Attendance',
    icon: Users,
    color: 'bg-secondary text-secondary-foreground',
  },
  assignment: {
    label: 'Assignments',
    icon: ClipboardList,
    color: 'bg-primary/10 text-primary',
  },
  quiz: {
    label: 'Quizzes',
    icon: BookOpen,
    color: 'bg-warning/10 text-warning',
  },
  project: {
    label: 'Projects',
    icon: Layers,
    color: 'bg-success/10 text-success',
  },
  discussion: {
    label: 'Discussions',
    icon: MessageSquare,
    color: 'bg-destructive/10 text-destructive',
  },
  lab: {
    label: 'Lab Exercises',
    icon: FlaskConical,
    color: 'bg-secondary/80 text-secondary-foreground',
  },
  presentation: {
    label: 'Presentations',
    icon: Mic2,
    color: 'bg-accent text-accent-foreground',
  },
  reflection: {
    label: 'Reflections',
    icon: ChevronRight,
    color: 'bg-muted text-muted-foreground',
  },
};

const CATEGORY_ORDER: TaskItemType[] = [
  'attendance',
  'assignment',
  'quiz',
  'project',
  'discussion',
  'lab',
  'presentation',
  'reflection',
];

function buildLineItemBody(task: TaskItem, assessmentUuid: string, index: number) {
  return {
    title: task.title,
    description: task.description ?? '',
    item_type: task.item_type,
    ...(task.item_type === 'assignment' && { assignment_uuid: task.uuid }),
    ...(task.item_type === 'quiz' && { quiz_uuid: task.uuid }),
    ...(task.item_type === 'project' && { project_uuid: task.uuid }),
    ...(task.item_type === 'attendance' && { attendance_uuid: task.uuid }),
    ...(task.item_type === 'discussion' && { discussion_uuid: task.uuid }),
    ...(task.item_type === 'lab' && { lab_uuid: task.uuid }),
    ...(task.item_type === 'presentation' && { presentation_uuid: task.uuid }),
    ...(task.item_type === 'reflection' && { reflection_uuid: task.uuid }),
    rubric_uuid: task.rubric_uuid ?? undefined,
    max_score: task.max_score ?? 100,
    display_order: index + 1,
    active: true,
  };
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  selected,
  alreadyLinked,
  lineItemUuid,
  onToggle,
  onUnlink,
}: {
  task: TaskItem;
  selected: boolean;
  alreadyLinked: boolean;
  lineItemUuid?: string;
  onToggle: () => void;
  onUnlink?: (lineItemUuid: string) => void;
}) {
  const meta = CATEGORY_META[task.item_type];
  const Icon = meta.icon;

  return (
    <button
      type='button'
      disabled={alreadyLinked}
      onClick={onToggle}
      className={[
        'group relative flex w-full flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-150',
        alreadyLinked
          ? 'border-border/40 bg-muted/30 cursor-not-allowed opacity-60'
          : selected
            ? 'border-primary bg-primary/5 ring-primary/30 shadow-sm ring-1'
            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Check circle */}
      <div
        className={[
          'absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
          alreadyLinked || selected
            ? 'border-primary bg-primary'
            : 'border-border bg-background group-hover:border-primary/50',
        ].join(' ')}
      >
        {(selected || alreadyLinked) && (
          <CheckCircle2 size={12} className='text-primary-foreground' />
        )}
      </div>

      {/* Icon + type chip */}
      <div className='flex items-center gap-2'>
        <span className={`inline-flex rounded-lg p-1.5 ${meta.color}`}>
          <Icon size={14} />
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
          {meta.label}
        </span>
        {alreadyLinked && (
          <span className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
            · Linked
          </span>
        )}
      </div>

      {/* Title */}
      <p className='text-foreground pr-6 text-sm leading-snug font-semibold'>{task.title}</p>

      {/* Footer: score + unlink */}
      <div className='flex items-center justify-between gap-2'>
        {task.max_score != null && (
          <span className='text-muted-foreground text-xs'>{task.max_score} pts</span>
        )}
        {alreadyLinked && lineItemUuid && onUnlink && (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onUnlink(lineItemUuid);
            }}
            className='text-destructive hover:bg-destructive/10 z-10 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors'
          >
            Unlink
          </button>
        )}
      </div>
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function LinkItemsModal({
  open,
  onClose,
  courseUuid,
  assessmentUuid,
  linkedItems,
  onSuccess,
}: LinkItemsModalProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<TaskItemType | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // ── Live line-items ───────────────────────────────────────────────────────
  const { data: lineItemsData } = useQuery({
    ...getLineItemsOptions({ path: { courseUuid, assessmentUuid } }),
  });
  const lineItems: any[] =
    lineItemsData?.data?.content ?? (Array.isArray(lineItemsData?.data) ? lineItemsData.data : []);

  const taskUuidToLineItemUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const li of lineItems) {
      const sourceUuid =
        li.assignment_uuid ??
        li.quiz_uuid ??
        li.project_uuid ??
        li.attendance_uuid ??
        li.discussion_uuid ??
        li.lab_uuid ??
        li.presentation_uuid ??
        li.reflection_uuid ??
        null;
      if (sourceUuid) map.set(sourceUuid, li.uuid);
    }
    return map;
  }, [lineItems]);

  const linkedUuids = useMemo(() => {
    if (lineItems.length > 0) return new Set(taskUuidToLineItemUuid.keys());
    return new Set(linkedItems.map(li => li.task_uuid));
  }, [lineItems, taskUuidToLineItemUuid, linkedItems]);

  const invalidateLineItems = () =>
    qc.invalidateQueries({
      queryKey: getLineItemsQueryKey({ path: { courseUuid, assessmentUuid } }),
    });

  // ── Lessons + per-lesson tasks ────────────────────────────────────────────
  const { data: cLessons } = useQuery({
    ...getCourseLessonsOptions({ path: { courseUuid }, query: { pageable: {} } }),
  });

  // Sorted lessons so numbering is stable
  const lessons: any[] = useMemo(
    () =>
      [...(cLessons?.data?.content ?? [])].sort(
        (a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0)
      ),
    [cLessons]
  );
  const lessonUUIDs = lessons.map(l => l.uuid);

  // Build a lookup: uuid → lesson object (for labels)
  const lessonMap = useMemo(() => {
    const m = new Map<string, any>();
    lessons.forEach(l => m.set(l.uuid, l));
    return m;
  }, [lessons]);

  const assignmentQueries = useQueries({
    queries: lessonUUIDs.map(uuid => ({
      ...searchAssignmentsOptions({
        query: { pageable: {}, searchParams: { lesson_uuid_eq: uuid } },
      }),
      enabled: !!uuid,
    })),
  });

  const quizQueries = useQueries({
    queries: lessonUUIDs.map(uuid => ({
      ...searchQuizzesOptions({
        query: { pageable: {}, searchParams: { lesson_uuid_eq: uuid } },
      }),
      enabled: !!uuid,
    })),
  });

  const isLoadingTasks =
    !cLessons || assignmentQueries.some(q => q.isLoading) || quizQueries.some(q => q.isLoading);

  // ── Map API → TaskItem[] (preserving lesson_uuid) ─────────────────────────
  const availableTasks: TaskItem[] = useMemo(() => {
    const assignments: TaskItem[] = assignmentQueries
      .flatMap(q => q.data?.data?.content ?? [])
      .map((a: any) => ({
        uuid: a.uuid,
        title: a.title,
        description: a.description ?? undefined,
        item_type: 'assignment' as const,
        max_score: a.max_points ?? undefined,
        rubric_uuid: a.rubric_uuid ?? undefined,
        lesson_uuid: a.lesson_uuid,
      }));

    const quizzes: TaskItem[] = quizQueries
      .flatMap(q => q.data?.data?.content ?? [])
      .map((q: any) => ({
        uuid: q.uuid,
        title: q.title,
        description: q.description ?? undefined,
        item_type: 'quiz' as const,
        max_score: q.passing_score ?? undefined,
        rubric_uuid: q.rubric_uuid ?? undefined,
        lesson_uuid: q.lesson_uuid,
      }));

    return [...assignments, ...quizzes];
  }, [assignmentQueries, quizQueries]);

  // ── Grouped: type → lesson → tasks ───────────────────────────────────────
  // Structure: { assignment: { lessonUuid: TaskItem[] }, quiz: { ... }, ... }
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = availableTasks.filter(t => {
      const matchesSearch = !q || t.title.toLowerCase().includes(q);
      const matchesFilter = activeFilter === 'all' || t.item_type === activeFilter;
      return matchesSearch && matchesFilter;
    });

    const byType: Partial<Record<TaskItemType, Map<string, TaskItem[]>>> = {};

    for (const task of filtered) {
      if (!byType[task.item_type]) byType[task.item_type] = new Map();
      const byLesson = byType[task.item_type]!;
      if (!byLesson.has(task.lesson_uuid)) byLesson.set(task.lesson_uuid, []);
      byLesson.get(task.lesson_uuid)!.push(task);
    }

    return byType;
  }, [availableTasks, search, activeFilter]);

  // Only show type sections that have at least one task after filtering
  const typesPresent = CATEGORY_ORDER.filter(c => grouped[c]?.size);

  function toggle(uuid: string) {
    if (linkedUuids.has(uuid)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createLineItemMut = useMutation(createLineItemMutation());
  const deleteLineItemMut = useMutation(deleteLineItemMutation());
  const updateLineItemMut = useMutation(updateLineItemMutation());

  function handleUnlink(lineItemUuid: string) {
    deleteLineItemMut.mutate(
      { path: { courseUuid, assessmentUuid, lineItemUuid } },
      {
        onSuccess: () => {
          toast.success('Item unlinked.');
          invalidateLineItems();
          onSuccess?.();
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to unlink item.'),
      }
    );
  }

  async function handleConfirm() {
    if (selected.size === 0) return;

    setIsSaving(true);

    const tasks = availableTasks.filter(t => selected.has(t.uuid));

    try {
      const results = await Promise.allSettled(
        tasks.map((task, i) =>
          createLineItemMut.mutateAsync({
            path: { courseUuid, assessmentUuid },
            body: buildLineItemBody(task, assessmentUuid, i) as any,
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = results.length - failed;

      if (succeeded > 0) {
        toast.success(`${succeeded} item${succeeded > 1 ? 's' : ''} linked successfully.`);
      }

      if (failed > 0) {
        toast.error(`${failed} item${failed > 1 ? 's' : ''} failed to link.`);
      }

      invalidateLineItems();

      setSelected(new Set());

      if (failed === 0) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error('Something went wrong while linking items.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) return;
    setSelected(new Set());
    setSearch('');
    setActiveFilter('all');
    onClose();
  }

  const selectedCount = selected.size;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className='flex h-[90vh] max-h-[720px] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'>
        {/* ── Header ── */}
        <DialogHeader className='shrink-0 border-b px-6 py-5'>
          <div>
            <DialogTitle className='text-foreground text-lg font-bold'>
              Link Items to Assessment
            </DialogTitle>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              Select tasks to attach as graded line items
            </p>
          </div>

          {/* Search */}
          <div className='relative mt-4'>
            <Search
              size={14}
              className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'
            />
            <Input
              placeholder='Search tasks…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='pl-8 text-sm'
            />
          </div>

          {/* Type filter pills — only show types with real data */}
          <div className='mt-3 flex flex-wrap gap-1.5'>
            <button
              onClick={() => setActiveFilter('all')}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeFilter === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              All
            </button>
            {CATEGORY_ORDER.map(type => {
              const meta = CATEGORY_META[type];
              const Icon = meta.icon;
              const count = availableTasks.filter(t => t.item_type === type).length;
              if (!count) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeFilter === type
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  ].join(' ')}
                >
                  <Icon size={11} />
                  {meta.label}
                  <span className='opacity-60'>{count}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          {isLoadingTasks ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <Loader2 size={22} className='text-muted-foreground animate-spin' />
              <p className='text-muted-foreground text-sm'>Loading tasks…</p>
            </div>
          ) : typesPresent.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <div className='bg-muted rounded-full p-4'>
                <Search size={22} className='text-muted-foreground' />
              </div>
              <p className='text-foreground font-medium'>No tasks found</p>
              <p className='text-muted-foreground text-sm'>Try a different search or filter.</p>
            </div>
          ) : (
            <div className='flex flex-col gap-8'>
              {typesPresent.map(type => {
                const typeMeta = CATEGORY_META[type];
                const TypeIcon = typeMeta.icon;
                const byLesson = grouped[type]!;

                // Preserve lesson sort order from the API
                const lessonIdsForType = lessonUUIDs.filter(id => byLesson.has(id));
                const totalForType = [...byLesson.values()].reduce((s, arr) => s + arr.length, 0);

                return (
                  <section key={type}>
                    {/* ── Type heading ── */}
                    <div className='mb-4 flex items-center gap-2'>
                      <span className={`inline-flex rounded-lg p-1.5 ${typeMeta.color}`}>
                        <TypeIcon size={13} />
                      </span>
                      <h4 className='text-foreground text-sm font-bold'>{typeMeta.label}</h4>
                      <span className='text-muted-foreground text-xs'>
                        {totalForType} item{totalForType !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* ── Lesson sub-groups ── */}
                    <div className='flex flex-col gap-5'>
                      {lessonIdsForType.map(lessonId => {
                        const lesson = lessonMap.get(lessonId);
                        const tasks = byLesson.get(lessonId) ?? [];
                        const lessonLabel = lesson
                          ? `Lesson ${lesson.lesson_number ?? ''}${lesson.title ? ` — ${lesson.title}` : ''}`
                          : 'Unknown Lesson';

                        return (
                          <div key={lessonId}>
                            {/* Lesson label row */}
                            <div className='mb-2 flex items-center gap-2'>
                              <div className='bg-border h-px flex-1' />
                              <span className='text-muted-foreground shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium'>
                                {lessonLabel}
                                <span className='ml-1.5 opacity-60'>
                                  · {tasks.length} item{tasks.length !== 1 ? 's' : ''}
                                </span>
                              </span>
                              <div className='bg-border h-px flex-1' />
                            </div>

                            {/* Task cards */}
                            <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
                              {tasks.map(task => (
                                <TaskCard
                                  key={task.uuid}
                                  task={task}
                                  selected={selected.has(task.uuid)}
                                  alreadyLinked={linkedUuids.has(task.uuid)}
                                  lineItemUuid={taskUuidToLineItemUuid.get(task.uuid)}
                                  onToggle={() => toggle(task.uuid)}
                                  onUnlink={handleUnlink}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className='shrink-0 border-t px-6 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              {selectedCount > 0 ? (
                <>
                  <Badge variant='secondary' className='gap-1 text-xs'>
                    <CheckCircle2 size={11} />
                    {selectedCount} selected
                  </Badge>
                  <button
                    onClick={() => setSelected(new Set())}
                    className='text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 transition-colors'
                  >
                    Clear
                  </button>
                </>
              ) : (
                <p className='text-muted-foreground text-xs'>Select items above to link them</p>
              )}
            </div>

            <div className='flex items-center gap-3'>
              <Button variant='outline' size='sm' onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                size='sm'
                onClick={handleConfirm}
                disabled={selectedCount === 0 || isSaving}
                className='min-w-[120px]'
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className='mr-2 animate-spin' />
                    Linking…
                  </>
                ) : (
                  `Link ${selectedCount > 0 ? selectedCount : ''} Item${selectedCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
