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
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';
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
    /** The line-item uuid for this task if it's already linked — needed to unlink */
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
                    ? 'cursor-not-allowed border-border/40 bg-muted/30 opacity-60'
                    : selected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm',
            ].join(' ')}
        >
            {/* Check circle */}
            <div
                className={[
                    'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                    alreadyLinked || selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-background group-hover:border-primary/50',
                ].join(' ')}
            >
                {(selected || alreadyLinked) && (
                    <CheckCircle2 size={12} className='text-primary-foreground' />
                )}
            </div>

            {/* Icon + badge */}
            <div className='flex items-center gap-2'>
                <span className={`inline-flex rounded-lg p-1.5 ${meta.color}`}>
                    <Icon size={14} />
                </span>
                {alreadyLinked && (
                    <span className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
                        Already linked
                    </span>
                )}
            </div>

            {/* Title */}
            <p className='text-foreground pr-6 text-sm font-semibold leading-snug'>{task.title}</p>

            {/* Footer row: score + optional unlink */}
            <div className='flex items-center justify-between gap-2'>
                {task.max_score != null && (
                    <span className='text-muted-foreground text-xs'>{task.max_score} pts</span>
                )}
                {alreadyLinked && lineItemUuid && onUnlink && (
                    <button
                        type='button'
                        onClick={e => {
                            e.stopPropagation(); // don't fire the card's disabled onClick
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

    // ── Live line-items from API ──────────────────────────────────────────────
    const { data: lineItemsData } = useQuery({
        ...getLineItemsOptions({ path: { courseUuid, assessmentUuid } }),
    });
    const lineItems: any[] = lineItemsData?.data?.content ?? lineItemsData?.data ?? [];

    // Map source-uuid (assignment_uuid / quiz_uuid / …) → line-item uuid
    // so we can (a) mark cards as already-linked and (b) pass the right uuid to delete
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

    // Prefer live API data; fall back to the prop on first render before query resolves
    const linkedUuids = useMemo(() => {
        if (lineItems.length > 0) return new Set(taskUuidToLineItemUuid.keys());
        return new Set(linkedItems.map(li => li.task_uuid));
    }, [lineItems, taskUuidToLineItemUuid, linkedItems]);

    const invalidateLineItems = () =>
        qc.invalidateQueries({
            queryKey: getLineItemsQueryKey({ path: { courseUuid, assessmentUuid } }),
        });

    // ── Course lessons → per-lesson assignments & quizzes ────────────────────
    const { data: cLessons } = useQuery({
        ...getCourseLessonsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    });
    const lessonUUIDs: string[] = cLessons?.data?.content?.map((l: any) => l.uuid) ?? [];

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
        !cLessons ||
        assignmentQueries.some(q => q.isLoading) ||
        quizQueries.some(q => q.isLoading);

    // ── Map raw API responses → TaskItem[] ───────────────────────────────────
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
            }));

        const quizzes: TaskItem[] = quizQueries
            .flatMap(q => q.data?.data?.content ?? [])
            .map((q: any) => ({
                uuid: q.uuid,
                title: q.title,
                description: q.description ?? undefined,
                item_type: 'quiz' as const,
                // quizzes have no dedicated max_score; use passing_score as a display hint
                max_score: q.passing_score ?? undefined,
                rubric_uuid: q.rubric_uuid ?? undefined,
            }));

        return [...assignments, ...quizzes];
    }, [assignmentQueries, quizQueries]);

    // ── Group & filter ────────────────────────────────────────────────────────
    const grouped = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = availableTasks.filter(t => {
            const matchesSearch = !q || t.title.toLowerCase().includes(q);
            const matchesFilter = activeFilter === 'all' || t.item_type === activeFilter;
            return matchesSearch && matchesFilter;
        });

        const map: Partial<Record<TaskItemType, TaskItem[]>> = {};
        for (const task of filtered) {
            if (!map[task.item_type]) map[task.item_type] = [];
            map[task.item_type]!.push(task);
        }
        return map;
    }, [availableTasks, search, activeFilter]);

    const categoriesPresent = CATEGORY_ORDER.filter(c => grouped[c]?.length);

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

    /** Unlink a single already-linked card */
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

    /** Link all selected tasks — fires one mutation per task, waits for all */
    async function handleConfirm() {
        if (selected.size === 0) return;
        setIsSaving(true);

        const tasks = availableTasks.filter(t => selected.has(t.uuid));

        const results = await Promise.allSettled(
            tasks.map((task, i) =>
                new Promise<void>((resolve, reject) => {
                    createLineItemMut.mutate(
                        {
                            path: { courseUuid, assessmentUuid },
                            body: buildLineItemBody(task, assessmentUuid, i) as any,
                        },
                        { onSuccess: () => resolve(), onError: (err) => reject(err) }
                    );
                })
            )
        );

        const failed = results.filter(r => r.status === 'rejected').length;
        const succeeded = results.length - failed;

        if (succeeded > 0)
            toast.success(`${succeeded} item${succeeded > 1 ? 's' : ''} linked successfully.`);
        if (failed > 0)
            toast.error(`${failed} item${failed > 1 ? 's' : ''} failed to link.`);

        invalidateLineItems();
        setIsSaving(false);
        setSelected(new Set());
        onSuccess?.();
        if (failed === 0) onClose();
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
                    <div className='flex items-start justify-between'>
                        <div>
                            <DialogTitle className='text-foreground text-lg font-bold'>
                                Link Items to Assessment
                            </DialogTitle>
                            <p className='text-muted-foreground mt-0.5 text-xs'>
                                Select tasks to attach as graded line items
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className='relative mt-4'>
                        <Search
                            size={14}
                            className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2'
                        />
                        <Input
                            placeholder='Search tasks…'
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className='pl-8 text-sm'
                        />
                    </div>

                    {/* Category filter pills */}
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

                {/* ── Scrollable content ── */}
                <div className='flex-1 overflow-y-auto px-6 py-5'>
                    {isLoadingTasks ? (
                        <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
                            <Loader2 size={22} className='text-muted-foreground animate-spin' />
                            <p className='text-muted-foreground text-sm'>Loading tasks…</p>
                        </div>
                    ) : categoriesPresent.length === 0 ? (
                        <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
                            <div className='bg-muted rounded-full p-4'>
                                <Search size={22} className='text-muted-foreground' />
                            </div>
                            <p className='text-foreground font-medium'>No tasks found</p>
                            <p className='text-muted-foreground text-sm'>
                                Try a different search or filter.
                            </p>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-8'>
                            {categoriesPresent.map(type => {
                                const meta = CATEGORY_META[type];
                                const Icon = meta.icon;
                                const tasks = grouped[type] ?? [];

                                return (
                                    <section key={type}>
                                        <div className='mb-3 flex items-center gap-2'>
                                            <span className={`inline-flex rounded-lg p-1.5 ${meta.color}`}>
                                                <Icon size={13} />
                                            </span>
                                            <h4 className='text-foreground text-sm font-semibold'>
                                                {meta.label}
                                            </h4>
                                            <span className='text-muted-foreground text-xs'>
                                                {tasks.length} item{tasks.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

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
                                <p className='text-muted-foreground text-xs'>
                                    Select items above to link them
                                </p>
                            )}
                        </div>

                        <div className='flex items-center gap-3'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={handleClose}
                                disabled={isSaving}
                            >
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
