'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AttachmentResourceList } from '@/components/assessment/AttachmentResourceList';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getAssignmentSubmissionsQueryKey,
  getSubmissionAttachmentsOptions,
  submitAssignmentMutation,
  uploadSubmissionAttachmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmissionAttachment } from '@/services/client/types.gen';
import {
  getStudentAssignmentSubmissionState,
  useStudentAssignmentData,
  type StudentAssignmentFilterTab,
  type StudentAssignmentRow,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import DragDropUpload from '../assignment/drag-drop';

type FilterTab = StudentAssignmentFilterTab;
type SortKey = 'due' | 'course' | 'title';

function normalizeAttachmentSize(value?: bigint | number) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function toAttachmentResourceItems<T extends { file_size_bytes?: bigint | number }>(
  attachments: T[]
) {
  return attachments.map(attachment => ({
    ...attachment,
    file_size_bytes: normalizeAttachmentSize(attachment.file_size_bytes),
  }));
}

function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (value === null || value === undefined || value === '') {
    return 'No deadline';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  const resolvedOptions: Intl.DateTimeFormatOptions = options ?? {
    dateStyle: 'medium',
    timeStyle: 'short',
  };

  return new Intl.DateTimeFormat('en-US', resolvedOptions).format(date);
}

function formatShortDate(value?: string | Date | null) {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

function getGradeTone(percentage?: number | null) {
  if (percentage == null) return 'text-muted-foreground';
  if (percentage >= 80) return 'text-success';
  if (percentage >= 60) return 'text-primary';
  if (percentage >= 40) return 'text-warning';
  return 'text-destructive';
}

export function StudentAssignmentWorkspace() {
  const student = useStudent();
  const queryClient = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('due');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRow | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assignment', title: 'Assignment', url: '/dashboard/assignment', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  if (!student?.uuid) {
    return (
      <div className={getEmptyStateClasses()}>
        <AlertCircle className='text-primary/70 h-10 w-10' />
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>Student profile required</h3>
          <p className='text-muted-foreground max-w-lg text-sm'>
            Assignments become available once a student profile is active on this account.
          </p>
        </div>
      </div>
    );
  }

  const { assignmentRows, isLoading } = useStudentAssignmentData();

  const processedRows = useMemo(() => {
    return assignmentRows
      .filter(row => {
        const matchesTab =
          activeTab === 'all' || getStudentAssignmentSubmissionState(row).key === activeTab;
        const matchesSearch =
          !searchValue.trim() ||
          [
            row.assignment?.title,
            row.assignment?.description,
            row.classMeta.courseTitle,
            row.classMeta.classTitle,
          ]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(searchValue.toLowerCase()));

        return matchesTab && matchesSearch;
      })
      .sort((left, right) => {
        if (sortBy === 'course') {
          return left.classMeta.courseTitle.localeCompare(right.classMeta.courseTitle);
        }

        if (sortBy === 'title') {
          return String(left.assignment?.title || '').localeCompare(
            String(right.assignment?.title || '')
          );
        }

        const leftDue = new Date(left.schedule?.due_at || left.assignment?.due_date || 0).getTime();
        const rightDue = new Date(
          right.schedule?.due_at || right.assignment?.due_date || 0
        ).getTime();
        return leftDue - rightDue;
      });
  }, [activeTab, assignmentRows, searchValue, sortBy]);

  const stats = useMemo(() => {
    const total = assignmentRows.length;
    const pending = assignmentRows.filter(
      row => getStudentAssignmentSubmissionState(row).key === 'pending'
    ).length;
    const submitted = assignmentRows.filter(
      row => getStudentAssignmentSubmissionState(row).key === 'submitted'
    ).length;
    const graded = assignmentRows.filter(
      row => getStudentAssignmentSubmissionState(row).key === 'graded'
    ).length;
    const returned = assignmentRows.filter(
      row => getStudentAssignmentSubmissionState(row).key === 'returned'
    ).length;
    const gradedSubmissions = assignmentRows
      .map(row => row.latestSubmission?.percentage)
      .filter((value): value is number => typeof value === 'number');

    const averageScore =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((totalScore, percentage) => totalScore + percentage, 0) /
              gradedSubmissions.length
          )
        : 0;

    const progress = total > 0 ? Math.round(((submitted + graded + returned) / total) * 100) : 0;

    return {
      averageScore,
      graded,
      pending,
      progress,
      returned,
      submitted,
      total,
    };
  }, [assignmentRows]);

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

  const submitAssignmentMut = useMutation(submitAssignmentMutation());
  const uploadSubmissionAttachmentMut = useMutation(uploadSubmissionAttachmentMutation());

  const isSubmitting = submitAssignmentMut.isPending || uploadSubmissionAttachmentMut.isPending;

  const selectedSubmissionTypes = normalizeSubmissionTypes(
    selectedAssignment?.assignment?.submission_types
  );
  const selectedStatus = selectedAssignment
    ? getStudentAssignmentSubmissionState(selectedAssignment)
    : null;
  const canUploadFiles = acceptsFileSubmission(selectedSubmissionTypes);
  const canSubmitSelected =
    !!selectedAssignment?.classMeta.enrollmentUuid &&
    (!selectedAssignment?.latestSubmission ||
      ['RETURNED', 'DRAFT'].includes(
        String(selectedAssignment.latestSubmission.status).toUpperCase()
      ));

  const handleCloseSheet = (open: boolean) => {
    if (!open) {
      setSelectedAssignment(null);
      setSubmissionText('');
      setQueuedFiles([]);
    }
  };

  const handleFilesAdded = (files: File[]) => {
    const existingKeys = new Set(queuedFiles.map(file => `${file.name}-${file.size}`));
    const dedupedFiles = files.filter(file => !existingKeys.has(`${file.name}-${file.size}`));
    setQueuedFiles(current => [...current, ...dedupedFiles]);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setQueuedFiles(current =>
      current.filter(
        file => `${file.name}-${file.size}` !== `${fileToRemove.name}-${fileToRemove.size}`
      )
    );
  };

  const handleOpenAssignment = (row: AssignmentRow) => {
    setSelectedAssignment(row);
    setSubmissionText(
      row.latestSubmission?.status === 'RETURNED' ? row.latestSubmission?.submission_text || '' : ''
    );
    setQueuedFiles([]);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment?.assignment?.uuid || !selectedAssignment.classMeta.enrollmentUuid) {
      toast.error('This assignment is missing an active student enrollment.');
      return;
    }

    if (!submissionText.trim() && queuedFiles.length === 0) {
      toast.error('Add a written response or at least one attachment before submitting.');
      return;
    }

    try {
      const response = await submitAssignmentMut.mutateAsync({
        path: { assignmentUuid: selectedAssignment.assignment.uuid },
        query: {
          content: submissionText.trim() || undefined,
          enrollmentUuid: selectedAssignment.classMeta.enrollmentUuid,
        },
      });

      const submissionUuid = response.data?.uuid;
      if (!submissionUuid) {
        throw new Error('Submission was created without an identifier.');
      }

      for (const file of queuedFiles) {
        await uploadSubmissionAttachmentMut.mutateAsync({
          body: { file },
          path: {
            assignmentUuid: selectedAssignment.assignment.uuid,
            submissionUuid,
          },
        });
      }

      await queryClient.invalidateQueries({
        queryKey: getAssignmentSubmissionsQueryKey({
          path: { assignmentUuid: selectedAssignment.assignment.uuid },
        }),
      });

      toast.success('Assignment submitted successfully.');
      handleCloseSheet(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to submit this assignment right now.'));
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-32 rounded-[24px]' />
          ))}
        </div>
        <Skeleton className='h-16 rounded-[24px]' />
        <div className='grid gap-4'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-52 rounded-[28px]' />
          ))}
        </div>
      </div>
    );
  }

  if (assignmentRows.length === 0) {
    return (
      <div className={getEmptyStateClasses()}>
        <BookOpen className='text-primary/70 h-10 w-10' />
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>No assignments available yet</h3>
          <p className='text-muted-foreground max-w-lg text-sm'>
            Pending assignments will appear here once your enrolled classes have active assessment
            schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {[
            {
              helper: 'Across your current classes',
              icon: BookOpen,
              label: 'Assignments',
              value: stats.total,
            },
            {
              helper: 'Need attention',
              icon: Clock3,
              label: 'Pending',
              value: stats.pending,
            },
            {
              helper: 'Awaiting review or revision',
              icon: Send,
              label: 'Submitted',
              value: stats.submitted + stats.returned,
            },
            {
              helper: stats.graded > 0 ? 'From graded work only' : 'No graded work yet',
              icon: GraduationCap,
              label: 'Average score',
              value: `${stats.averageScore}%`,
            },
          ].map(metric => (
            <Card key={metric.label} className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-4'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <metric.icon className='h-5 w-5' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-muted-foreground text-sm'>{metric.label}</p>
                    <p className='text-foreground text-2xl font-semibold'>{metric.value}</p>
                    <p className='text-muted-foreground text-xs'>{metric.helper}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className={cx(getCardClasses(), 'p-0')}>
          <CardContent className='space-y-4 p-5 sm:p-6'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
              <div className='space-y-2'>
                <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary'>
                  <Sparkles className='mr-1 h-3.5 w-3.5' />
                  Submission progress
                </Badge>
                <div>
                  <p className='text-foreground text-lg font-semibold'>
                    {stats.progress}% of assigned work has a submission trail
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Returned work is counted so you can track resubmissions that still need action.
                  </p>
                </div>
              </div>

              <div className='flex w-full flex-col gap-3 sm:flex-row lg:w-auto'>
                <div className='relative min-w-0 flex-1 sm:w-[280px]'>
                  <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    className='pl-9'
                    onChange={event => setSearchValue(event.target.value)}
                    placeholder='Search by assignment, class, or course'
                    value={searchValue}
                  />
                  {searchValue ? (
                    <button
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition'
                      onClick={() => setSearchValue('')}
                      type='button'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  ) : null}
                </div>

                <Tabs onValueChange={value => setSortBy(value as SortKey)} value={sortBy}>
                  <TabsList className='grid w-full grid-cols-3 sm:w-[280px]'>
                    <TabsTrigger value='due'>Due date</TabsTrigger>
                    <TabsTrigger value='course'>Course</TabsTrigger>
                    <TabsTrigger value='title'>Title</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Progress value={stats.progress} className='h-2.5' />

            <Tabs onValueChange={value => setActiveTab(value as FilterTab)} value={activeTab}>
              <TabsList className='grid w-full grid-cols-2 gap-2 sm:grid-cols-5'>
                <TabsTrigger value='all'>All ({stats.total})</TabsTrigger>
                <TabsTrigger value='pending'>Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value='submitted'>Submitted ({stats.submitted})</TabsTrigger>
                <TabsTrigger value='graded'>Graded ({stats.graded})</TabsTrigger>
                <TabsTrigger value='returned'>Returned ({stats.returned})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {processedRows.length === 0 ? (
          <div className={cx(getEmptyStateClasses(), 'min-h-[260px]')}>
            <AlertCircle className='text-primary/70 h-10 w-10' />
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>No assignments match this filter</h3>
              <p className='text-muted-foreground max-w-lg text-sm'>
                Adjust the active tab or search term to review your pending and completed work.
              </p>
            </div>
          </div>
        ) : (
          <div className='grid gap-4'>
            {processedRows.map(row => {
              const dueSummary = getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date);
              const status = getStudentAssignmentSubmissionState(row);
              const percentage = row.latestSubmission?.percentage;

              return (
                <Card
                  key={`${row.classMeta.classUuid}-${row.schedule?.uuid ?? row.assignment?.uuid}`}
                  className={cx(getCardClasses(), 'p-0 hover:-translate-y-0.5')}
                >
                  <CardContent className='space-y-5 p-5 sm:p-6'>
                    <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                      <div className='space-y-3'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline' className='border-border/70 bg-muted/40'>
                            {row.classMeta.courseTitle}
                          </Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge className={dueSummary.badgeClassName} variant='outline'>
                            <CalendarDays className='mr-1 h-3.5 w-3.5' />
                            {dueSummary.label}
                          </Badge>
                        </div>

                        <div>
                          <h3 className='text-foreground text-xl font-semibold'>
                            {row.assignment?.title || 'Untitled assignment'}
                          </h3>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            {row.classMeta.classTitle} • Due{' '}
                            {formatDate(row.schedule?.due_at || row.assignment?.due_date)}
                          </p>
                        </div>

                        {row.assignment?.description ? (
                          <div className='text-muted-foreground max-w-3xl text-sm [&_p]:leading-6'>
                            <RichTextRenderer
                              htmlString={row.assignment.description}
                              maxChars={220}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className='grid gap-3 sm:grid-cols-3 xl:w-[360px]'>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Points
                          </p>
                          <p className='text-foreground mt-1 text-lg font-semibold'>
                            {row.assignment?.points_display ||
                              row.assignment?.max_points ||
                              'Not set'}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Resources
                          </p>
                          <p className='text-foreground mt-1 text-lg font-semibold'>
                            {row.attachments.length}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Score
                          </p>
                          <p className={cx('mt-1 text-lg font-semibold', getGradeTone(percentage))}>
                            {percentage == null ? 'Pending' : `${Math.round(percentage)}%`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='space-y-1'>
                        <p className='text-foreground text-sm font-medium'>{status.helper}</p>
                        <p className='text-muted-foreground text-xs'>
                          {row.latestSubmission?.submitted_at
                            ? `Last activity: ${formatDate(row.latestSubmission.submitted_at)}`
                            : `Visible from ${formatShortDate(row.schedule?.visible_at)}`}
                        </p>
                      </div>
                      <Button
                        className='rounded-full sm:min-w-[160px]'
                        onClick={() => handleOpenAssignment(row)}
                      >
                        {!row.latestSubmission ? 'Submit assignment' : 'Open details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Sheet onOpenChange={handleCloseSheet} open={!!selectedAssignment}>
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-full lg:max-w-[960px]'>
          <div className='space-y-6 p-5 sm:p-6'>
            <SheetHeader className='border-border/60 space-y-3 border-b px-0 pb-5'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary'>
                  {selectedAssignment?.classMeta.courseTitle}
                </Badge>
                {selectedStatus ? (
                  <Badge variant={selectedStatus.variant}>{selectedStatus.label}</Badge>
                ) : null}
              </div>
              <SheetTitle className='text-2xl'>
                {selectedAssignment?.assignment?.title || 'Assignment details'}
              </SheetTitle>
              <SheetDescription>
                {selectedAssignment?.classMeta.classTitle} • Due{' '}
                {formatDate(
                  selectedAssignment?.schedule?.due_at || selectedAssignment?.assignment?.due_date
                )}
              </SheetDescription>
            </SheetHeader>

            {!selectedAssignment ? null : (
              <div className='space-y-6'>
                <div className='grid gap-4 lg:grid-cols-[1.4fr_0.8fr]'>
                  <Card className='border-border/60'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>Assignment brief</CardTitle>
                    </CardHeader>
                    <CardContent className='text-muted-foreground space-y-4 text-sm'>
                      {selectedAssignment.assignment?.description ? (
                        <div className='space-y-2'>
                          <p className='text-foreground font-medium'>Description</p>
                          <div className='space-y-2 [&_p]:leading-6'>
                            <RichTextRenderer
                              htmlString={selectedAssignment.assignment.description}
                            />
                          </div>
                        </div>
                      ) : null}
                      {selectedAssignment.assignment?.instructions ? (
                        <div className='space-y-2'>
                          <p className='text-foreground font-medium'>Instructions</p>
                          <div className='space-y-2 [&_p]:leading-6'>
                            <RichTextRenderer
                              htmlString={selectedAssignment.assignment.instructions}
                            />
                          </div>
                        </div>
                      ) : (
                        <p>No extra instructions were provided for this assignment.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className='border-border/60'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>Assignment summary</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Points
                          </p>
                          <p className='text-foreground mt-1 text-base font-semibold'>
                            {selectedAssignment.assignment?.points_display ||
                              selectedAssignment.assignment?.max_points ||
                              'Not set'}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Attempts
                          </p>
                          <p className='text-foreground mt-1 text-base font-semibold'>
                            {selectedAssignment.submissions.length}
                          </p>
                        </div>
                      </div>

                      <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Accepted formats
                        </p>
                        <p className='text-foreground mt-1 text-sm'>
                          {selectedSubmissionTypes.length > 0
                            ? selectedSubmissionTypes.join(', ')
                            : 'Text or instructor-defined format'}
                        </p>
                      </div>

                      <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Due date
                        </p>
                        <p className='text-foreground mt-1 text-sm'>
                          {formatDate(
                            selectedAssignment.schedule?.due_at ||
                              selectedAssignment.assignment?.due_date
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className='border-border/60'>
                  <CardHeader className='pb-3'>
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

                {selectedAssignment.latestSubmission ? (
                  <Card className='border-border/60'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-base'>Latest submission</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid gap-3 md:grid-cols-3'>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Submitted
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {formatDate(selectedAssignment.latestSubmission.submitted_at)}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Status
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {selectedAssignment.latestSubmission.submission_status_display ||
                              selectedAssignment.latestSubmission.status}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Score
                          </p>
                          <p
                            className={cx(
                              'mt-1 text-sm font-semibold',
                              getGradeTone(selectedAssignment.latestSubmission.percentage)
                            )}
                          >
                            {selectedAssignment.latestSubmission.percentage == null
                              ? 'Pending'
                              : selectedAssignment.latestSubmission.grade_display ||
                                `${Math.round(selectedAssignment.latestSubmission.percentage)}%`}
                          </p>
                        </div>
                      </div>

                      {selectedAssignment.latestSubmission.submission_text ? (
                        <div className='space-y-2'>
                          <p className='text-foreground text-sm font-medium'>
                            Your written response
                          </p>
                          <div className='border-border/60 bg-background/70 text-muted-foreground rounded-2xl border p-4 text-sm [&_p]:leading-6'>
                            <RichTextRenderer
                              htmlString={selectedAssignment.latestSubmission.submission_text}
                            />
                          </div>
                        </div>
                      ) : null}

                      {selectedAssignment.latestSubmission.instructor_comments ? (
                        <div className='space-y-2'>
                          <p className='text-foreground text-sm font-medium'>Instructor feedback</p>
                          <div className='border-warning/20 bg-warning/10 text-foreground rounded-2xl border p-4 text-sm'>
                            {selectedAssignment.latestSubmission.instructor_comments}
                          </div>
                        </div>
                      ) : null}

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
                              (selectedSubmissionAttachmentsQuery.data?.data ??
                                []) as AssignmentSubmissionAttachment[]
                            )}
                            emptyMessage='No files were uploaded with the latest submission.'
                            previewLabel='Read file'
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className='border-border/60'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>
                      {selectedAssignment.latestSubmission?.status === 'RETURNED'
                        ? 'Revise and resubmit'
                        : 'Submit your work'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <label
                        className='text-foreground text-sm font-medium'
                        htmlFor='submission-text'
                      >
                        Written response
                      </label>
                      <Textarea
                        className='min-h-32'
                        disabled={!canSubmitSelected || isSubmitting}
                        id='submission-text'
                        onChange={event => setSubmissionText(event.target.value)}
                        placeholder='Paste your answer, notes, or submission links here.'
                        value={submissionText}
                      />
                    </div>

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
                          !canUploadFiles || !canSubmitSelected || isSubmitting
                            ? 'pointer-events-none opacity-60'
                            : ''
                        )}
                        multiple
                        onFilesAdded={handleFilesAdded}
                      >
                        <div className='flex flex-col items-center gap-2 text-center'>
                          <Upload className='text-primary h-5 w-5' />
                          <div>
                            <p className='text-foreground text-sm font-medium'>
                              Drop files here or click to browse
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              Documents and supporting media upload right after the submission
                              record is created.
                            </p>
                          </div>
                        </div>
                      </DragDropUpload>

                      {queuedFiles.length > 0 ? (
                        <div className='space-y-2'>
                          {queuedFiles.map(file => (
                            <div
                              key={`${file.name}-${file.size}`}
                              className='border-border/60 bg-background/70 flex items-center justify-between gap-3 rounded-2xl border p-3'
                            >
                              <div className='min-w-0'>
                                <p className='text-foreground truncate text-sm font-medium'>
                                  {file.name}
                                </p>
                                <p className='text-muted-foreground text-xs'>
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                disabled={isSubmitting}
                                onClick={() => handleRemoveFile(file)}
                                size='icon'
                                type='button'
                                variant='ghost'
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='text-muted-foreground text-xs'>
                        {!selectedAssignment.classMeta.enrollmentUuid
                          ? 'Submission is unavailable until this class has an active enrollment record.'
                          : canSubmitSelected
                            ? 'Your submission will be saved immediately and any queued files will upload right after.'
                            : 'This assignment already has a live submission state. Wait for a returned draft to resubmit.'}
                      </div>
                      <Button
                        className='rounded-full'
                        disabled={!canSubmitSelected || isSubmitting}
                        onClick={handleSubmitAssignment}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Submitting
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className='mr-2 h-4 w-4' />
                            {selectedAssignment.latestSubmission?.status === 'RETURNED'
                              ? 'Resubmit assignment'
                              : 'Submit assignment'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
