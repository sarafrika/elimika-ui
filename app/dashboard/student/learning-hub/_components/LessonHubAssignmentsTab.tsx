'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useStudent } from '@/context/student-context';
import { cn } from '@/lib/utils';
import {
    getAssignmentSubmissionsQueryKey,
    submitAssignmentQueryMutation,
    uploadSubmissionAttachmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmission } from '@/services/client/types.gen';
import {
    getDueSummary,
    getStudentAssignmentSubmissionState,
    useStudentAssignmentData,
    type StudentAssignmentFilterTab,
    type StudentAssignmentRow,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    GraduationCap,
    Layers,
    Paperclip,
    SearchX,
    Send,
    Upload
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AttachmentResourceList } from '../../../../../components/assessment/AttachmentResourceList';
import { Card, CardContent } from '../../../../../components/ui/card';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { toAttachmentResourceItems } from '../../_components/student-assignment-workspace';

type SortKey = 'due' | 'course' | 'title';

type AssignmentViewRow = {
    row: StudentAssignmentRow;
    state: ReturnType<typeof getStudentAssignmentSubmissionState>;
    due: ReturnType<typeof getDueSummary>;
};

function formatDate(value?: string | Date | null) {
    if (!value) return 'No deadline';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getGradeTone(percentage?: number | null) {
    if (percentage == null) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
}

function StatTile({
    icon: Icon,
    label,
    value,
    helper,
    tone = 'primary',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    helper: string;
    tone?: 'primary' | 'success' | 'warning';
}) {
    const chip =
        tone === 'success'
            ? 'bg-success/10 text-success'
            : tone === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/10 text-primary';

    return (
        <div className='border-border/70 bg-card hover:border-primary/30 rounded-sm border p-5 shadow-sm transition-all duration-200 hover:shadow-md'>
            <div className='flex items-center gap-4'>
                <div className={cn('sm', chip)}>
                    <Icon className='h-5 w-5' />
                </div>
                <div className='min-w-0'>
                    <p className='text-muted-foreground text-sm'>{label}</p>
                    <p className='text-foreground text-2xl font-bold tracking-tight'>{value}</p>
                    <p className='text-muted-foreground truncate text-xs'>{helper}</p>
                </div>
            </div>
        </div>
    );
}

function AssignmentDetailSheet({
    payload,
    onClose,
}: {
    payload: AssignmentViewRow | null;
    onClose: () => void;
}) {
    const student = useStudent();
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
    const [loaded, setLoaded] = useState(false);

    const row = payload?.row;
    const assignment = row?.assignment;
    const schedule = row?.schedule;
    const submission = row?.latestSubmission as AssignmentSubmission | null | undefined;
    const activeEnrollmentUuid = row?.classMeta.courseEnrollmentUuid ?? row?.classMeta.enrollmentUuid;
    const submissionState = row ? getStudentAssignmentSubmissionState(row) : null;
    const canEdit = submissionState?.key !== 'graded' && submissionState?.key !== 'submitted';

    useEffect(() => {
        if (payload && !loaded) {
            setContent(submission?.submission_text ?? '');
            setQueuedFiles([]);
            setLoaded(true);
        }
    }, [loaded, payload, submission?.submission_text]);

    const handleClose = () => {
        setLoaded(false);
        setContent('');
        setQueuedFiles([]);
        onClose();
    };


    const submitAssignmentMut = useMutation(submitAssignmentQueryMutation());
    const uploadSubmissionAttachmentMut = useMutation(uploadSubmissionAttachmentMutation());
    const isSubmitting = submitAssignmentMut.isPending || uploadSubmissionAttachmentMut.isPending;

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const incoming = Array.from(files);
        setQueuedFiles(prev => {
            const existing = new Set(prev.map(file => `${file.name}-${file.size}`));
            return [...prev, ...incoming.filter(file => !existing.has(`${file.name}-${file.size}`))];
        });
    };

    const removeFile = (fileToRemove: File) => {
        setQueuedFiles(prev =>
            prev.filter(file => `${file.name}-${file.size}` !== `${fileToRemove.name}-${fileToRemove.size}`)
        );
    };

    const handleSubmitAssignment = async () => {
        if (!assignment?.uuid) {
            toast.error('This assignment is missing an assignment record.');
            return;
        }
        if (!activeEnrollmentUuid) {
            toast.error('This assignment is missing an active enrollment.');
            return;
        }

        const submissionText = content.trim();
        if (!submissionText && queuedFiles.length === 0) {
            toast.error('Add a written response or attach at least one file.');
            return;
        }

        try {
            // @ts-ignore
            const response = await submitAssignmentMut.mutateAsync({
                path: { assignmentUuid: assignment?.uuid },
                body: {
                    enrollment_uuid: activeEnrollmentUuid,
                    student_uuid: row?.classMeta.studentUuid ?? student?.uuid,
                    submission_text: submissionText,
                    file_urls: ['/assignment.pdf'],
                },
            });

            const submissionUuid = response.data?.uuid;
            if (!submissionUuid) {
                throw new Error('Submission completed without returning an identifier.');
            }

            await Promise.all(
                queuedFiles.map(file =>
                    uploadSubmissionAttachmentMut.mutateAsync({
                        path: {
                            assignmentUuid: assignment.uuid as string,
                            submissionUuid,
                        },
                        body: { file },
                    })
                )
            );

            await queryClient.invalidateQueries({
                queryKey: getAssignmentSubmissionsQueryKey({ path: { assignmentUuid: assignment.uuid } }),
            });
            await queryClient.invalidateQueries({ queryKey: ['student-assignments'] });

            toast.success('Assignment submitted successfully.');
            handleClose();
        } catch (error) {
            toast.error(error?.message);
        }
    };

    const isGraded = submissionState?.key === 'graded';
    const gradeSummary = submission?.grade_display || `${submission?.score ?? 0}/${assignment?.max_points ?? 0}`;

    return (
        <Sheet open={Boolean(payload)} onOpenChange={open => !open && handleClose()}>
            <SheetContent className='overflow-y-auto sm:max-w-xl'>
                <SheetHeader>
                    <SheetTitle>{assignment?.title || 'Untitled assignment'}</SheetTitle>
                    <SheetDescription>
                        {schedule?.due_at ? `Due ${formatDate(schedule?.due_at)} · ` : ''}
                        Max {assignment?.points_display || assignment?.max_points || '—'} pts
                    </SheetDescription>
                </SheetHeader>

                <div className='space-y-4 px-4 pb-4'>
                    <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline' className='text-[10px]'>
                            {row?.classMeta.courseTitle}
                        </Badge>
                        {submissionState && <Badge variant={submissionState.variant}>{submissionState.label}</Badge>}
                    </div>

                    <AttachmentResourceList
                        attachments={toAttachmentResourceItems(
                            payload?.row?.attachments as unknown[]
                        )}
                        emptyMessage='No files were uploaded with the latest submission.'
                        previewLabel='Read file'
                    />

                    {assignment?.description && (
                        <div className="rounded-sm border bg-muted/30 p-3 text-sm leading-relaxed">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Description
                            </p>

                            <div className="[&_p]:leading-relaxed">
                                <RichTextRenderer
                                    htmlString={assignment.description}
                                    maxChars={320}
                                />
                            </div>
                        </div>
                    )}

                    {assignment?.instructions && (
                        <div className="rounded-sm border bg-muted/30 p-3 text-sm leading-relaxed">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                                Instructions
                            </p>

                            <p className="whitespace-pre-wrap leading-relaxed">
                                {stripHtml(assignment.instructions)}
                            </p>
                        </div>
                    )}

                    {assignment?.submission_types?.length > 0 && (
                        <div className="rounded-sm border bg-muted/30 p-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Accepted submission types
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {assignment.submission_types.map((type) => (
                                    <Badge key={type} variant="default">
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {isGraded && (
                        <div className='rounded-sm border border-success/20 bg-success/5 p-3'>
                            <p className='text-sm font-medium text-success'>
                                Score: {gradeSummary}
                            </p>
                            {submission?.instructor_comments ? (
                                <p className='text-success mt-2 whitespace-pre-wrap text-sm'>
                                    {submission.instructor_comments}
                                </p>
                            ) : null}
                            {submission?.graded_at ? (
                                <p className='text-success/80 mt-2 text-xs'>
                                    Graded {formatDate(submission.graded_at)}
                                </p>
                            ) : null}
                        </div>
                    )}

                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Your response</label>
                        <Textarea
                            rows={8}
                            value={content}
                            onChange={event => setContent(event.target.value)}
                            disabled={!canEdit}
                            placeholder='Type your answer or notes about your attached file.'
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Attachments</label>
                        {submission?.file_urls?.length ? (
                            <div className='space-y-2 rounded-sm border p-3 text-sm'>
                                {submission.file_urls.map((url, index) => (
                                    <a
                                        key={`${url}-${index}`}
                                        href={url}
                                        target='_blank'
                                        rel='noreferrer'
                                        className='text-primary block truncate underline'
                                    >
                                        Existing file {index + 1}
                                    </a>
                                ))}
                            </div>
                        ) : null}

                        {queuedFiles.length > 0 ? (
                            <div className='space-y-2 rounded-xl border p-3 text-sm'>
                                {queuedFiles.map(file => (
                                    <div key={`${file.name}-${file.size}`} className='flex items-center justify-between gap-3'>
                                        <div className='flex min-w-0 items-center gap-2'>
                                            <Paperclip className='text-muted-foreground h-4 w-4 shrink-0' />
                                            <span className='truncate'>{file.name}</span>
                                        </div>
                                        <button
                                            type='button'
                                            className='text-muted-foreground hover:text-foreground text-xs'
                                            onClick={() => removeFile(file)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {canEdit ? (
                            <Input
                                type='file'
                                multiple
                                disabled={isSubmitting}
                                onChange={event => handleFiles(event.target.files)}
                            />
                        ) : (
                            <p className='text-muted-foreground text-xs'>
                                This submission is locked for review.
                            </p>
                        )}
                    </div>

                    {canEdit ? (
                        <div className='flex justify-end gap-2 pt-2'>
                            <Button variant='outline' asChild>
                                <Link href='/dashboard/student/learning-hub?tab=assignments' className='inline-flex items-center gap-2'>
                                    Go to assignments page
                                    <ArrowRight className='h-4 w-4' />
                                </Link>
                            </Button>
                            <Button onClick={handleSubmitAssignment} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Upload className='mr-2 h-4 w-4 animate-pulse' />
                                        Submitting
                                    </>
                                ) : (
                                    <>
                                        <Send className='mr-2 h-4 w-4' />
                                        Submit
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className='flex justify-end'>
                            <Button variant='outline' asChild>
                                <Link href={`/dashboard/student/assignment/${assignment?.uuid}`} className='inline-flex items-center gap-2'>
                                    Open full assignments page
                                    <ArrowRight className='h-4 w-4' />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function AssignmentCard({
    item,
    onOpen,
}: {
    item: AssignmentViewRow;
    onOpen: (item: AssignmentViewRow) => void;
}) {
    const { row, state, due } = item;
    const assignment = row.assignment;
    const sub = row.latestSubmission;
    const status = state.key;
    const overdue = due.label === 'Overdue' && status !== 'graded';

    return (
        <Card>
            <CardContent className='flex flex-wrap items-start gap-3 p-4'>
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium'>{assignment?.title || 'Untitled assignment'}</p>
                        <Badge variant='outline' className='text-[10px]'>
                            {row.classMeta.courseTitle}
                        </Badge>
                        {status === 'pending' && <Badge variant='secondary'>To do</Badge>}
                        {status === 'returned' && <Badge className='bg-warning text-warning-foreground'>Returned</Badge>}
                        {status === 'submitted' && <Badge className='bg-primary text-primary-foreground'>Submitted</Badge>}
                        {status === 'graded' && (
                            <Badge className='bg-success text-success-foreground'>
                                Graded {sub?.score}/{assignment?.max_points}
                            </Badge>
                        )}
                        {overdue && <Badge variant='destructive'>Overdue</Badge>}
                    </div>

                    {assignment?.instructions && (
                        <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{stripHtml(assignment.instructions)}</p>
                    )}

                    <p className='mt-1 text-xs text-muted-foreground'>
                        {row.schedule?.due_at ?? assignment?.due_date
                            ? `Due ${formatDate(row.schedule?.due_at ?? assignment?.due_date)}`
                            : 'No due date'}
                        {assignment?.max_points ? ` · Max ${assignment.max_points} pts` : ''}
                    </p>
                </div>

                <Button size='sm' className='text-xs' onClick={() => onOpen(item)}>
                    {status === 'graded' ? (
                        <>
                            <CheckCircle2 className='h-3 w-3' /> View feedback
                        </>
                    ) : status === 'submitted' ? (
                        'View submission'
                    ) : status === 'returned' ? (
                        'Revise submission'
                    ) : status === 'pending' ? (
                        'Continue draft'
                    ) : (
                        'Start'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function LessonHubAssignmentsTab() {
    const [filter, setFilter] = useState<StudentAssignmentFilterTab>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortKey>('due');
    const [active, setActive] = useState<AssignmentViewRow | null>(null);
    const [searchValue, setSearchValue] = useState('');

    const { assignmentRows, isLoading } = useStudentAssignmentData();

    const decorated = useMemo(
        () =>
            assignmentRows.map(row => ({
                row,
                state: getStudentAssignmentSubmissionState(row),
                due: getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date),
            })),
        [assignmentRows]
    );

    const stats = useMemo(() => {
        const total = decorated.length;
        const pending = decorated.filter(item => item.state.key === 'pending').length;
        const submitted = decorated.filter(item => item.state.key === 'submitted').length;
        const graded = decorated.filter(item => item.state.key === 'graded').length;
        const returned = decorated.filter(item => item.state.key === 'returned').length;
        const percentageValues = decorated
            .map(item => item.row.latestSubmission?.percentage)
            .filter((value): value is number => typeof value === 'number');

        const averageScore = percentageValues.length
            ? Math.round(percentageValues.reduce((sum, value) => sum + value, 0) / percentageValues.length)
            : 0;

        return { total, pending, submitted, graded, returned, averageScore };
    }, [decorated]);

    const courseOptions = useMemo(
        () =>
            Array.from(
                new Map(
                    decorated
                        .filter(item => Boolean(item.row.classMeta.courseUuid))
                        .map(item => [item.row.classMeta.courseUuid, item.row.classMeta.courseTitle])
                ).entries()
            )
                .map(([id, title]) => ({ id, title }))
                .sort((a, b) => a.title.localeCompare(b.title)),
        [decorated]
    );

    const filteredRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();

        return decorated
            .filter(item => filter === 'all' || item.state.key === filter)
            .filter(item => courseFilter === 'all' || item.row.classMeta.courseUuid === courseFilter)
            .filter(item => {
                if (!query) return true;
                return [item.row.assignment?.title, item.row.assignment?.description, item.row.assignment?.instructions, item.row.classMeta.classTitle, item.row.classMeta.courseTitle]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(query));
            })
            .sort((a, b) => {
                if (sortBy === 'course') {
                    return a.row.classMeta.courseTitle.localeCompare(b.row.classMeta.courseTitle);
                }
                if (sortBy === 'title') {
                    return (a.row.assignment?.title || '').localeCompare(b.row.assignment?.title || '');
                }

                const at = a.row.schedule?.due_at ?? a.row.assignment?.due_date;
                const bt = b.row.schedule?.due_at ?? b.row.assignment?.due_date;
                const aTime = at ? new Date(at).getTime() : Number.POSITIVE_INFINITY;
                const bTime = bt ? new Date(bt).getTime() : Number.POSITIVE_INFINITY;
                return aTime - bTime;
            });
    }, [courseFilter, decorated, filter, searchValue, sortBy]);

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className='h-28 rounded-sm' />
                    ))}
                </div>
                <Skeleton className='h-28 rounded-sm' />
                <div className='grid gap-4 lg:grid-cols-2'>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className='h-56 rounded-sm' />
                    ))}
                </div>
            </div>
        );
    }

    const filterTabs: Array<{ value: StudentAssignmentFilterTab; label: string; count: number }> = [
        { value: 'all', label: 'All', count: stats.total },
        { value: 'pending', label: 'To do', count: stats.pending },
        { value: 'submitted', label: 'Submitted', count: stats.submitted },
        { value: 'returned', label: 'Returned', count: stats.returned },
        { value: 'graded', label: 'Graded', count: stats.graded },
    ];

    const statTiles = [
        {
            icon: Layers,
            label: 'Assignments',
            value: stats.total,
            helper: 'Across your classes',
            tone: 'primary' as const,
        },
        {
            icon: ClipboardCheck,
            label: 'Pending',
            value: stats.pending,
            helper: 'Awaiting your work',
            tone: 'warning' as const,
        },
        {
            icon: Send,
            label: 'Awaiting grade',
            value: stats.submitted + stats.returned,
            helper: 'Submitted or returned',
            tone: 'primary' as const,
        },
        {
            icon: GraduationCap,
            label: 'Average score',
            value: `${stats.averageScore}%`,
            helper: stats.graded > 0 ? 'From graded work' : 'No graded work yet',
            tone: 'success' as const,
        },
    ];

    return (
        <div className='space-y-6'>
            <div className='flex flex-wrap gap-2'>
                {filterTabs.map(tab => {
                    const activeTab = filter === tab.value;
                    return (
                        <Button
                            key={tab.value}
                            size='sm'
                            variant={activeTab ? 'default' : 'outline'}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label} <span className='ml-1 opacity-70'>({tab.count})</span>
                        </Button>
                    );
                })}

                <div className='ml-auto flex flex-wrap items-center gap-2'>
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className='h-9 w-[180px] text-xs'>
                            <SelectValue placeholder='Course' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All courses</SelectItem>
                            {courseOptions.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={value => setSortBy(value as SortKey)}>
                        <SelectTrigger className='h-9 w-[170px] text-xs'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='due'>Due date</SelectItem>
                            <SelectItem value='course'>Course</SelectItem>
                            <SelectItem value='title'>Title</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredRows.length === 0 ? (
                <EmptyState
                    variant='card'
                    icon={SearchX}
                    title='No assignments match this filter'
                    description='Adjust the active tab, course filter, or search term to review your work.'
                />
            ) : (
                <div className='flex flex-col gap-4'>
                    {filteredRows.map(item => (
                        <AssignmentCard
                            key={`${item.row.classMeta.classUuid}-${item.row.schedule?.uuid ?? item.row.assignment?.uuid}`}
                            item={item}
                            onOpen={setActive}
                        />
                    ))}
                </div>
            )}

            <AssignmentDetailSheet payload={active} onClose={() => setActive(null)} />
        </div>
    );
}
