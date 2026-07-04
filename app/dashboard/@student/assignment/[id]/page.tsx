'use client';

import { AttachmentResourceList } from '@/components/assessment/AttachmentResourceList';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cx } from '@/lib/design-system';
import {
    getAssignmentSubmissionsQueryKey,
    getSubmissionAttachmentsOptions,
    submitAssignmentQueryMutation,
    uploadSubmissionAttachmentMutation,
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
    FileQuestion,
    FileText,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { toAttachmentResourceItems } from '../../_components/student-assignment-workspace';
import DragDropUpload from '../drag-drop';

// ── Helpers (same as workspace) ──────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAssignmentSubmissionPage() {
    const params = useParams();
    const assignmentId = params?.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();

    const { assignmentRows, isLoading } = useStudentAssignmentData();

    // Find the matching row — same shape that the workspace uses as selectedAssignment
    const selectedAssignment = useMemo(
        () => assignmentRows.find(r => r.assignment?.uuid === assignmentId) ?? null,
        [assignmentRows, assignmentId]
    );

    const [submissionText, setSubmissionText] = useState("");
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

    // ── Derived values (mirrors workspace) ──────────────────────────────────
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

    const submissionStatus = String(
        selectedAssignment?.latestSubmission?.status ?? ""
    ).toUpperCase();

    const hasSubmission = !!selectedAssignment?.latestSubmission;

    const canResubmit = submissionStatus === "RETURNED";

    useEffect(() => {
        if (canResubmit) {
            setSubmissionText(
                selectedAssignment?.latestSubmission?.submission_text ?? ""
            );
        }
    }, [canResubmit, selectedAssignment]);

    const showSubmissionForm = !hasSubmission || canResubmit;

    const canSubmitSelected =
        !!activeEnrollmentUuid &&
        (!selectedAssignment?.latestSubmission ||
            ["RETURNED", "DRAFT"].includes(submissionStatus));

    // ── Submission attachments query (same as workspace) ────────────────────
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

    // ── Mutations (same as workspace) ───────────────────────────────────────
    const submitAssignmentMut = useMutation(submitAssignmentQueryMutation());
    const uploadSubmissionAttachmentMut = useMutation(uploadSubmissionAttachmentMutation());
    const isSubmitting = submitAssignmentMut.isPending || uploadSubmissionAttachmentMut.isPending;

    // ── File helpers (same as workspace) ────────────────────────────────────
    const handleFilesAdded = (files: File[]) => {
        const existingKeys = new Set(queuedFiles.map(f => `${f.name}-${f.size}`));
        setQueuedFiles(prev => [...prev, ...files.filter(f => !existingKeys.has(`${f.name}-${f.size}`))]);
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setQueuedFiles(prev =>
            prev.filter(f => `${f.name}-${f.size}` !== `${fileToRemove.name}-${fileToRemove.size}`)
        );
    };

    // ── Submit handler (mirrors workspace handleSubmitAssignment) ────────────
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
                    file_urls: ["/assignment.pdf"],
                },
                query: {
                    enrollmentUuid: activeEnrollmentUuid,
                    content: submissionContent,
                    enrollment_uuid: activeEnrollmentUuid,
                    file_urls: ["/assignment.pdf"],
                    fileUrls: ["/assignment.pdf"],
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

    if (isLoading) {
        return (
            <div className='mx-auto w-full max-w-7xl space-y-6 p-5 sm:p-6'>
                <Skeleton className='h-10 w-40 rounded-full' />
                <Skeleton className='h-32 rounded-2xl' />
                <Skeleton className='h-48 rounded-2xl' />
                <Skeleton className='h-64 rounded-2xl' />
            </div>
        );
    }

    if (!selectedAssignment) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <FileQuestion className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <h2 className="text-xl font-semibold tracking-tight">
                        Assignment Not Found
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        The assignment you're looking for may have been deleted,
                        moved, or you may not have permission to access it.
                    </p>

                    <Button
                        className="mt-8"
                        onClick={() => router.push("/dashboard/assignment")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignments
                    </Button>
                </div>
            </div>
        );
    }

    const dueSummary = getDueSummary(
        selectedAssignment.schedule?.due_at ?? selectedAssignment.assignment?.due_date
    );

    // ── Render ───────────────────────────────────────────────────────────────
    // Mirrors the Sheet content from StudentAssignmentWorkspace 1-to-1
    return (
        <div className='mx-auto w-full max-w-8xl space-y-6 p-5 sm:p-6'>

            {/* ── Page header (replaces SheetHeader) ─────────────────────────── */}
            <div className='border-border/60 space-y-3 border-b pb-5'>
                <Button
                    variant='ghost'
                    size='sm'
                    className='mb-2 -ml-2 rounded-full'
                    onClick={() => router.push('/dashboard/assignment')}
                >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    All assignments
                </Button>

                <div className='flex flex-wrap items-start gap-2'>
                    <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary'>
                        {selectedAssignment.classMeta.courseTitle}
                    </Badge>
                    {selectedStatus && (
                        <Badge variant={selectedStatus.variant}>{selectedStatus.label}</Badge>
                    )}

                    {!selectedAssignment?.latestSubmission && <Badge className={dueSummary.badgeClassName} variant='outline'>
                        <CalendarDays className='mr-1 h-3.5 w-3.5' />
                        {dueSummary.label}
                    </Badge>}

                </div>

                <h1 className='text-foreground text-2xl font-semibold'>
                    {selectedAssignment.assignment?.title || 'Assignment details'}
                </h1>

                <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
                    <span>
                        {selectedAssignment.classMeta.classTitle} • Due{' '}
                        {formatDate(
                            selectedAssignment.schedule?.due_at || selectedAssignment.assignment?.due_date
                        )}
                    </span>
                    <span className='text-muted-foreground'>•</span>
                    <span>
                        Points:{' '}
                        {selectedAssignment.assignment?.points_display ||
                            selectedAssignment.assignment?.max_points ||
                            'Not set'}
                    </span>
                    <span className='text-muted-foreground'>•</span>
                    <span>Attempts: {selectedAssignment.submissions?.length ?? 0}</span>
                </p>
            </div>

            {/* ── Body (exact mirror of Sheet body) ──────────────────────────── */}
            <div className='space-y-6'>

                {/* Description */}
                {selectedAssignment.assignment?.description && (
                    <section>
                        <h2 className='mb-3 text-lg font-semibold'>Description</h2>
                        <div className='prose prose-sm dark:prose-invert max-w-none'>
                            <RichTextRenderer htmlString={selectedAssignment.assignment.description} />
                        </div>
                    </section>
                )}

                {/* Instructions */}
                <section>
                    <h2 className='mb-3 text-lg font-semibold'>Instructions</h2>
                    {selectedAssignment.assignment?.instructions ? (
                        <div className='prose prose-sm dark:prose-invert max-w-none'>
                            <RichTextRenderer htmlString={selectedAssignment.assignment.instructions} />
                        </div>
                    ) : (
                        <p className='text-muted-foreground'>No extra instructions were provided.</p>
                    )}
                </section>

                {/* Submission requirements */}
                <section className='border-t pt-4'>
                    <h3 className='mb-2 text-sm font-medium'>Submission requirements</h3>
                    <p className='text-muted-foreground text-sm'>
                        {selectedSubmissionTypes.length > 0
                            ? selectedSubmissionTypes.join(', ')
                            : 'Text or instructor-defined format'}
                    </p>
                </section>
            </div>

            {/* Resources */}
            <Card className='border-border/60 space-y-0'>
                <CardHeader>
                    <CardTitle className='text-base'>Resources from your instructor</CardTitle>
                </CardHeader>
                <CardContent>
                    <AttachmentResourceList
                        attachments={toAttachmentResourceItems(selectedAssignment.attachments)}
                        emptyMessage='No supporting files were attached to this assignment.'
                        previewLabel='Read file'
                    />
                </CardContent>
            </Card>

            {/* ── Latest submission card ──────────────────────────────────────── */}
            {selectedAssignment.latestSubmission ? (
                <Card className='border-border/60'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-base'>Latest submission</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {/* Meta grid */}
                        <div className='grid gap-3 md:grid-cols-3'>
                            <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                                <p className='text-muted-foreground text-xs tracking-wide uppercase'>Submitted</p>
                                <p className='text-foreground mt-1 text-sm font-medium'>
                                    {formatDate(selectedAssignment.latestSubmission.submitted_at)}
                                </p>
                            </div>
                            <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                                <p className='text-muted-foreground text-xs tracking-wide uppercase'>Status</p>
                                <p className='text-foreground mt-1 text-sm font-medium'>
                                    {selectedAssignment.latestSubmission.submission_status_display ||
                                        selectedAssignment.latestSubmission.status}
                                </p>
                            </div>
                            <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                                <p className='text-muted-foreground text-xs tracking-wide uppercase'>Score</p>
                                <p className={cx('mt-1 text-sm font-semibold', getGradeTone(selectedAssignment.latestSubmission.percentage))}>
                                    {selectedAssignment.latestSubmission.percentage == null
                                        ? 'Pending'
                                        : selectedAssignment.latestSubmission.grade_display ||
                                        `${Math.round(selectedAssignment.latestSubmission.percentage)}%`}
                                </p>
                            </div>
                        </div>

                        {/* Written response */}
                        {selectedAssignment.latestSubmission.submission_text ? (
                            <div className='space-y-2'>
                                <p className='text-foreground text-sm font-medium'>Your written response</p>
                                <div className='border-border/60 bg-background/70 text-muted-foreground rounded-2xl border p-4 text-sm [&_p]:leading-6'>
                                    <RichTextRenderer htmlString={selectedAssignment.latestSubmission.submission_text} />
                                </div>

                                <div className='space-y-2'>
                                    {(Array.isArray(selectedAssignment.latestSubmission.file_urls)
                                        ? selectedAssignment.latestSubmission.file_urls
                                        : []
                                    ).map((url: string, index: number) => (
                                        <div
                                            key={index}
                                            className='border-border/60 bg-background/60 flex items-center gap-2 rounded-md border px-3 py-2'
                                        >
                                            <FileText className='text-muted-foreground h-4 w-4' />
                                            <span className='text-foreground truncate text-sm'>{url.split('/').pop()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Instructor feedback */}
                        {selectedAssignment.latestSubmission.instructor_comments ? (
                            <div className='space-y-2'>
                                <p className='text-foreground text-sm font-medium'>Instructor feedback</p>
                                <div className='border-warning/20 bg-warning/10 text-foreground rounded-2xl border p-4 text-sm'>
                                    {selectedAssignment.latestSubmission.instructor_comments}
                                </div>
                            </div>
                        ) : null}

                        {/* Uploaded files */}
                        <div className='space-y-2'>
                            <p className='text-foreground text-sm font-medium'>Uploaded files</p>
                            {selectedSubmissionAttachmentsQuery.isLoading ? (
                                <div className='space-y-2'>
                                    <Skeleton className='h-14 rounded-2xl' />
                                    <Skeleton className='h-14 rounded-2xl' />
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

                        {/* If returned — show the resubmit form below the latest submission */}
                        {canResubmit && (
                            <div className='border-border/60 border-t pt-4'>
                                <div className="mb-5 rounded-xl border border-warning bg-warning/10 p-4">
                                    <h3 className="text-sm font-semibold text-warning-foreground">
                                        Submission Returned
                                    </h3>

                                    <p className="mt-1 text-sm text-warning-foreground/90">
                                        Your instructor has returned this submission for revision. Review the
                                        feedback above, make the requested changes, and submit an updated
                                        version.
                                    </p>
                                </div>

                                {/* Submission requirements */}
                                <section className='border-t pt-4'>
                                    <h3 className='mb-2 text-sm font-medium'>Submission requirements</h3>
                                    <p className='text-muted-foreground text-sm'>
                                        {selectedSubmissionTypes.length > 0
                                            ? selectedSubmissionTypes.join(', ')
                                            : 'Text or instructor-defined format'}
                                    </p>
                                </section>

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
                /* ── No submission yet — show the submit form ─────────────────── */
                <Card className='border-border/60'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-base'>Submit your work</CardTitle>
                    </CardHeader>

                    {/* Submission requirements */}
                    <section className='pl-6 border-t pt-4'>
                        <h3 className='mb-2 text-sm font-medium'>Submission requirements</h3>
                        <p className='text-muted-foreground text-sm'>
                            {selectedSubmissionTypes.length > 0
                                ? selectedSubmissionTypes.join(', ')
                                : 'Text or instructor-defined format'}
                        </p>
                    </section>

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
            {/* Written response */}
            <div className='space-y-2'>
                <label className='text-foreground text-sm font-medium' htmlFor='submission-text'>
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

            {/* Attachments */}
            <div className='space-y-3'>
                <div className='flex items-center justify-between gap-3'>
                    <div>
                        <p className='text-foreground text-sm font-medium'>Attachments</p>
                        <p className='text-muted-foreground text-xs'>
                            {canUploadFiles
                                ? 'Accepted file uploads can be added before you submit.'
                                : 'This assignment primarily expects text or link-based responses.'}
                        </p>
                    </div>
                    <Badge variant='outline'>{queuedFiles.length} queued</Badge>
                </div>

                <DragDropUpload
                    className={cx(
                        !canUploadFiles || !canSubmit || isSubmitting
                            ? 'pointer-events-none opacity-60'
                            : ''
                    )}
                    multiple
                    onFilesAdded={onFilesAdded}
                >
                    <div className='flex flex-col items-center gap-2 text-center'>
                        <Upload className='text-primary h-5 w-5' />
                        <div>
                            <p className='text-foreground text-sm font-medium'>Drop files here or click to browse</p>
                            <p className='text-muted-foreground text-xs'>
                                Documents and supporting media upload right after the submission record is created.
                            </p>
                        </div>
                    </div>
                </DragDropUpload>

                {queuedFiles.length > 0 && (
                    <div className='space-y-2'>
                        {queuedFiles.map(file => (
                            <div
                                key={`${file.name}-${file.size}`}
                                className='border-border/60 bg-background/70 flex items-center justify-between gap-3 rounded-2xl border p-3'
                            >
                                <div className='min-w-0'>
                                    <p className='text-foreground truncate text-sm font-medium'>{file.name}</p>
                                    <p className='text-muted-foreground text-xs'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button disabled={isSubmitting} onClick={() => onRemoveFile(file)} size='icon' type='button' variant='ghost'>
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-muted-foreground text-xs'>
                    {!activeEnrollmentUuid
                        ? 'Submission is unavailable until this class has an active enrollment record.'
                        : canSubmit
                            ? 'Your submission will be saved immediately and any queued files will upload right after.'
                            : 'This assignment already has a live submission state.'}
                </p>

                <Button className='rounded-full' disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Submitting
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className='mr-2 h-4 w-4' />
                            {isResubmit ? 'Resubmit assignment' : 'Submit assignment'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}