'use client';

import { AttachmentResourceList } from '@/components/assessment/AttachmentResourceList';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    getAssignmentSubmissionsQueryKey,
    getSubmissionAttachmentsOptions,
    submitAssignmentQueryMutation,
    uploadSubmissionAttachmentMutation
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmissionAttachment } from '@/services/client/types.gen';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import {
    getDueSummary,
    getStudentAssignmentSubmissionState,
    useStudentAssignmentData,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    FileQuestion,
    FileText,
    Loader2,
    MessageSquareText,
    Paperclip,
    RotateCcw,
    Send,
    Upload,
    X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { toAttachmentResourceItems } from '../../_components/student-assignment-workspace';
import DragDropUpload from '../drag-drop';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
    if (value === null || value === undefined || value === '') return 'No deadline';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';
    return new Intl.DateTimeFormat('en-US', options ?? { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getGradeTone(percentage?: number | null) {
    if (percentage == null) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-primary';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
}

function normalizeSubmissionTypes(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(item => String(item).toUpperCase());
    return [String(value).toUpperCase()];
}

function acceptsFileSubmission(submissionTypes: string[]) {
    return submissionTypes.some(type =>
        ['DOCUMENT', 'IMAGE', 'AUDIO', 'VIDEO'].includes(type.toUpperCase())
    );
}

function MetaTile({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
    return (
        <div className='rounded-xl border border-border/60 bg-background/60 p-3'>
            <p className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>{label}</p>
            <p className={cn('mt-1 text-sm font-semibold text-foreground', valueClass)}>{value}</p>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAssignmentSubmissionPage() {
    const params = useParams();
    const assignmentId = params?.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();

    const { assignmentRows, isLoading } = useStudentAssignmentData();

    const selectedAssignment = useMemo(
        () => assignmentRows.find(r => r.assignment?.uuid === assignmentId) ?? null,
        [assignmentRows, assignmentId]
    );

    const [submissionText, setSubmissionText] = useState('');
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

    const activeEnrollmentUuid =
        selectedAssignment?.classMeta.courseEnrollmentUuid ??
        selectedAssignment?.classMeta.enrollmentUuid;

    const selectedSubmissionTypes = normalizeSubmissionTypes(
        selectedAssignment?.assignment?.submission_types
    );
    const selectedStatus = selectedAssignment
        ? getStudentAssignmentSubmissionState(selectedAssignment)
        : null;
    const canUploadFiles = acceptsFileSubmission(selectedSubmissionTypes);

    const submissionStatus = String(selectedAssignment?.latestSubmission?.status ?? '').toUpperCase();
    const hasSubmission = !!selectedAssignment?.latestSubmission;
    const canResubmit = submissionStatus === 'RETURNED';

    useEffect(() => {
        if (canResubmit) {
            setSubmissionText(selectedAssignment?.latestSubmission?.submission_text ?? '');
        }
    }, [canResubmit, selectedAssignment]);

    const canSubmitSelected =
        !!activeEnrollmentUuid &&
        (!selectedAssignment?.latestSubmission || ['RETURNED', 'DRAFT'].includes(submissionStatus));

    // ── Submission attachments query ────────────────────────────────────────
    const selectedSubmissionAttachmentsQuery = useQuery({
        ...getSubmissionAttachmentsOptions({
            path: {
                assignmentUuid: selectedAssignment?.assignment?.uuid as string,
                submissionUuid: selectedAssignment?.latestSubmission?.uuid as string,
            },
        }),
        enabled: !!selectedAssignment?.assignment?.uuid && !!selectedAssignment?.latestSubmission?.uuid,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // ── Mutations ───────────────────────────────────────────────────────────
    const submitAssignmentMut = useMutation(submitAssignmentQueryMutation());
    const uploadSubmissionAttachmentMut = useMutation(uploadSubmissionAttachmentMutation());
    const isSubmitting = submitAssignmentMut.isPending || uploadSubmissionAttachmentMut.isPending;

    // ── File helpers ────────────────────────────────────────────────────────
    const handleFilesAdded = (files: File[]) => {
        const existingKeys = new Set(queuedFiles.map(f => `${f.name}-${f.size}`));
        setQueuedFiles(prev => [...prev, ...files.filter(f => !existingKeys.has(`${f.name}-${f.size}`))]);
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setQueuedFiles(prev =>
            prev.filter(f => `${f.name}-${f.size}` !== `${fileToRemove.name}-${fileToRemove.size}`)
        );
    };

    // ── Submit handler ────────────────────────────────────────────────────────
    const handleSubmitAssignment = async () => {
        if (!selectedAssignment?.assignment?.uuid) {
            toast.error('This assignment is missing an active assignment record.');
            return;
        }
        if (!activeEnrollmentUuid) {
            toast.error('This assignment is missing an active student enrollment.');
            return;
        }
        const submissionContent = submissionText.trim();
        if (!submissionContent && queuedFiles.length === 0) {
            toast.error('Add a written response or at least one attachment before submitting.');
            return;
        }

        try {
            const response = await submitAssignmentMut.mutateAsync({
                path: { assignmentUuid: selectedAssignment.assignment.uuid },
                body: {
                    enrollment_uuid: activeEnrollmentUuid,
                    student_uuid: selectedAssignment.classMeta.studentUuid,
                    submission_text: submissionContent,
                    file_urls: canUploadFiles ? ['/assignment.pdf'] : [],
                },
                query: {
                    enrollmentUuid: activeEnrollmentUuid,
                    content: submissionContent,
                    enrollment_uuid: activeEnrollmentUuid,
                    file_urls: canUploadFiles ? ['/assignment.pdf'] : [],
                    fileUrls: canUploadFiles ? ['/assignment.pdf'] : [],
                    student_uuid: selectedAssignment.classMeta.studentUuid,
                    studentUuid: selectedAssignment.classMeta.studentUuid,
                    submission_text: submissionContent,
                },
            });

            const submissionUuid = response.data?.uuid;
            if (!submissionUuid) throw new Error('Submission was created without an identifier.');

            await Promise.all(
                queuedFiles.map(file =>
                    uploadSubmissionAttachmentMut.mutateAsync({
                        body: { file },
                        path: {
                            assignmentUuid: selectedAssignment.assignment.uuid as string,
                            submissionUuid,
                        },
                    })
                )
            );

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: getAssignmentSubmissionsQueryKey({
                        path: { assignmentUuid: selectedAssignment.assignment.uuid },
                    }),
                }),
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] }),
            ]);

            toast.success('Assignment submitted successfully.');
            router.push('/dashboard/assignment');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Unable to submit this assignment right now.'));
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className='mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8'>
                <Skeleton className='h-9 w-40 rounded-full' />
                <Skeleton className='h-40 rounded-2xl' />
                <Skeleton className='h-48 rounded-2xl' />
                <Skeleton className='h-64 rounded-2xl' />
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────
    if (!selectedAssignment) {
        return (
            <div className='flex min-h-[70vh] items-center justify-center px-6'>
                <div className='max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm'>
                    <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
                        <FileQuestion className='h-8 w-8 text-muted-foreground' />
                    </div>
                    <h2 className='text-xl font-semibold tracking-tight text-foreground'>
                        Assignment not found
                    </h2>
                    <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                        The assignment you&apos;re looking for may have been deleted, moved, or you may not
                        have permission to access it.
                    </p>
                    <Button className='mt-8' onClick={() => router.push('/dashboard/assignment')}>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Back to assignments
                    </Button>
                </div>
            </div>
        );
    }

    const dueValue = selectedAssignment.schedule?.due_at ?? selectedAssignment.assignment?.due_date;
    const dueSummary = getDueSummary(dueValue);
    const submission = selectedAssignment.latestSubmission;
    const requirements =
        selectedSubmissionTypes.length > 0
            ? selectedSubmissionTypes.join(', ')
            : 'Text or instructor-defined format';

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className='mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8'>
            <Button
                variant='ghost'
                size='sm'
                className='-ml-2 w-fit rounded-full text-muted-foreground'
                onClick={() => router.push('/dashboard/assignment')}
            >
                <ArrowLeft className='mr-2 h-4 w-4' />
                All assignments
            </Button>

            {/* ── Header card ────────────────────────────────────────────────── */}
            <section className='relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-7'>
                <div className='absolute inset-x-0 top-0 h-1 bg-primary' />
                <div className='flex flex-col gap-4'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary'>
                            {selectedAssignment.classMeta.courseTitle}
                        </Badge>
                        {selectedStatus && <Badge variant={selectedStatus.variant}>{selectedStatus.label}</Badge>}
                        {!submission && (
                            <Badge className={dueSummary.badgeClassName} variant='outline'>
                                <CalendarDays className='mr-1 h-3.5 w-3.5' />
                                {dueSummary.label}
                            </Badge>
                        )}
                    </div>

                    <div className='flex items-start gap-4'>
                        <div className='hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex'>
                            <FileText className='h-6 w-6' />
                        </div>
                        <div className='min-w-0 space-y-1'>
                            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                                {selectedAssignment.assignment?.title || 'Assignment details'}
                            </h1>
                            <p className='text-sm text-muted-foreground'>
                                {selectedAssignment.classMeta.classTitle}
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                        <MetaTile label='Due' value={formatDate(dueValue, { dateStyle: 'medium' })} />
                        <MetaTile
                            label='Points'
                            value={
                                selectedAssignment.assignment?.points_display ||
                                selectedAssignment.assignment?.max_points ||
                                'Not set'
                            }
                        />
                        <MetaTile label='Attempts' value={selectedAssignment.submissions?.length ?? 0} />
                        <MetaTile
                            label='Score'
                            value={
                                submission?.percentage == null
                                    ? 'Pending'
                                    : submission.grade_display || `${Math.round(submission.percentage)}%`
                            }
                            valueClass={getGradeTone(submission?.percentage)}
                        />
                    </div>
                </div>
            </section>

            {/* ── Brief ──────────────────────────────────────────────────────── */}
            <Card className='border-border/70 shadow-sm'>
                <CardContent className='space-y-6 p-6'>
                    {selectedAssignment.assignment?.description && (
                        <section>
                            <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                                Description
                            </h2>
                            <div className='prose prose-sm max-w-none dark:prose-invert'>
                                <RichTextRenderer htmlString={selectedAssignment.assignment.description} />
                            </div>
                        </section>
                    )}

                    <section>
                        <h2 className='mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                            Instructions
                        </h2>
                        {selectedAssignment.assignment?.instructions ? (
                            <div className='prose prose-sm max-w-none dark:prose-invert'>
                                <RichTextRenderer htmlString={selectedAssignment.assignment.instructions} />
                            </div>
                        ) : (
                            <p className='text-sm text-muted-foreground'>No extra instructions were provided.</p>
                        )}
                    </section>

                    <section className='rounded-xl border border-border/60 bg-muted/40 p-4'>
                        <h3 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                            Submission requirements
                        </h3>
                        <p className='mt-1 text-sm font-medium text-foreground'>{requirements}</p>
                    </section>
                </CardContent>
            </Card>

            {/* ── Instructor resources ───────────────────────────────────────── */}
            <Card className='border-border/70 shadow-sm'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <Paperclip className='h-4 w-4 text-primary' />
                        Resources from your instructor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AttachmentResourceList
                        attachments={toAttachmentResourceItems(selectedAssignment.attachments)}
                        emptyMessage='No supporting files were attached to this assignment.'
                        previewLabel='Read file'
                    />
                </CardContent>
            </Card>

            {/* ── Submission zone ────────────────────────────────────────────── */}
            {submission ? (
                <Card className='border-border/70 shadow-sm'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <Send className='h-4 w-4 text-primary' />
                            Your latest submission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        <div className='grid gap-3 sm:grid-cols-3'>
                            <MetaTile label='Submitted' value={formatDate(submission.submitted_at)} />
                            <MetaTile
                                label='Status'
                                value={submission.submission_status_display || submission.status}
                            />
                            <MetaTile
                                label='Score'
                                value={
                                    submission.percentage == null
                                        ? 'Pending'
                                        : submission.grade_display || `${Math.round(submission.percentage)}%`
                                }
                                valueClass={getGradeTone(submission.percentage)}
                            />
                        </div>

                        {submission.submission_text ? (
                            <div className='space-y-2'>
                                <p className='text-sm font-medium text-foreground'>Your written response</p>
                                <div className='rounded-xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground [&_p]:leading-relaxed'>
                                    <RichTextRenderer htmlString={submission.submission_text} />
                                </div>
                            </div>
                        ) : null}

                        {submission.instructor_comments ? (
                            <div className='space-y-2'>
                                <p className='flex items-center gap-2 text-sm font-medium text-foreground'>
                                    <MessageSquareText className='h-4 w-4 text-warning' />
                                    Instructor feedback
                                </p>
                                <div className='rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm text-foreground'>
                                    {submission.instructor_comments}
                                </div>
                            </div>
                        ) : null}

                        <div className='space-y-2'>
                            <p className='flex items-center gap-2 text-sm font-medium text-foreground'>
                                <Paperclip className='h-4 w-4 text-muted-foreground' />
                                Uploaded files
                            </p>
                            {selectedSubmissionAttachmentsQuery.isLoading ? (
                                <div className='space-y-2'>
                                    <Skeleton className='h-14 rounded-xl' />
                                    <Skeleton className='h-14 rounded-xl' />
                                </div>
                            ) : (
                                <AttachmentResourceList
                                    attachments={toAttachmentResourceItems(
                                        (selectedSubmissionAttachmentsQuery.data?.data ?? []) as AssignmentSubmissionAttachment[]
                                    )}
                                    emptyMessage='No files were uploaded with the latest submission.'
                                    previewLabel='Read file'
                                />
                            )}
                        </div>

                        {canResubmit && (
                            <div className='space-y-4 border-t border-border/60 pt-5'>
                                <div className='flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4'>
                                    <RotateCcw className='mt-0.5 h-5 w-5 shrink-0 text-warning' />
                                    <div>
                                        <h3 className='text-sm font-semibold text-foreground'>
                                            Submission returned for revision
                                        </h3>
                                        <p className='mt-1 text-sm text-muted-foreground'>
                                            Your instructor returned this submission. Review the feedback above, make
                                            the requested changes, and submit an updated version.
                                        </p>
                                    </div>
                                </div>

                                <SubmissionForm
                                    submissionText={submissionText}
                                    setSubmissionText={setSubmissionText}
                                    queuedFiles={queuedFiles}
                                    onFilesAdded={handleFilesAdded}
                                    onRemoveFile={handleRemoveFile}
                                    onSubmit={handleSubmitAssignment}
                                    canSubmit={canSubmitSelected}
                                    canUploadFiles={canUploadFiles}
                                    isSubmitting={isSubmitting}
                                    isResubmit
                                    activeEnrollmentUuid={activeEnrollmentUuid}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className='border-border/70 shadow-sm'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <ClipboardList className='h-4 w-4 text-primary' />
                            Submit your work
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SubmissionForm
                            submissionText={submissionText}
                            setSubmissionText={setSubmissionText}
                            queuedFiles={queuedFiles}
                            onFilesAdded={handleFilesAdded}
                            onRemoveFile={handleRemoveFile}
                            onSubmit={handleSubmitAssignment}
                            canSubmit={canSubmitSelected}
                            canUploadFiles={canUploadFiles}
                            isSubmitting={isSubmitting}
                            isResubmit={false}
                            activeEnrollmentUuid={activeEnrollmentUuid}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Submission form ─────────────────────────────────────────────────────────

function SubmissionForm({
    submissionText,
    setSubmissionText,
    queuedFiles,
    onFilesAdded,
    onRemoveFile,
    onSubmit,
    canSubmit,
    canUploadFiles,
    isSubmitting,
    isResubmit,
    activeEnrollmentUuid,
}: {
    submissionText: string;
    setSubmissionText: (v: string) => void;
    queuedFiles: File[];
    onFilesAdded: (files: File[]) => void;
    onRemoveFile: (file: File) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    canUploadFiles: boolean;
    isSubmitting: boolean;
    isResubmit: boolean;
    activeEnrollmentUuid?: string | null;
}) {
    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground' htmlFor='submission-text'>
                    Written response
                </label>
                <Textarea
                    className='min-h-32'
                    disabled={!canSubmit || isSubmitting}
                    id='submission-text'
                    onChange={e => setSubmissionText(e.target.value)}
                    placeholder='Paste your answer, notes, or submission links here.'
                    value={submissionText}
                />
            </div>

            <div className='space-y-3'>
                <div className='flex items-center justify-between gap-3'>
                    <div>
                        <p className='text-sm font-medium text-foreground'>Attachments</p>
                        <p className='text-xs text-muted-foreground'>
                            {canUploadFiles
                                ? 'Accepted file uploads can be added before you submit.'
                                : 'This assignment primarily expects text or link-based responses.'}
                        </p>
                    </div>
                    <Badge variant='outline'>{queuedFiles.length} queued</Badge>
                </div>

                <DragDropUpload
                    className={cn(
                        'rounded-xl border-2 border-dashed border-border/70 bg-background/60 p-6 transition hover:border-primary/40',
                        !canUploadFiles || !canSubmit || isSubmitting ? 'pointer-events-none opacity-60' : ''
                    )}
                    multiple
                    onFilesAdded={onFilesAdded}
                >
                    <div className='flex flex-col items-center gap-2 text-center'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <Upload className='h-5 w-5' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-foreground'>Drop files here or click to browse</p>
                            <p className='text-xs text-muted-foreground'>
                                Documents and supporting media upload right after the submission is created.
                            </p>
                        </div>
                    </div>
                </DragDropUpload>

                {queuedFiles.length > 0 && (
                    <div className='space-y-2'>
                        {queuedFiles.map(file => (
                            <div
                                key={`${file.name}-${file.size}`}
                                className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-3'
                            >
                                <div className='flex min-w-0 items-center gap-3'>
                                    <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium text-foreground'>{file.name}</p>
                                        <p className='text-xs text-muted-foreground'>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <Button disabled={isSubmitting} onClick={() => onRemoveFile(file)} size='icon' type='button' variant='ghost'>
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className='flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-xs text-muted-foreground'>
                    {!activeEnrollmentUuid
                        ? 'Submission is unavailable until this class has an active enrollment record.'
                        : canSubmit
                            ? 'Your submission saves immediately and any queued files upload right after.'
                            : 'This assignment already has a live submission state.'}
                </p>

                <Button disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Submitting
                        </>
                    ) : (
                        <>
                            {isResubmit ? <RotateCcw className='mr-2 h-4 w-4' /> : <CheckCircle2 className='mr-2 h-4 w-4' />}
                            {isResubmit ? 'Resubmit assignment' : 'Submit assignment'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
