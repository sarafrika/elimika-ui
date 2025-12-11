'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  decideOnTrainingApplicationMutation,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useOrganisation } from '@/context/organisation-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
import RichTextRenderer from '@/components/editors/richTextRenders';
import { toast } from 'sonner';

export default function TrainingApplicationsPage() {
  const courseCreator = useOptionalCourseCreator();
  const organisation = useOrganisation();
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('');
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    application: any;
    action: 'APPROVE' | 'REJECT' | 'REVOKE' | null;
  }>({
    open: false,
    application: null,
    action: null,
  });
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch applications for this course creator's courses
  const { data, isLoading, refetch } = useQuery({
    ...searchTrainingApplicationsOptions({
      body: {
        searchCriteria: [
          {
            key: 'course_creator_uuid',
            operation: 'EQUAL',
            value: courseCreator?.profile?.uuid || organisation?.uuid,
          },
          ...(statusFilter
            ? [
                {
                  key: 'status',
                  operation: 'EQUAL' as const,
                  value: statusFilter,
                },
              ]
            : []),
          ...(applicantTypeFilter
            ? [
                {
                  key: 'applicant_type',
                  operation: 'EQUAL' as const,
                  value: applicantTypeFilter,
                },
              ]
            : []),
        ],
        pageable: {
          page,
          size: pageSize,
        },
      },
    }),
    enabled: !!(courseCreator?.profile?.uuid || organisation?.uuid),
  });

  const decideMutation = useMutation(decideOnTrainingApplicationMutation());

  const applications = data?.data?.content || [];
  const totalApplications = data?.data?.totalElements || 0;
  const totalPages = Math.ceil(totalApplications / pageSize);

  // Filter by search query (client-side)
  const filteredApplications = applications.filter((app: any) => {
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
    pending: applications.filter((app: any) => app.status === 'PENDING').length,
    approved: applications.filter((app: any) => app.status === 'APPROVED').length,
    instructors: new Set(
      applications
        .filter((app: any) => app.applicant_type === 'instructor')
        .map((app: any) => app.applicant_uuid)
    ).size,
  };

  const handleReview = (application: any, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    setReviewDialog({ open: true, application, action });
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog.application || !reviewDialog.action) return;

    try {
      await decideMutation.mutateAsync({
        path: {
          courseUuid: reviewDialog.application.course_uuid,
          applicationUuid: reviewDialog.application.uuid,
        },
        body: {
          decision: reviewDialog.action,
          review_notes: reviewNotes,
        },
      });

      toast.success(`Application ${reviewDialog.action.toLowerCase()}d successfully`);
      setReviewDialog({ open: false, application: null, action: null });
      setReviewNotes('');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process application');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending Review',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle2,
          color: 'text-green-600',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: FileText,
          color: 'text-muted-foreground',
        };
    }
  };

  if (isLoading && !data) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg border bg-primary/10'>
            <FileText className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold'>Training Applications</h1>
            <p className='text-muted-foreground'>
              Review and manage applications to train your courses
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Unique Trainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.instructors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
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
                <SelectItem value=''>All statuses</SelectItem>
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
                <SelectItem value=''>All types</SelectItem>
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

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className='flex min-h-[300px] flex-col items-center justify-center py-12'>
            <FileText className='mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-semibold'>No Applications Found</h3>
            <p className='text-muted-foreground text-center text-sm'>
              {statusFilter || searchQuery || applicantTypeFilter
                ? 'Try adjusting your filters or search query'
                : 'No training applications have been submitted yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredApplications.map((application: any) => {
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
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
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
                        <DollarSign className='h-4 w-4 text-muted-foreground' />
                        <span>Rate Card</span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='rounded-lg border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Private Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.private_online_rate || 0}
                          </div>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Private In-Person</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.private_inperson_rate || 0}
                          </div>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Group Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.group_online_rate || 0}
                          </div>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-2'>
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
                            <BookOpen className='h-4 w-4 text-muted-foreground' />
                            <span>Application Notes</span>
                          </div>
                          <p className='line-clamp-3 text-sm text-muted-foreground'>
                            {application.application_notes}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Review Notes (if reviewed) */}
                    {application.review_notes && (
                      <>
                        <Separator />
                        <div className='rounded-lg border bg-primary/5 p-3'>
                          <div className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                            Review Notes
                          </div>
                          <p className='text-sm'>{application.review_notes}</p>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className='mt-auto flex gap-2 pt-2'>
                      {application.status === 'PENDING' && (
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
                      {application.status === 'APPROVED' && (
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
                      {application.status === 'REJECTED' && (
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
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={open => !open && setReviewDialog({ open: false, application: null, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'APPROVE' && 'Approve Application'}
              {reviewDialog.action === 'REJECT' && 'Reject Application'}
              {reviewDialog.action === 'REVOKE' && 'Revoke Approval'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === 'APPROVE' &&
                'Approve this training application to allow the applicant to train this course.'}
              {reviewDialog.action === 'REJECT' &&
                'Reject this training application with optional feedback.'}
              {reviewDialog.action === 'REVOKE' &&
                'Revoke the approval for this training application.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='rounded-lg border bg-muted/20 p-4'>
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

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReviewDialog({ open: false, application: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              variant={reviewDialog.action === 'REJECT' || reviewDialog.action === 'REVOKE' ? 'destructive' : 'default'}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
