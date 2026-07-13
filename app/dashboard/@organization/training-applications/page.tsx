'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { formatCurrency } from '@/lib/format-currency';
import type { CourseTrainingApplication } from '@/services/client';
import {
  decideOnTrainingApplicationMutation,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { AdminPageHeader, StatCard, StatCardSkeleton, StatusBadge } from '../_components/ui';

type ReviewAction = 'APPROVE' | 'REJECT' | 'REVOKE';

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: string };
    if (typeof maybeError.message === 'string' && maybeError.message) {
      return maybeError.message;
    }
  }

  return fallback;
}

function formatLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    date
  );
}

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

export default function TrainingApplicationsPage() {
  const router = useRouter();
  const courseCreator = useOptionalCourseCreator();
  const organisation = useOrganisation();
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('ALL');
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    application: CourseTrainingApplication | null;
    action: ReviewAction | null;
  }>({
    open: false,
    application: null,
    action: null,
  });
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          course_creator_uuid: courseCreator?.profile?.uuid || organisation?.uuid || '',
          ...(statusFilter !== 'ALL' ? { status_eq: statusFilter } : {}),
          ...(applicantTypeFilter !== 'ALL' ? { applicant_type_eq: applicantTypeFilter } : {}),
        },
        pageable: {
          page,
          size: pageSize,
        },
      },
    }),
    enabled: !!(courseCreator?.profile?.uuid || organisation?.uuid),
  });

  const decideMutation = useMutation(decideOnTrainingApplicationMutation());

  const applications: CourseTrainingApplication[] = data?.data?.content ?? [];
  const totalApplications = Number(data?.data?.metadata?.totalElements ?? 0);
  const totalPages = Math.ceil(totalApplications / pageSize);

  const courseIds = useMemo(
    () => [...new Set(applications.map(app => app.course_uuid ?? '').filter(Boolean))],
    [applications]
  );
  const instructorIds = useMemo(
    () =>
      applications
        .filter(app => app.applicant_type === 'instructor')
        .map(app => app.applicant_uuid ?? '')
        .filter(Boolean),
    [applications]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorIds);

  const getCourseName = (application: CourseTrainingApplication) =>
    (application.course_uuid ? courseMap[application.course_uuid]?.name : undefined) ??
    `Course ${shortId(application.course_uuid)}`;

  const getApplicantName = (application: CourseTrainingApplication) => {
    if (application.applicant_type === 'instructor') {
      return (
        (application.applicant_uuid
          ? instructorMap[application.applicant_uuid]?.full_name
          : undefined) ?? `Instructor ${shortId(application.applicant_uuid)}`
      );
    }
    return `Organisation ${shortId(application.applicant_uuid)}`;
  };

  // Filter by search query (client-side)
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      getCourseName(app).toLowerCase().includes(searchLower) ||
      getApplicantName(app).toLowerCase().includes(searchLower) ||
      app.application_notes?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    total: totalApplications,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    instructors: new Set(
      applications
        .filter(app => app.applicant_type === 'instructor')
        .map(app => app.applicant_uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
    ).size,
  };

  const handleReview = (application: CourseTrainingApplication, action: ReviewAction) => {
    setReviewDialog({ open: true, application, action });
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog.application || !reviewDialog.action) return;
    if (!reviewDialog.application.course_uuid || !reviewDialog.application.uuid) {
      toast.error('This application is missing its course or identifier and cannot be reviewed.');
      return;
    }

    try {
      await decideMutation.mutateAsync({
        path: {
          courseUuid: reviewDialog.application.course_uuid,
          applicationUuid: reviewDialog.application.uuid,
        },
        query: {
          action: reviewDialog.action,
        },
        body: {
          review_notes: reviewNotes,
        },
      });

      toast.success(`Application ${reviewDialog.action.toLowerCase()}d successfully`);
      setReviewDialog({ open: false, application: null, action: null });
      setReviewNotes('');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to process application'));
    }
  };

  const initialLoading = isLoading && !data;

  return (
    <div className='space-y-6 p-6'>
      <AdminPageHeader
        title='Training Applications'
        description='Review and manage applications to train your courses'
      />

      {/* Stats Cards — degrade independently */}
      <div className='grid gap-4 sm:grid-cols-4'>
        {initialLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label='Total Applications' value={stats.total} icon={FileText} tone='info' />
            <StatCard label='Pending Review' value={stats.pending} icon={Clock} tone='warning' />
            <StatCard label='Approved' value={stats.approved} icon={CheckCircle2} tone='success' />
            <StatCard label='Unique Trainers' value={stats.instructors} icon={User} tone='neutral' />
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search by course name, applicant...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-[160px]'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All statuses</SelectItem>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='APPROVED'>Approved</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={applicantTypeFilter} onValueChange={setApplicantTypeFilter}>
              <SelectTrigger className='w-full sm:w-[160px]'>
                <SelectValue placeholder='All types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All types</SelectItem>
                <SelectItem value='instructor'>Instructors</SelectItem>
                <SelectItem value='organisation'>Organizations</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications — degrade independently (skeleton / error / empty are local) */}
      <AsyncSection
        loading={initialLoading}
        error={isError ? error : undefined}
        empty={filteredApplications.length === 0}
        onRetry={refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-52 rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <Card>
            <CardContent className='flex min-h-[300px] flex-col items-center justify-center py-12'>
              <FileText className='text-muted-foreground mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>No Applications Found</h3>
              <p className='text-muted-foreground text-center text-sm'>
                {statusFilter !== 'ALL' || searchQuery || applicantTypeFilter !== 'ALL'
                  ? 'Try adjusting your filters or search query'
                  : 'No training applications have been submitted yet'}
              </p>
            </CardContent>
          </Card>
        }
      >
        <>
          <div className='space-y-3'>
            {filteredApplications.map(application => {
              const isInstructor = application.applicant_type === 'instructor';
              const instructor =
                isInstructor && application.applicant_uuid
                  ? instructorMap[application.applicant_uuid]
                  : null;
              const applicantName = getApplicantName(application);
              const courseName = getCourseName(application);
              const initials =
                applicantName
                  .split(/\s+/)
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '?';
              const isVerified = instructor?.admin_verified;
              const rateCard = application.rate_card;

              return (
                <div
                  key={application.uuid}
                  className='rounded-md border border-border/70 bg-card p-5 shadow-sm'
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                      <div className='flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-semibold text-primary'>
                        {isInstructor ? initials : <Building2 className='size-5' />}
                      </div>
                      <div className='space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h3 className='text-base font-semibold tracking-tight'>
                            {applicantName}
                          </h3>
                          {isInstructor && isVerified ? (
                            <StatusBadge status='verified' label='Verified' />
                          ) : isInstructor && isVerified === false ? (
                            <StatusBadge status='pending' label='Unverified' />
                          ) : null}
                          <Badge variant='outline' className='rounded-md'>
                            {isInstructor ? 'Instructor' : 'Organisation'}
                          </Badge>
                        </div>
                        <div className='flex flex-col gap-1 text-sm text-muted-foreground'>
                          <span>Applying to train: {courseName}</span>
                          {isInstructor && instructor?.professional_headline ? (
                            <span>{instructor.professional_headline}</span>
                          ) : null}
                          {isInstructor && !instructor && isInstructorsLoading ? (
                            <span>Loading instructor profile...</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <StatusBadge
                      status={application.status}
                      label={formatLabel(application.status)}
                    />
                  </div>

                  {rateCard ? (
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
                      <Badge variant='outline' className='rounded-md'>
                        Private online: {formatCurrency(rateCard.private_online_rate, rateCard.currency || 'KES')}
                      </Badge>
                      <Badge variant='outline' className='rounded-md'>
                        Private in-person: {formatCurrency(rateCard.private_inperson_rate, rateCard.currency || 'KES')}
                      </Badge>
                      <Badge variant='outline' className='rounded-md'>
                        Group online: {formatCurrency(rateCard.group_online_rate, rateCard.currency || 'KES')}
                      </Badge>
                      <Badge variant='outline' className='rounded-md'>
                        Group in-person: {formatCurrency(rateCard.group_inperson_rate, rateCard.currency || 'KES')}
                      </Badge>
                    </div>
                  ) : null}

                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    <div className='rounded-md border border-border/60 bg-muted/20 p-3'>
                      <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                        Application note
                      </div>
                      <p className='mt-1 text-sm leading-6 text-foreground'>
                        {application.application_notes || 'No application note provided.'}
                      </p>
                    </div>
                    <div className='rounded-md border border-border/60 bg-muted/20 p-3'>
                      <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                        Review notes
                      </div>
                      <p className='mt-1 text-sm leading-6 text-foreground'>
                        {application.review_notes || 'No review notes yet.'}
                      </p>
                    </div>
                  </div>

                  <div className='mt-4 flex flex-wrap items-center gap-2'>
                    <div className='flex flex-wrap gap-2'>
                      <Badge variant='outline' className='rounded-md'>
                        Applied {formatDate(application.created_date)}
                      </Badge>
                      {application.reviewed_at ? (
                        <Badge variant='outline' className='rounded-md'>
                          Reviewed {formatDate(application.reviewed_at)}
                        </Badge>
                      ) : null}
                    </div>

                    <div className='ml-auto flex flex-wrap gap-2'>
                      {isInstructor && application.uuid ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            router.push(`/dashboard/training-applications/${application.uuid}`)
                          }
                        >
                          <UserRound className='mr-2 size-4' />
                          View profile
                        </Button>
                      ) : null}
                      {application.status === 'pending' ? (
                        <>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleReview(application, 'APPROVE')}
                            disabled={decideMutation.isPending}
                          >
                            <ThumbsUp className='mr-2 size-4' />
                            Approve
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleReview(application, 'REJECT')}
                            disabled={decideMutation.isPending}
                          >
                            <ThumbsDown className='mr-2 size-4' />
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {application.status === 'approved' ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleReview(application, 'REVOKE')}
                          disabled={decideMutation.isPending}
                        >
                          <XCircle className='mr-2 size-4' />
                          Revoke approval
                        </Button>
                      ) : null}
                      {application.status === 'rejected' ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleReview(application, 'APPROVE')}
                          disabled={decideMutation.isPending}
                        >
                          <CheckCircle2 className='mr-2 size-4' />
                          Reconsider
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className='py-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-muted-foreground text-sm'>
                    Showing {page * pageSize + 1}-
                    {Math.min((page + 1) * pageSize, totalApplications)} of {totalApplications}{' '}
                    applications
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      </AsyncSection>

      {/* Review Sheet */}
      <Sheet
        open={reviewDialog.open}
        onOpenChange={open =>
          !open && setReviewDialog({ open: false, application: null, action: null })
        }
      >
        <SheetContent
          side='right'
          className='flex w-[min(98vw,480px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
        >
          <div className='space-y-6 p-3 sm:p-6'>
            <SheetHeader className='space-y-3 pr-10 text-left'>
              <SheetTitle>
                {reviewDialog.action === 'APPROVE' && 'Approve Application'}
                {reviewDialog.action === 'REJECT' && 'Reject Application'}
                {reviewDialog.action === 'REVOKE' && 'Revoke Approval'}
              </SheetTitle>
              <SheetDescription>
                {reviewDialog.action === 'APPROVE' &&
                  'Approve this training application to allow the applicant to train this course.'}
                {reviewDialog.action === 'REJECT' &&
                  'Reject this training application with optional feedback.'}
                {reviewDialog.action === 'REVOKE' &&
                  'Revoke the approval for this training application.'}
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-4'>
              <div className='bg-muted/20 rounded-lg border p-4'>
                <div className='space-y-2 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Course:</span>
                    <p className='font-medium'>
                      {reviewDialog.application ? getCourseName(reviewDialog.application) : ''}
                    </p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Applicant:</span>
                    <p className='font-medium'>
                      {reviewDialog.application ? getApplicantName(reviewDialog.application) : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Review Notes {reviewDialog.action === 'REJECT' && '(recommended)'}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewDialog.action === 'APPROVE'
                      ? 'Add any notes or instructions for the approved trainer...'
                      : reviewDialog.action === 'REJECT'
                        ? 'Provide feedback on why this application was rejected...'
                        : 'Explain why the approval is being revoked...'
                  }
                  rows={4}
                />
              </div>
            </div>

            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setReviewDialog({ open: false, application: null, action: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                variant={
                  reviewDialog.action === 'REJECT' || reviewDialog.action === 'REVOKE'
                    ? 'destructive'
                    : 'default'
                }
                disabled={decideMutation.isPending}
              >
                {decideMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewDialog.action === 'APPROVE' && 'Approve Application'}
                    {reviewDialog.action === 'REJECT' && 'Reject Application'}
                    {reviewDialog.action === 'REVOKE' && 'Revoke Approval'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
