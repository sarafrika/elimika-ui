'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import type { CourseTrainingApplication } from '@/services/client';
import {
  decideOnTrainingApplicationMutation,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { AdminPageHeader, StatCard, StatCardSkeleton } from '../_components/ui';

type TrainingApplicationRow = CourseTrainingApplication & {
  course_name?: string;
  course_description?: string;
  applicant_name?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: string };
    if (typeof maybeError.message === 'string' && maybeError.message) {
      return maybeError.message;
    }
  }

  return fallback;
}

export default function TrainingApplicationsPage() {
  const courseCreator = useOptionalCourseCreator();
  const organisation = useOrganisation();
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('ALL');
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    application: TrainingApplicationRow | null;
    action: 'APPROVE' | 'REJECT' | 'REVOKE' | null;
  }>({
    open: false,
    application: null,
    action: null,
  });
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch applications for this course creator's courses
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

  const applications: TrainingApplicationRow[] = data?.data?.content ?? [];
  const totalApplications = Number(data?.data?.metadata?.totalElements ?? 0);
  const totalPages = Math.ceil(totalApplications / pageSize);

  // Filter by search query (client-side)
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      app.course_name?.toLowerCase().includes(searchLower) ||
      app.applicant_name?.toLowerCase().includes(searchLower) ||
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

  const handleReview = (application: TrainingApplicationRow, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
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

  const getStatusConfig = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pending Review',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-warning',
        };
      case 'approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle2,
          color: 'text-success',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-destructive',
        };
      default:
        return {
          label: status ?? 'Unknown',
          variant: 'outline' as const,
          icon: FileText,
          color: 'text-muted-foreground',
        };
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
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className='flex flex-col'>
                <CardHeader className='space-y-2 pb-3'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </CardHeader>
                <CardContent className='space-y-2'>
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-5/6' />
                  <Skeleton className='mt-3 h-9 w-full' />
                </CardContent>
              </Card>
            ))}
          </div>
        }
        emptyState={
          <Card>
            <CardContent className='flex min-h-[300px] flex-col items-center justify-center py-12'>
              <FileText className='text-muted-foreground mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>No Applications Found</h3>
              <p className='text-muted-foreground text-center text-sm'>
                {statusFilter || searchQuery || applicantTypeFilter
                  ? 'Try adjusting your filters or search query'
                  : 'No training applications have been submitted yet'}
              </p>
            </CardContent>
          </Card>
        }
      >
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredApplications.map(application => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;
              const isInstructor = application.applicant_type === 'instructor';

              return (
                <Card key={application.uuid} className='flex flex-col'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1 space-y-1'>
                        <CardTitle className='line-clamp-1 text-base'>
                          {application.course_name || 'Unknown Course'}
                        </CardTitle>
                        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                          {isInstructor ? (
                            <User className='h-3 w-3' />
                          ) : (
                            <Building2 className='h-3 w-3' />
                          )}
                          <span className='truncate'>
                            {application.applicant_name || 'Unknown Applicant'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusConfig.variant} className='shrink-0'>
                        <StatusIcon className='mr-1 h-3 w-3' />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col gap-4'>
                    {/* Course Description */}
                    {application.course_description && (
                      <div className='text-muted-foreground text-sm'>
                        <RichTextRenderer
                          htmlString={application.course_description}
                          maxChars={80}
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Rate Card */}
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm font-semibold'>
                        <DollarSign className='text-muted-foreground h-4 w-4' />
                        <span>Rate Card</span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Private Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.private_online_rate || 0}
                          </div>
                        </div>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Private In-Person</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.private_inperson_rate || 0}
                          </div>
                        </div>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Group Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.group_online_rate || 0}
                          </div>
                        </div>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Group In-Person</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.group_inperson_rate || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application Notes */}
                    {application.application_notes && (
                      <>
                        <Separator />
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2 text-sm font-semibold'>
                            <BookOpen className='text-muted-foreground h-4 w-4' />
                            <span>Application Notes</span>
                          </div>
                          <p className='text-muted-foreground line-clamp-3 text-sm'>
                            {application.application_notes}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Review Notes (if reviewed) */}
                    {application.review_notes && (
                      <>
                        <Separator />
                        <div className='bg-primary/5 rounded-lg border p-3'>
                          <div className='text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase'>
                            Review Notes
                          </div>
                          <p className='text-sm'>{application.review_notes}</p>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className='mt-auto flex gap-2 pt-2'>
                      {application.status === 'pending' && (
                        <>
                          <Button
                            size='sm'
                            className='flex-1'
                            onClick={() => handleReview(application, 'APPROVE')}
                          >
                            <ThumbsUp className='mr-1 h-3 w-3' />
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            className='flex-1'
                            onClick={() => handleReview(application, 'REJECT')}
                          >
                            <ThumbsDown className='mr-1 h-3 w-3' />
                            Reject
                          </Button>
                        </>
                      )}
                      {application.status === 'approved' && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => handleReview(application, 'REVOKE')}
                        >
                          <XCircle className='mr-1 h-3 w-3' />
                          Revoke Approval
                        </Button>
                      )}
                      {application.status === 'rejected' && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => handleReview(application, 'APPROVE')}
                        >
                          <CheckCircle2 className='mr-1 h-3 w-3' />
                          Reconsider
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                    <p className='font-medium'>{reviewDialog.application?.course_name}</p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Applicant:</span>
                    <p className='font-medium'>{reviewDialog.application?.applicant_name}</p>
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
