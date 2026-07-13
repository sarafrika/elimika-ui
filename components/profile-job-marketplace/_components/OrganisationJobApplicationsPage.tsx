'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminPageHeader, adminTheme, SectionCard } from '@/app/dashboard/@admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCoursesByIds, useInstructorsByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { cn } from '@/lib/utils';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
} from '@/services/client';
import {
  assignInstructorMutation,
  listJobApplicationsOptions,
  listJobApplicationsQueryKey,
  listJobsOptions,
  listJobsQueryKey,
  reviewApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import {
  ApplicationListSkeleton,
  ApplicationStatsCards,
  type ApplicationStatusFilter,
  ApplicationsEmptyState,
  ApplicationsFilterBar,
  ApplicationsListSection,
  JobOverviewPanel,
} from './OrganisationJobApplicationsSections';

type JobApplicationsPageProps = {
  jobUuid: string;
};

type ClassMarketplaceJobWithProgram = ClassMarketplaceJob & {
  readonly program_uuid?: string | null;
};

const JOB_PAGE_SIZE = 50;
const APPLICATION_PAGE_SIZE = 100;

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function getJobProgramUuid(job?: ClassMarketplaceJobWithProgram | null) {
  return job?.program_uuid ?? null;
}

export function OrganisationJobApplicationsPage({ jobUuid }: JobApplicationsPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('ALL');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState<{
    application: ClassMarketplaceJobApplication;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const jobsListOptions = {
    query: {
      organisation_uuid: organisationUuid,
      pageable: { page: 0, size: JOB_PAGE_SIZE },
    },
  };
  const applicationsListOptions = {
    path: { jobUuid },
    query: {
      pageable: { page: 0, size: APPLICATION_PAGE_SIZE },
    },
  };

  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions(jobsListOptions),
    enabled: Boolean(organisationUuid),
  });

  const job: ClassMarketplaceJobWithProgram | null =
    (jobsResponse?.data?.content ?? []).find((item: ClassMarketplaceJob) => item.uuid === jobUuid) ??
    null;

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions(applicationsListOptions),
    enabled: Boolean(jobUuid),
  });

  const applications: ClassMarketplaceJobApplication[] = applicationsQuery.data?.data?.content ?? [];
  const isApplicationsLoading = applicationsQuery.isLoading && !applicationsQuery.data;
  const instructorUuids = useMemo(
    () => applications.map(application => application.instructor_uuid ?? '').filter(Boolean),
    [applications]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorUuids);
  const programUuid = getJobProgramUuid(job);
  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(programUuid ? [programUuid] : []);
  const contentLabel = programUuid
    ? programMap[programUuid]?.title ?? `Program ${shortId(programUuid)}`
    : job?.course_uuid
      ? courseMap[job.course_uuid]?.name ?? `Course ${shortId(job.course_uuid)}`
      : 'Course or program';

  const reviewMutation = useMutation({
    ...reviewApplicationMutation(),
    onSuccess: async () => {
      toast.success('Application reviewed successfully.');
      setReviewNotes('');
      setPendingReview(null);
      setReviewDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: listJobApplicationsQueryKey(applicationsListOptions),
      });
      await queryClient.invalidateQueries({ queryKey: listJobsQueryKey(jobsListOptions) });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to review this application.');
    },
  });

  const assignMutation = useMutation({
    ...assignInstructorMutation(),
    onSuccess: async () => {
      toast.success('Instructor assigned and class created.');
      await queryClient.invalidateQueries({
        queryKey: listJobApplicationsQueryKey(applicationsListOptions),
      });
      await queryClient.invalidateQueries({ queryKey: listJobsQueryKey(jobsListOptions) });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to assign this instructor.');
    },
  });

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter(application => {
      const instructor = application.instructor_uuid
        ? instructorMap[application.instructor_uuid]
        : null;
      const searchable = [
        instructor?.full_name,
        instructor?.professional_headline,
        instructor?.website,
        instructor?.bio,
        application.application_note,
        application.review_notes,
        application.status,
        application.instructor_uuid,
        job?.title,
        contentLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, contentLabel, instructorMap, job?.title, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(application => application.status === 'pending').length,
      approved: applications.filter(application => application.status === 'approved').length,
      rejected: applications.filter(application => application.status === 'rejected').length,
      assigned: applications.filter(application => application.status === 'assigned').length,

    }),
    [applications]
  );

  const openReviewDialog = (application: ClassMarketplaceJobApplication, action: 'APPROVE' | 'REJECT') => {
    setPendingReview({ application, action });
    setReviewNotes(application.review_notes ?? '');
    setReviewDialogOpen(true);
  };

  const handleReviewConfirm = () => {
    if (!pendingReview?.application.uuid) return;

    reviewMutation.mutate({
      path: {
        jobUuid,
        applicationUuid: pendingReview.application.uuid,
      },
      query: {
        action: pendingReview.action,
      },
      body: reviewNotes.trim() ? { review_notes: reviewNotes.trim() } : undefined,
    });
  };

  const handleAssign = (application: ClassMarketplaceJobApplication) => {
    if (!application.uuid) {
      toast.error('This application cannot be assigned yet.');
      return;
    }

    assignMutation.mutate({
      path: { jobUuid },
      body: {
        application_uuid: application.uuid,
      },
    });
  };

  if (!organisationUuid) {
    return (
      <div className={cn(adminTheme.page, 'max-w-3xl')}>
        <Button variant='ghost' className='mb-4 px-0 text-muted-foreground' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 size-4' />
          Back to opportunities
        </Button>
        <EmptyState
          icon={BriefcaseBusiness}
          title='Organisation profile not available'
          description='An active organisation profile is required before class job applications can be reviewed.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/opportunities'>View class jobs</Link>
            </Button>
          }
          variant='card'
        />
      </div>
    );
  }

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button
          variant='ghost'
          size='sm'
          className='w-fit px-0 text-muted-foreground'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 size-4' />
          Back to opportunities
        </Button>

        <AdminPageHeader
          title={isJobsLoading && !jobsResponse ? 'Job applications' : job?.title ?? 'Job applications'}
          description='Review applicants, approve or reject submissions, then assign an approved instructor.'
        />

        <ApplicationStatsCards isLoading={isApplicationsLoading} stats={stats} />

        <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]'>
          <SectionCard title='Applicants' bodyClassName='space-y-4'>
            <ApplicationsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <AsyncSection
              loading={isApplicationsLoading}
              error={applicationsQuery.error}
              empty={!filteredApplications.length}
              onRetry={() => applicationsQuery.refetch()}
              skeleton={<ApplicationListSkeleton />}
              errorTitle='Couldn’t load applications'
              emptyState={<ApplicationsEmptyState />}
            >
              <ApplicationsListSection
                applications={filteredApplications}
                instructorMap={instructorMap}
                isInstructorsLoading={isInstructorsLoading}
                isReviewPending={reviewMutation.isPending}
                isAssignPending={assignMutation.isPending}
                jobTrainingFee={job?.training_fee}
                onApprove={application => openReviewDialog(application, 'APPROVE')}
                onReject={application => openReviewDialog(application, 'REJECT')}
                onAssign={handleAssign}
                onViewProfile={application => {
                  if (application.uuid) {
                    router.push(`/dashboard/opportunities/${jobUuid}/applications/${application.uuid}`);
                  }
                }}
              />
            </AsyncSection>
          </SectionCard>

          <JobOverviewPanel
            job={job}
            contentLabel={contentLabel}
            organisationUuid={organisation?.uuid}
            isLoading={isJobsLoading && !jobsResponse}
          />
        </div>

      <Sheet
        open={reviewDialogOpen}
        onOpenChange={open => {
          setReviewDialogOpen(open);
          if (!open) {
            setPendingReview(null);
            setReviewNotes('');
          }
        }}
      >
        <SheetContent
          side='right'
          className='flex w-[min(98vw,480px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
        >
          <div className='space-y-6 p-3 sm:p-6'>
            <SheetHeader className='space-y-3 pr-10 text-left'>
              <SheetTitle>
                {pendingReview?.action === 'APPROVE' ? 'Approve application' : 'Reject application'}
              </SheetTitle>
              <SheetDescription>
                Add review notes before confirming this decision. The applicant will receive the
                submitted notes with the review outcome.
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-2'>
              <Label htmlFor='review-notes' className='text-sm font-medium'>
                Review notes
              </Label>
              <Textarea
                id='review-notes'
                value={reviewNotes}
                onChange={event => setReviewNotes(event.target.value)}
                placeholder='Add optional notes for this review...'
                className='min-h-32'
              />
            </div>

            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setReviewDialogOpen(false);
                  setPendingReview(null);
                  setReviewNotes('');
                }}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={pendingReview?.action === 'REJECT' ? 'destructive' : 'default'}
                onClick={handleReviewConfirm}
                disabled={reviewMutation.isPending || !pendingReview?.application.uuid}
              >
                {reviewMutation.isPending ? (
                  <>
                    <Spinner className='mr-2 size-4' />
                    Submitting...
                  </>
                ) : pendingReview?.action === 'APPROVE' ? (
                  'Confirm approval'
                ) : (
                  'Confirm rejection'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}
