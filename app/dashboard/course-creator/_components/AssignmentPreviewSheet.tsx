'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
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
import { useQuery } from '@tanstack/react-query';
import { Eye, } from 'lucide-react';
import { AssignmentContentPreview } from '../../../../components/content-preview/AssignmentContentPreview';
import {
    assessmentLabel,
    PreviewError,
    PreviewLoading,
    previewResponseFailed,
    PreviewRubric,
    PreviewSection,
    PreviewStat,
} from './AssessmentPreviewPrimitives';

type AssignmentPreviewSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentUuid: string;
    lessonTitle?: string;
};

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
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <Badge variant='outline'>
                                            {attachments.length ?? 0} files attached
                                        </Badge>
                                    </div>

                                    {attachmentsQuery.isPending ? (
                                        <PreviewLoading />
                                    ) : attachmentsFailed ? (
                                        <PreviewError
                                            title='Unable to load attachments'
                                            retry={() => {
                                                void attachmentsQuery.refetch();
                                            }}
                                        />
                                    ) : (
                                        <AssignmentContentPreview
                                            attachments={attachments ?? []}
                                        />
                                    )}
                                </div>
                            </PreviewSection>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
