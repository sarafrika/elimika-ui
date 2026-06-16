'use client';

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
import { useStudent } from '@/context/student-context';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getAssignmentSubmissionsQueryKey,
  getSubmissionAttachmentsOptions,
  searchSubmissionsOptions,
  submitAssignmentQueryMutation,
  uploadSubmissionAttachmentMutation
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmissionAttachment } from '@/services/client/types.gen';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import {
  getDueSummary,
  getStudentAssignmentSubmissionState,
  useStudentAssignmentData,
  type StudentAssignmentFilterTab,
  type StudentAssignmentRow,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('due');
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentRow | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const { assignmentRows, isLoading } = useStudentAssignmentData();

  const currentEnrollment = useMemo(
    () =>
      assignmentRows.find(
        row =>
          row.classMeta.courseEnrollmentUuid ||
          row.classMeta.enrollmentUuid
      )?.classMeta,
    [assignmentRows]
  );

  const enrollmentUuid =
    currentEnrollment?.courseEnrollmentUuid ??
    currentEnrollment?.enrollmentUuid;

  const studentAssignmentRows = useMemo(
    () =>
      assignmentRows.filter(row => {
        const rowEnrollment =
          row.classMeta.courseEnrollmentUuid ??
          row.classMeta.enrollmentUuid;

        return rowEnrollment === enrollmentUuid;
      }),
    [assignmentRows, enrollmentUuid]
  );

  const { data: submissionsResp } = useQuery({
    ...searchSubmissionsOptions({
      query: {
        pageable: {
          page: 0,
          size: 1000,
        },
        searchParams: {
          enrollment_uuid_eq: enrollmentUuid,
        },
      },
    }),
    enabled: !!enrollmentUuid,
  });

  const activeEnrollmentUuid =
    selectedAssignment?.classMeta
      .courseEnrollmentUuid ??
    selectedAssignment?.classMeta
      .enrollmentUuid;



  const submissionsByAssignment = useMemo(() => {
    const submissions = submissionsResp?.data?.content ?? [];

    return submissions.reduce(
      (acc, submission) => {
        if (submission.assignment_uuid) {
          acc[submission.assignment_uuid] = submission;
        }

        return acc;
      },
      {} as Record<string, (typeof submissions)[number]>
    );
  }, [submissionsResp]);


  const submittedAssignmentIds = useMemo(() => {
    const submissions = submissionsResp?.data?.content ?? [];

    return new Set(
      submissions
        .map(submission => submission.assignment_uuid)
        .filter(Boolean)
    );
  }, [submissionsResp]);

  const assignmentRowsWithSubmissionState = useMemo(() => {
    return studentAssignmentRows.map(row => {
      const assignmentUuid = row.assignment?.uuid ?? '';

      const submission =
        submissionsByAssignment[assignmentUuid];

      return {
        ...row,

        submissions: submission ? [submission] : [],

        latestSubmission: submission ?? null,

        hasSubmission: !!submission,
      };
    });
  }, [
    studentAssignmentRows,
    submissionsByAssignment,
  ]);

  const processedRows = useMemo(() => {
    return assignmentRowsWithSubmissionState
      .filter(row => {
        let matchesTab = true;

        const state = getStudentAssignmentSubmissionState(row);

        switch (activeTab) {
          case 'submitted':
          case 'graded':
          case 'returned':
          case 'pending':
            matchesTab = state.key === activeTab;
            break;
          default:
            matchesTab = true;
        }

        const matchesSearch =
          !searchValue.trim() ||
          [
            row.assignment?.title,
            row.assignment?.description,
            row.classMeta.courseTitle,
            row.classMeta.classTitle,
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLowerCase()
                .includes(searchValue.toLowerCase())
            );

        return matchesTab && matchesSearch;
      })
      .sort(/* existing sort */);
  }, [
    activeTab,
    assignmentRowsWithSubmissionState,
    searchValue,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const total = studentAssignmentRows.length;

    const submitted = studentAssignmentRows.filter(row =>
      submittedAssignmentIds.has(row.assignment?.uuid ?? '')
    ).length;

    const pending = total - submitted;

    const graded = studentAssignmentRows.filter(
      row =>
        row.latestSubmission &&
        row.latestSubmission.percentage != null
    ).length;

    const returned = studentAssignmentRows.filter(
      row =>
        String(row.latestSubmission?.status).toUpperCase() ===
        'RETURNED'
    ).length;

    const gradedSubmissions = studentAssignmentRows
      .map(row => row.latestSubmission?.percentage)
      .filter(
        (value): value is number =>
          typeof value === 'number'
      );


    const averageScore =
      gradedSubmissions.length > 0
        ? Math.round(
          gradedSubmissions.reduce(
            (sum, value) => sum + value,
            0
          ) / gradedSubmissions.length
        )
        : 0;

    const progress =
      total > 0
        ? Math.round((submitted / total) * 100)
        : 0;

    return {
      total,
      pending,
      submitted,
      graded,
      returned,
      averageScore,
      progress,
    };
  }, [studentAssignmentRows, submittedAssignmentIds]);

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

  const submitAssignmentMut = useMutation(submitAssignmentQueryMutation());
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
    !!activeEnrollmentUuid &&
    (
      !selectedAssignment?.latestSubmission ||
      ['RETURNED', 'DRAFT'].includes(
        String(
          selectedAssignment.latestSubmission.status
        ).toUpperCase()
      )
    );

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

  const handleOpenAssignment = (row: StudentAssignmentRow) => {
    setSelectedAssignment(row);
    setSubmissionText(
      row.latestSubmission?.status === 'RETURNED' ? row.latestSubmission?.submission_text || '' : ''
    );
    setQueuedFiles([]);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment?.assignment?.uuid) {
      toast.error('This assignment is missing an active assignment record.');
      return;
    }

    const enrollmentUuid =
      selectedAssignment.classMeta.courseEnrollmentUuid ??
      selectedAssignment.classMeta.enrollmentUuid;

    if (!enrollmentUuid) {
      toast.error('This assignment is missing an active student enrollment.');
      return;
    }

    const submissionContent = submissionText.trim();

    if (!submissionContent && queuedFiles.length === 0) {
      toast.error(
        'Add a written response or at least one attachment before submitting.'
      );
      return;
    }

    try {
      const response = await submitAssignmentMut.mutateAsync({
        path: {
          assignmentUuid: selectedAssignment.assignment.uuid,
        },
        body: {
          enrollment_uuid: enrollmentUuid,
          student_uuid: selectedAssignment.classMeta.studentUuid,
          submission_text: submissionContent,
        },
        query: {
          enrollmentUuid: enrollmentUuid,
          content: submissionContent,
          enrollment_uuid: enrollmentUuid,
        }
      });

      const submissionUuid = response.data?.uuid;

      if (!submissionUuid) {
        throw new Error('Submission was created without an identifier.');
      }

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
            path: {
              assignmentUuid: selectedAssignment.assignment.uuid,
            },
          }),
        }),

        queryClient.invalidateQueries({
          queryKey: ['student-assignments'],
        }),
      ]);

      toast.success('Assignment submitted successfully.');
      handleCloseSheet(false);
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Unable to submit this assignment right now.')
      );
    }
  };

  const hasSubmission =
    !!selectedAssignment?.latestSubmission;

  const canResubmit =
    selectedAssignment?.latestSubmission?.status === 'RETURNED';

  const showSubmissionForm =
    !hasSubmission || canResubmit;

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

  if (studentAssignmentRows.length === 0) {
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

        <Card className={cx(getCardClasses(), 'overflow-hidden p-0')}>
          <CardContent className='space-y-4 p-4 sm:p-6'>
            <div className='flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
              <div className='min-w-0 space-y-2'>
                <Badge
                  variant='outline'
                  className='border-primary/20 bg-primary/10 text-primary w-fit'
                >
                  <Sparkles className='mr-1 h-3.5 w-3.5' />
                  Submission progress
                </Badge>

                <div className='min-w-0'>
                  <p className='text-foreground break-words text-lg font-semibold'>
                    {stats.progress}% of assigned work has a submission trail
                  </p>

                  <p className='text-muted-foreground text-sm'>
                    Returned work is counted so you can track resubmissions that still
                    need action.
                  </p>
                </div>
              </div>

              <div className='flex min-w-0 w-full flex-col gap-3 lg:w-auto lg:min-w-[520px] lg:flex-row'>
                <div className='relative min-w-0 flex-1'>
                  <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />

                  <Input
                    className='w-full pl-9 text-sm'
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

                <Tabs
                  onValueChange={value => setSortBy(value as SortKey)}
                  value={sortBy}
                  className='min-w-0'
                >
                  <TabsList className='grid w-full grid-cols-3 lg:w-[280px]'>
                    <TabsTrigger value='due'>Due date</TabsTrigger>
                    <TabsTrigger value='course'>Course</TabsTrigger>
                    <TabsTrigger value='title'>Title</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Progress value={stats.progress} className='h-2.5' />

            <Tabs
              onValueChange={value => setActiveTab(value as FilterTab)}
              value={activeTab}
              className='min-w-0'
            >
              <div className='overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent'>
                <TabsList className='inline-flex min-w-max gap-2'>
                  <TabsTrigger value='all'>All ({stats.total})</TabsTrigger>
                  <TabsTrigger value='pending'>
                    Pending ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value='submitted'>
                    Submitted ({stats.submitted})
                  </TabsTrigger>
                  <TabsTrigger value='graded'>
                    Graded ({stats.graded})
                  </TabsTrigger>
                  <TabsTrigger value='returned'>
                    Returned ({stats.returned})
                  </TabsTrigger>
                </TabsList>
              </div>
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
          <div className='grid gap-4 lg:grid-cols-2'>
            {processedRows.map(row => {
              const dueSummary = getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date);
              const status = row.hasSubmission
                ? {
                  label: 'Submitted',
                  helper: 'You have submitted this assignment.',
                  variant: 'default' as const,
                }
                : getStudentAssignmentSubmissionState(row);
              const percentage = row.latestSubmission?.percentage;

              return (
                <Card
                  key={`${row.classMeta.classUuid}-${row.schedule?.uuid ?? row.assignment?.uuid}`}
                  className={cx(getCardClasses(), 'p-0 hover:-translate-y-0.5')}
                >
                  <CardContent className='space-y-5 p-5 sm:p-6'>
                    <div className='flex flex-col gap-4 xl:items-start xl:justify-between'>
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

                      <div className='border-border/60 bg-background/50 flex items-center divide-x rounded-xl border text-sm'>
                        <div className='flex flex-1 flex-col px-3 py-2'>
                          <span className='text-muted-foreground text-[11px] uppercase'>
                            Points
                          </span>
                          <span className='text-foreground font-semibold'>
                            {row.assignment?.points_display ||
                              row.assignment?.max_points ||
                              'Not set'}
                          </span>
                        </div>

                        <div className='flex flex-1 flex-col px-3 py-2'>
                          <span className='text-muted-foreground text-[11px] uppercase'>
                            Resources
                          </span>
                          <span className='text-foreground font-semibold'>
                            {row.attachments.length}
                          </span>
                        </div>

                        <div className='flex flex-1 flex-col px-3 py-2'>
                          <span className='text-muted-foreground text-[11px] uppercase'>
                            Score
                          </span>
                          <span className={cx('font-semibold', getGradeTone(percentage))}>
                            {percentage == null ? 'Pending' : `${Math.round(percentage)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='space-y-1'>
                        <div className='flex flex-row items-center gap-2' >
                          <p className='text-foreground text-sm font-medium'>
                            {row.hasSubmission
                              ? 'Submission received.'
                              : status.helper}
                          </p>
                          <p className='text-foreground text-sm font-medium'>
                            {row.latestSubmission?.file_count_display}
                          </p>
                        </div>

                        <p className='text-muted-foreground text-xs'>
                          {row.hasSubmission
                            ? row.latestSubmission?.submitted_at
                              ? `Submitted: ${formatDate(
                                row.latestSubmission.submitted_at
                              )}`
                              : 'Submission available for review'
                            : `Visible from ${formatShortDate(
                              row.schedule?.visible_at
                            )}`}
                        </p>
                      </div>

                      <Button
                        className='rounded-full sm:min-w-[160px]'
                        onClick={() => handleOpenAssignment(row)}
                      >
                        {row.hasSubmission
                          ? 'Open submission'
                          : 'Submit assignment'}
                      </Button>
                    </div>

                    {row.hasSubmission && row.latestSubmission ? (
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs text-muted-foreground">
                          Submitted
                        </p>

                        <p className="text-sm font-medium">
                          {formatDate(
                            row.latestSubmission.submitted_at
                          )}
                        </p>

                        {row.latestSubmission.submission_status_display && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Status:{" "}
                            {
                              row.latestSubmission
                                .submission_status_display
                            }
                          </p>
                        )}
                      </div>
                    ) : null}
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

                <Card className='border-border/60 space-y-0'>
                  <CardHeader className=''>
                    <CardTitle className='text-base'>Resources from your instructor</CardTitle>
                  </CardHeader>
                  <CardContent >
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

                          <div className="space-y-2">
                            {(Array.isArray(selectedAssignment?.latestSubmission?.file_urls)
                              ? selectedAssignment.latestSubmission.file_urls
                              : []
                            ).map((url: string, index: number) => {
                              const name = url.split('/').pop();

                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2"
                                >
                                  <FileText className="h-4 w-4 text-muted-foreground" />

                                  <span className="text-sm text-foreground truncate">
                                    {name}
                                  </span>
                                </div>
                              );
                            })}
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
                      {showSubmissionForm
                        ? selectedAssignment?.latestSubmission?.status === 'RETURNED'
                          ? 'Revise and resubmit'
                          : 'Submit your work'
                        : 'Submission details'}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    {!showSubmissionForm ? (
                      <>
                        <div className='grid gap-3 md:grid-cols-3'>
                          <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                            <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                              Submitted
                            </p>
                            <p className='text-foreground mt-1 text-sm font-medium'>
                              {selectedAssignment?.latestSubmission?.submitted_at
                                ? formatDate(
                                  selectedAssignment.latestSubmission.submitted_at
                                )
                                : 'Submitted'}
                            </p>
                          </div>

                          <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                            <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                              Status
                            </p>
                            <p className='text-foreground mt-1 text-sm font-medium'>
                              {selectedAssignment?.latestSubmission
                                ?.submission_status_display ||
                                selectedAssignment?.latestSubmission?.status ||
                                'Submitted'}
                            </p>
                          </div>

                          <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                            <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                              Score
                            </p>
                            <p
                              className={cx(
                                'mt-1 text-sm font-semibold',
                                getGradeTone(
                                  selectedAssignment?.latestSubmission?.percentage
                                )
                              )}
                            >
                              {selectedAssignment?.latestSubmission?.percentage == null
                                ? 'Pending review'
                                : selectedAssignment?.latestSubmission?.grade_display ||
                                `${Math.round(
                                  selectedAssignment.latestSubmission.percentage
                                )}%`}
                            </p>
                          </div>
                        </div>

                        {selectedAssignment?.latestSubmission?.submission_text ? (
                          <div className='space-y-2'>
                            <p className='text-foreground text-sm font-medium'>
                              Submitted response
                            </p>

                            <div className='border-border/60 bg-background/70 rounded-2xl border p-4 text-sm'>
                              <RichTextRenderer
                                htmlString={
                                  selectedAssignment.latestSubmission.submission_text
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              {(Array.isArray(selectedAssignment?.latestSubmission?.file_urls)
                                ? selectedAssignment.latestSubmission.file_urls
                                : []
                              ).map((url: string, index: number) => {
                                const name = url.split('/').pop();

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground" />

                                    <span className="text-sm text-foreground truncate">
                                      {name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {selectedAssignment?.latestSubmission?.instructor_comments ? (
                          <div className='space-y-2'>
                            <p className='text-foreground text-sm font-medium'>
                              Instructor feedback
                            </p>

                            <div className='border-warning/20 bg-warning/10 rounded-2xl border p-4 text-sm'>
                              {selectedAssignment.latestSubmission.instructor_comments}
                            </div>
                          </div>
                        ) : null}

                        <div className='border-border/60 border-t pt-4'>
                          <p className='text-muted-foreground text-sm'>
                            Your submission has been received and is awaiting review.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
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
                            onChange={event =>
                              setSubmissionText(event.target.value)
                            }
                            placeholder='Paste your answer, notes, or submission links here.'
                            value={submissionText}
                          />
                        </div>

                        <div className='space-y-3'>
                          <div className='flex items-center justify-between gap-3'>
                            <div>
                              <p className='text-foreground text-sm font-medium'>
                                Attachments
                              </p>

                              <p className='text-muted-foreground text-xs'>
                                {canUploadFiles
                                  ? 'Accepted file uploads can be added before you submit.'
                                  : 'This assignment primarily expects text or link-based responses.'}
                              </p>
                            </div>

                            <Badge variant='outline'>
                              {queuedFiles.length} queued
                            </Badge>
                          </div>

                          <DragDropUpload
                            className={cx(
                              !canUploadFiles ||
                                !canSubmitSelected ||
                                isSubmitting
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
                                  Documents and supporting media upload right after
                                  the submission record is created.
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
                          )}
                        </div>

                        <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                          <div className='text-muted-foreground text-xs'>
                            {!(
                              selectedAssignment?.classMeta
                                ?.courseEnrollmentUuid ??
                              selectedAssignment?.classMeta
                                ?.enrollmentUuid
                            )
                              ? 'Submission is unavailable until this class has an active enrollment record.'
                              : canSubmitSelected
                                ? 'Your submission will be saved immediately and any queued files will upload right after.'
                                : 'This assignment already has a live submission state.'}
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
                                {selectedAssignment?.latestSubmission?.status ===
                                  'RETURNED'
                                  ? 'Resubmit assignment'
                                  : 'Submit assignment'}
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
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
