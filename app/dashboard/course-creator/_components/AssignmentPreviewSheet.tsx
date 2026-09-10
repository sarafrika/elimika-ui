'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { STALE_TIMES } from '@/lib/query-client';
import {
    getAssignmentAttachmentsOptions,
    getAssignmentByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentAttachment } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileText } from 'lucide-react';
import {
    assessmentLabel,
    PreviewError,
    PreviewLoading,
    previewResponseFailed,
    PreviewRubric,
    PreviewSection,
    PreviewStat,
} from './AssessmentPreviewPrimitives';

export type AssignmentPreviewSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentUuid: string;
    lessonTitle?: string;
};

function AttachmentRow({ attachment }: { attachment: AssignmentAttachment }) {
    const url = toAuthenticatedMediaUrl(attachment.file_url);
    const canOpen =
        url && (/^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//')));
    return (
        <li className='border-border flex items-center gap-3 rounded-lg border px-3 py-2'>
            <FileText className='text-muted-foreground h-5 w-5 shrink-0' />
            <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>
                    {attachment.original_filename || 'Attachment'}
                </p>
                <p className='text-muted-foreground text-xs'>
                    {attachment.mime_type}
                    {attachment.file_size_bytes != null &&
                        ` · ${(Number(attachment.file_size_bytes) / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`}
                </p>
            </div>
            {canOpen && (
                <Button asChild variant='outline' size='sm'>
                    <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Open ${attachment.original_filename || 'attachment'}`}
                    >
                        Open
                    </a>
                </Button>
            )}
        </li>
    );
}

export function AssignmentPreviewSheet({
    open,
    onOpenChange,
    assignmentUuid,
    lessonTitle,
}: AssignmentPreviewSheetProps) {
    const assignmentQuery = useQuery({
        ...getAssignmentByUuidOptions({ path: { uuid: assignmentUuid } }),
        enabled: open && Boolean(assignmentUuid),
        staleTime: STALE_TIMES.entity,
        refetchOnMount: 'always',
    });
    const attachmentsQuery = useQuery({
        ...getAssignmentAttachmentsOptions({ path: { assignmentUuid } }),
        enabled: open && Boolean(assignmentUuid),
        staleTime: STALE_TIMES.entity,
        refetchOnMount: 'always',
    });
    const failed = assignmentQuery.isError || previewResponseFailed(assignmentQuery.data);
    const assignment = failed ? undefined : assignmentQuery.data?.data;
    const attachmentsFailed =
        attachmentsQuery.isError || previewResponseFailed(attachmentsQuery.data);
    const attachments = attachmentsFailed ? [] : (attachmentsQuery.data?.data ?? []);
    const dueDate = assignment?.due_date ? new Date(assignment.due_date) : null;
    // The schema declares a scalar, while the API documentation also permits an array.
    const submissionTypes = assignment?.submission_types
        ? Array.isArray(assignment.submission_types)
            ? assignment.submission_types
            : [assignment.submission_types]
        : [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-4xl'>
                <SheetHeader className='pr-12 break-words'>
                    <SheetTitle>{assignment?.title || 'Assignment preview'}</SheetTitle>
                    <SheetDescription>{lessonTitle || 'Assignment details'}</SheetDescription>
                </SheetHeader>
                <div className='space-y-6 px-4 pb-6'>
                    {assignmentQuery.isPending ? (
                        <PreviewLoading />
                    ) : failed || !assignment ? (
                        <PreviewError
                            title='Unable to load assignment'
                            retry={() => {
                                void assignmentQuery.refetch();
                            }}
                        />
                    ) : (
                        <>
                            <div className='flex flex-wrap gap-2'>
                                <Badge variant={assignment.is_published ? 'default' : 'outline'}>
                                    {assignment.is_published ? 'Published' : 'Draft'}
                                </Badge>
                                {assignment.assignment_category && (
                                    <Badge variant='secondary'>
                                        {assessmentLabel(assignment.assignment_category)}
                                    </Badge>
                                )}
                                <Badge variant='secondary' className='gap-1'>
                                    <Eye className='h-3 w-3' />
                                    View only
                                </Badge>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                <PreviewStat label='Max points' value={assignment.max_points ?? '—'} />
                                <PreviewStat
                                    label='Due date'
                                    value={
                                        dueDate && !Number.isNaN(dueDate.getTime())
                                            ? new Intl.DateTimeFormat(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            }).format(dueDate)
                                            : 'No due date'
                                    }
                                />
                            </div>
                            {assignment.description && (
                                <PreviewSection title='Description'>
                                    <HTMLTextPreview htmlContent={assignment.description} className='text-sm' />
                                </PreviewSection>
                            )}
                            {assignment.instructions && (
                                <PreviewSection title='Instructions'>
                                    <HTMLTextPreview htmlContent={assignment.instructions} className='text-sm' />
                                </PreviewSection>
                            )}
                            <PreviewSection title='Submission types'>
                                {submissionTypes.length ? (
                                    <div className='flex flex-wrap gap-2'>
                                        {submissionTypes.map(type => (
                                            <Badge key={type} variant='outline'>
                                                {assessmentLabel(type)}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState variant='compact' title='No submission types selected' />
                                )}
                            </PreviewSection>
                            {assignment.rubric_uuid && <PreviewRubric uuid={assignment.rubric_uuid} />}
                            <PreviewSection title='Attachments'>
                                {attachmentsQuery.isPending ? (
                                    <PreviewLoading />
                                ) : attachmentsFailed ? (
                                    <PreviewError
                                        title='Unable to load attachments'
                                        retry={() => {
                                            void attachmentsQuery.refetch();
                                        }}
                                    />
                                ) : attachments.length ? (
                                    <ul className='space-y-2'>
                                        {attachments.map(attachment => (
                                            <AttachmentRow
                                                key={attachment.uuid ?? attachment.stored_filename}
                                                attachment={attachment}
                                            />
                                        ))}
                                    </ul>
                                ) : (
                                    <EmptyState variant='compact' title='No attachments added' />
                                )}
                            </PreviewSection>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
