'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCourseCreator } from '@/context/course-creator-context';
import { extractPage } from '@/lib/api-helpers';
import { elimikaDesignSystem } from '@/lib/design-system';
import type { CourseTrainingApplication } from '@/services/client';
import {
  decideOnTrainingApplicationMutation,
  getInstructorByUuidOptions,
  getOrganisationByUuidOptions,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Loader2,
  Search,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '../../../../../components/ui/label';

export const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
];

export const applicantTypeOptions = [
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
  const { profile: courseCreator } = useCourseCreator();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<CourseTrainingApplication | null>(
    null
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');
  const pageSize = 12;

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          course_creator_uuid: courseCreator?.uuid as string,
        },
        pageable: { page, size: pageSize },
      },
    }),
  });

  const applicationsPage = extractPage<CourseTrainingApplication>(applicationsQuery.data);
  const allApplications = applicationsPage.items;

  const instructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          allApplications
            .filter(app => app.applicant_type === 'instructor')
            .map(app => app.applicant_uuid)
            .filter(Boolean)
        )
      ),
    [allApplications]
  );

  const organisationUuids = useMemo(
    () =>
      Array.from(
        new Set(
          allApplications
            .filter(app => app.applicant_type === 'organisation')
            .map(app => app.applicant_uuid)
            .filter(Boolean)
        )
      ),
    [allApplications]
  );

  const instructorQueries = useQueries({
    queries: instructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid: uuid as string } }),
      enabled: !!uuid,
    })),
  });

  const organisationQueries = useQueries({
    queries: organisationUuids.map(uuid => ({
      ...getOrganisationByUuidOptions({ path: { uuid: uuid as string } }),
      enabled: !!uuid,
    })),
  });

  const applicantNameMap = useMemo(() => {
    const map = new Map<string, string>();

    instructorQueries.forEach((q: any) => {
      const instructor = q.data?.data;
      if (instructor?.uuid) {
        map.set(instructor.uuid, instructor.full_name);
      }
    });

    organisationQueries.forEach((q: any) => {
      const org = q.data?.data;
      if (org?.uuid) {
        map.set(org.uuid, org.full_name);
      }
    });

    return map;
  }, [instructorQueries, organisationQueries]);

  // Apply filters
  const filteredApplications = useMemo(() => {
    let items = allApplications;

    // Status filter
    if (statusFilter) {
      items = items.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Applicant type filter
    if (applicantTypeFilter) {
      items = items.filter(
        app => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchValue) {
      const term = searchValue.toLowerCase();

      items = items.filter(app => {
        const name = applicantNameMap.get(app.applicant_uuid ?? '')?.toLowerCase() ?? '';

        return (
          name.includes(term) ||
          app.course_uuid?.toLowerCase().includes(term) ||
          app.application_notes?.toLowerCase().includes(term)
        );
      });
    }

    return items;
  }, [allApplications, statusFilter, applicantTypeFilter, searchValue]);

  const totalPages = Math.max(Math.ceil(filteredApplications.length / pageSize), 1);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allApplications.length,
      pending: allApplications.filter(a => a.status?.toLowerCase() === 'pending').length,
      approved: allApplications.filter(a => a.status?.toLowerCase() === 'approved').length,
      revoked: allApplications.filter(a => a.status?.toLowerCase() === 'revoked').length,
      rejected: allApplications.filter(a => a.status?.toLowerCase() === 'rejected').length,
      instructors: allApplications.filter(a => a.applicant_type?.toLowerCase() === 'instructor')
        .length,
    };
  }, [allApplications]);

  // Mutation
  const decideMutation = useMutation(decideOnTrainingApplicationMutation());

  const handleReview = (
    application: CourseTrainingApplication,
    action: 'approve' | 'reject' | 'revoke'
  ) => {
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
        body: { review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({
              query: {
                searchParams: {
                  course_creator_uuid: courseCreator?.uuid as string,
                },
                pageable: { page, size: pageSize },
              },
            }),
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
            <h1 className='text-foreground text-2xl font-bold'>Training Applications</h1>
            <p className='text-muted-foreground text-sm'>
              Review and manage applications from instructors and organizations
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid gap-3 sm:grid-cols-4'>
          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <FileText className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Total Applications</p>
                <p className='text-foreground text-lg font-bold'>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <Clock className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Pending Review</p>
                <p className='text-foreground text-lg font-bold'>{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted rounded-lg p-2'>
                <CheckCircle2 className='text-primary h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Approved</p>
                <p className='text-foreground text-lg font-bold'>{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className='border-border bg-card flex flex-row items-center justify-between rounded-lg border p-3'>
            {/* Revoked */}
            <div className='flex items-center gap-3'>
              <div className='bg-destructive/10 rounded-lg p-2'>
                <XCircle className='text-destructive h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Revoked</p>
                <p className='text-foreground text-lg font-bold'>{stats.revoked}</p>
              </div>
            </div>

            <div>{' | '}</div>

            {/* Rejected */}
            <div className='flex items-center gap-3'>
              <div className='bg-warning/10 rounded-lg p-2'>
                <AlertCircle className='text-warning/60 h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Rejected</p>
                <p className='text-foreground text-lg font-bold'>{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className='mb-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Filter className='text-muted-foreground h-4 w-4' />
            <select
              className='border-border bg-background rounded-md border px-3 py-2 text-sm'
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className='border-border bg-background rounded-md border px-3 py-2 text-sm'
              value={applicantTypeFilter}
              onChange={event => {
                setApplicantTypeFilter(event.target.value);
                setPage(0);
              }}
            >
              {applicantTypeOptions.map(option => (
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
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search by applicant name...'
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              className='w-full pl-10 sm:w-80'
            />
            {searchValue && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSearchValue('')}
                className='absolute top-1/2 right-1 h-7 -translate-y-1/2'
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
              {filteredApplications.map(application => (
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
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className='text-muted-foreground text-sm'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
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

export function ApplicationCard({
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

  const applicantUuid = application.applicant_uuid;
  const applicationType = application.applicant_type;

  const { data: instructor } = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: applicantUuid as string } }),
    enabled: applicationType === 'instructor' && !!applicantUuid,
  });

  const { data: organisation } = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid: applicantUuid as string } }),
    enabled: applicationType === 'organisation' && !!applicantUuid,
  });

  return (
    <div className={elimikaDesignSystem.components.listCard.base}>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <div className='bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full'>
            {application.applicant_type?.toLowerCase() === 'instructor' ? (
              <Users className='h-6 w-6' />
            ) : (
              <Building2 className='h-6 w-6' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            {application.applicant_type?.toLowerCase() === 'instructor' ? (
              <h3 className='text-foreground truncate font-semibold'>
                {/* @ts-ignore */}
                {instructor?.data?.full_name || 'Unknown'}
              </h3>
            ) : (
              <h3 className='text-foreground truncate font-semibold'>
                {/* @ts-ignore */}
                {organisation?.data?.full_name || 'Unknown'}
              </h3>
            )}

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
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3 flex-shrink-0' />
            <span>Applied {format(new Date(application.created_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {application.rate_card && (
          <div className='bg-muted/30 space-y-2 rounded-lg p-3'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <DollarSign className='h-3 w-3' />
              <span>Rate Card</span>
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div>
                <span className='text-muted-foreground'>Private Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'}{' '}
                  {application.rate_card.private_online_rate || 0}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Group Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'}{' '}
                  {application.rate_card.group_online_rate || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {application.application_notes && (
          <div>
            <p className='text-muted-foreground mb-1 text-xs font-medium'>Notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs italic'>
              &quot;{application.application_notes}&quot;
            </p>
          </div>
        )}

        {application.review_notes && (
          <div className='bg-primary/10 border-primary/20 rounded-lg border p-2'>
            <p className='text-foreground mb-1 text-xs font-medium'>Review Notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs'>{application.review_notes}</p>
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
              <ThumbsDown className='text-destructive h-3.5 w-3.5' />
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
          <div className='text-muted-foreground flex-1 text-center text-xs'>
            {application.status === 'rejected' && 'Application was rejected'}
            {application.status === 'revoked' && 'Approval was revoked'}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewDialog({
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
            <div className={`bg-muted rounded-lg p-2 ${config.color}`}>
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
            <div className='border-border bg-muted/30 space-y-2 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>{application.applicant_name}</span>
                <Badge variant='outline' className='text-xs'>
                  {application.applicant_type}
                </Badge>
              </div>
              {application.application_notes && (
                <p className='text-muted-foreground text-sm'>
                  &quot;{application.application_notes}&quot;
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Review Notes {action === 'reject' && <span className='text-destructive'>*</span>}
              </Label>
              <Textarea
                placeholder={`Add your ${action} notes...`}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
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
