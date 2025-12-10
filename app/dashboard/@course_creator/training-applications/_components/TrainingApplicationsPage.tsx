'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCourseCreator } from '@/context/course-creator-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  searchTrainingApplicationsOptions,
  decideOnTrainingApplicationMutation,
  searchTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseTrainingApplication } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  Mail,
  Building2,
  Calendar,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
];

const applicantTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'organisation', label: 'Organisation' },
];

function getStatusBadgeVariant(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'revoked':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusIcon(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className='h-3.5 w-3.5' />;
    case 'pending':
      return <Clock className='h-3.5 w-3.5' />;
    case 'rejected':
    case 'revoked':
      return <XCircle className='h-3.5 w-3.5' />;
    default:
      return <Clock className='h-3.5 w-3.5' />;
  }
}

export default function TrainingApplicationsPage() {
  const { profile: courseCreatorProfile } = useCourseCreator();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<CourseTrainingApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');
  const pageSize = 12;

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      body: {
        searchCriteria: [],
        pageable: { page, size: pageSize },
      },
    }),
  });

  const applicationsPage = extractPage<CourseTrainingApplication>(applicationsQuery.data);
  const allApplications = applicationsPage.items;

  // Apply filters
  const filteredApplications = useMemo(() => {
    let items = allApplications;

    // Status filter
    if (statusFilter) {
      items = items.filter((app) => app.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Applicant type filter
    if (applicantTypeFilter) {
      items = items.filter((app) => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase());
    }

    // Search filter
    if (searchValue) {
      const term = searchValue.toLowerCase();
      items = items.filter(
        (app) =>
          app.applicant_name?.toLowerCase().includes(term) ||
          app.course_uuid?.toLowerCase().includes(term) ||
          app.application_notes?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allApplications, statusFilter, applicantTypeFilter, searchValue]);

  const totalPages = Math.max(Math.ceil(filteredApplications.length / pageSize), 1);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allApplications.length,
      pending: allApplications.filter((a) => a.status?.toLowerCase() === 'pending').length,
      approved: allApplications.filter((a) => a.status?.toLowerCase() === 'approved').length,
      instructors: allApplications.filter((a) => a.applicant_type?.toLowerCase() === 'instructor').length,
    };
  }, [allApplications]);

  // Mutation
  const decideMutation = useMutation(decideOnTrainingApplicationMutation());

  const handleReview = (application: CourseTrainingApplication, action: 'approve' | 'reject' | 'revoke') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = (reviewNotes: string) => {
    if (!selectedApplication?.uuid || !selectedApplication?.course_uuid) {
      toast.error('Missing application details');
      return;
    }

    decideMutation.mutate(
      {
        path: {
          courseUuid: selectedApplication.course_uuid,
          applicationUuid: selectedApplication.uuid,
        },
        query: { action: reviewAction },
        body: { action: reviewAction, review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({}),
          });
          setReviewDialogOpen(false);
          setSelectedApplication(null);
        },
        onError: (error: any) => {
          toast.error(error?.message || `Failed to ${reviewAction} application`);
        },
      }
    );
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Training Applications</h1>
            <p className='text-sm text-muted-foreground'>
              Review and manage applications from instructors and organizations
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <FileText className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Total Applications</p>
                <p className='text-lg font-bold text-foreground'>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Clock className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Pending Review</p>
                <p className='text-lg font-bold text-foreground'>{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <CheckCircle2 className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Approved</p>
                <p className='text-lg font-bold text-foreground'>{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-3'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Users className='h-4 w-4 text-primary' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Instructors</p>
                <p className='text-lg font-bold text-foreground'>{stats.instructors}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className='mb-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <select
              className='rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className='rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={applicantTypeFilter}
              onChange={(event) => {
                setApplicantTypeFilter(event.target.value);
                setPage(0);
              }}
            >
              {applicantTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(statusFilter || applicantTypeFilter) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setStatusFilter('');
                  setApplicantTypeFilter('');
                }}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by applicant name...'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className='w-full pl-10 sm:w-80'
            />
            {searchValue && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchValue('')}
                className='absolute right-1 top-1/2 h-7 -translate-y-1/2'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Applications Grid */}
      <section className={elimikaDesignSystem.spacing.content}>
        {applicationsQuery.isLoading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-64 w-full' />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <FileText className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>
              {searchValue || statusFilter || applicantTypeFilter
                ? 'No applications found'
                : 'No training applications yet'}
            </h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {searchValue || statusFilter || applicantTypeFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Applications will appear here when instructors or organizations apply to train your courses'}
            </p>
          </div>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.uuid}
                  application={application}
                  onApprove={() => handleReview(application, 'approve')}
                  onReject={() => handleReview(application, 'reject')}
                  onRevoke={() => handleReview(application, 'revoke')}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        application={selectedApplication}
        action={reviewAction}
        onSubmit={handleSubmitReview}
        isLoading={decideMutation.isPending}
      />
    </div>
  );
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  onRevoke,
}: {
  application: CourseTrainingApplication;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
}) {
  const isPending = application.status?.toLowerCase() === 'pending';
  const isApproved = application.status?.toLowerCase() === 'approved';

  return (
    <div className={elimikaDesignSystem.components.listCard.base}>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0'>
            {application.applicant_type?.toLowerCase() === 'instructor' ? (
              <Users className='h-6 w-6' />
            ) : (
              <Building2 className='h-6 w-6' />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-foreground truncate'>{application.applicant_name || 'Unknown'}</h3>
            <Badge variant='outline' className='mt-1 text-xs'>
              {application.applicant_type || 'Unknown'}
            </Badge>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(application.status)} className='ml-2 flex-shrink-0'>
          <span className='mr-1'>{getStatusIcon(application.status)}</span>
          {application.status}
        </Badge>
      </div>

      <Separator className='my-3' />

      <div className='space-y-3'>
        {application.created_date && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Calendar className='h-3 w-3 flex-shrink-0' />
            <span>Applied {format(new Date(application.created_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {application.rate_card && (
          <div className='rounded-lg bg-muted/30 p-3 space-y-2'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'>
              <DollarSign className='h-3 w-3' />
              <span>Rate Card</span>
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div>
                <span className='text-muted-foreground'>Private Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'} {application.rate_card.private_online_rate || 0}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Group Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'} {application.rate_card.group_online_rate || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {application.application_notes && (
          <div>
            <p className='mb-1 text-xs font-medium text-muted-foreground'>Notes</p>
            <p className='text-xs text-muted-foreground italic line-clamp-2'>&quot;{application.application_notes}&quot;</p>
          </div>
        )}

        {application.review_notes && (
          <div className='rounded-lg bg-primary/10 border border-primary/20 p-2'>
            <p className='mb-1 text-xs font-medium text-foreground'>Review Notes</p>
            <p className='text-xs text-muted-foreground line-clamp-2'>{application.review_notes}</p>
          </div>
        )}
      </div>

      <div className='mt-4 flex items-center gap-2'>
        {isPending && (
          <>
            <Button size='sm' variant='default' className='flex-1' onClick={onApprove}>
              <ThumbsUp className='mr-2 h-3.5 w-3.5' />
              Approve
            </Button>
            <Button size='sm' variant='outline' onClick={onReject}>
              <ThumbsDown className='h-3.5 w-3.5 text-destructive' />
            </Button>
          </>
        )}
        {isApproved && (
          <Button size='sm' variant='outline' className='flex-1' onClick={onRevoke}>
            <XCircle className='mr-2 h-3.5 w-3.5' />
            Revoke
          </Button>
        )}
        {!isPending && !isApproved && (
          <div className='flex-1 text-center text-xs text-muted-foreground'>
            {application.status === 'rejected' && 'Application was rejected'}
            {application.status === 'revoked' && 'Approval was revoked'}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  application,
  action,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: CourseTrainingApplication | null;
  action: 'approve' | 'reject' | 'revoke';
  onSubmit: (reviewNotes: string) => void;
  isLoading: boolean;
}) {
  const [reviewNotes, setReviewNotes] = useState('');

  const actionConfig = {
    approve: {
      title: 'Approve Application',
      description: 'Approve this training application to allow the applicant to train this course.',
      icon: ThumbsUp,
      color: 'text-green-600',
    },
    reject: {
      title: 'Reject Application',
      description: 'Reject this training application. Please provide a reason for rejection.',
      icon: ThumbsDown,
      color: 'text-destructive',
    },
    revoke: {
      title: 'Revoke Approval',
      description: 'Revoke the previously approved application. Please provide a reason.',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className={`rounded-lg bg-muted p-2 ${config.color}`}>
              <Icon className='h-5 w-5' />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className='mt-1'>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {application && (
          <div className='space-y-4 py-4'>
            <div className='rounded-lg border border-border bg-muted/30 p-4 space-y-2'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>{application.applicant_name}</span>
                <Badge variant='outline' className='text-xs'>
                  {application.applicant_type}
                </Badge>
              </div>
              {application.application_notes && (
                <p className='text-sm text-muted-foreground'>
                  &quot;{application.application_notes}&quot;
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Review Notes {action === 'reject' && <span className='text-destructive'>*</span>}</Label>
              <Textarea
                placeholder={`Add your ${action} notes...`}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(reviewNotes);
              setReviewNotes('');
            }}
            disabled={isLoading || (action === 'reject' && !reviewNotes.trim())}
          >
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {action === 'approve' && 'Approve'}
            {action === 'reject' && 'Reject'}
            {action === 'revoke' && 'Revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
