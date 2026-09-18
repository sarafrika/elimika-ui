'use client';

// Apply to train a course or program; `?kind=program` swaps the content kind.
// `?application=<uuid>` edits that pending application instead of creating one.
// Instructor and generic apply routes re-export this page.

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useOrganisation } from '@/context/organisation-context';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import {
  getCourseByUuidOptions,
  getProgramRequirementsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
import { CourseRecordPage, type CourseTrainerApplicantType } from '@/src/features/course-record';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useTrainingApplication } from '@/src/features/rate-card/hooks';
import { isApplicantTrainingRequirement } from './_components/apply-model';
import { ApplyWizard, ApplyWizardSkeleton } from './_components/apply-wizard';

const REQUIREMENT_PAGE_SIZE = 200;

export default function ApplyPage() {
  const applyWizardRef = useRef<HTMLElement>(null);
  const params = useParams<{ courseId?: string; id?: string }>();
  const trainingId = params?.courseId ?? params?.id ?? '';

  const searchParams = useSearchParams();
  const isProgram = searchParams.get('kind') === 'program';
  const kind = isProgram ? 'program' : 'course';
  const editingUuid = searchParams.get('application');

  const router = useRouter();
  const pathname = usePathname();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { activeDomain } = useUserDomain();
  const isInstructorDomain = activeDomain === 'instructor';
  const organisation = useOrganisation();
  const instructor = useInstructor();
  const profile = useUserProfile();

  const applicantType: CourseTrainerApplicantType = isInstructorDomain
    ? 'instructor'
    : 'organisation';

  // The generic apply route sits outside the organisation layout, so fall back to affiliations.
  const affiliations = profile?.organisation_affiliations ?? [];
  const affiliatedOrganisationUuid = (affiliations.find(row => row.active) ?? affiliations[0])
    ?.organisation_uuid;
  const applicantUuid =
    (isInstructorDomain ? instructor?.uuid : (organisation?.uuid ?? affiliatedOrganisationUuid)) ??
    '';

  const applicantDomain = isInstructorDomain ? 'instructor' : 'organisation';
  const backHref = isInstructorDomain
    ? dashboardUrl('instructor', 'courses')
    : dashboardUrl('organisation', 'courses/catalog');
  const backLabel = isInstructorDomain ? 'Back to courses' : 'Back to catalog';
  const applicationsHref = isInstructorDomain
    ? dashboardUrl('instructor', 'rate-card')
    : dashboardUrl('organisation', 'approvals');

  const forCourse = Boolean(trainingId) && !isProgram;
  const forProgram = Boolean(trainingId) && isProgram;

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: trainingId } }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: trainingId } }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });
  const course = courseQuery.data?.data;
  const program = programQuery.data?.data;

  const courseRequirementsQuery = useQuery({
    ...allCourseTrainingRequirementsOptions(trainingId),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programRequirementsQuery = useQuery({
    ...getProgramRequirementsOptions({
      path: { programUuid: trainingId },
      query: { pageable: { page: 0, size: REQUIREMENT_PAGE_SIZE } },
    }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });

  const edited = useTrainingApplication(kind, trainingId, editingUuid);

  const courseRequirements = useMemo<CourseTrainingRequirement[]>(
    () => courseRequirementsQuery.data?.data?.content ?? course?.training_requirements ?? [],
    [courseRequirementsQuery.data?.data?.content, course?.training_requirements]
  );
  const requirements = useMemo(
    () =>
      courseRequirements.filter(requirement =>
        isApplicantTrainingRequirement(requirement, applicantType)
      ),
    [courseRequirements, applicantType]
  );
  const programRequirements = useMemo<ProgramRequirement[]>(
    () => programRequirementsQuery.data?.data?.content ?? [],
    [programRequirementsQuery.data?.data?.content]
  );

  const minimumFee = forCourse ? (course?.minimum_training_fee ?? null) : null;
  const requirementsQuery = isProgram ? programRequirementsQuery : courseRequirementsQuery;
  const requirementRowCount = isProgram ? programRequirements.length : requirements.length;
  const contentTitle = (isProgram ? program?.title : course?.name) ?? '';

  const notFound =
    !trainingId ||
    (isProgram ? programQuery.isSuccess && !program : courseQuery.isSuccess && !course);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: dashboardUrl(applicantDomain, 'overview') },
      { id: 'opportunities', title: 'Training opportunities', url: backHref },
      { id: 'apply', title: 'Apply to train', url: pathname, isLast: true },
    ]);
  }, [replaceBreadcrumbs, applicantDomain, backHref, pathname]);

  if (notFound) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>
        {isProgram ? 'Program' : 'Course'} not found.{' '}
        <Link href={backHref} className='text-primary hover:underline'>
          {backLabel}
        </Link>
      </div>
    );
  }

  const wizardProps = {
    trainingId,
    isProgram,
    contentTitle,
    applicantType,
    applicantUuid,
    requirements,
    programRequirements,
    minimumFee,
    requirementsLoading: requirementsQuery.isLoading && requirementRowCount === 0,
    requirementsError: requirementsQuery.error,
    onRetryRequirements: () => void requirementsQuery.refetch(),
    onSubmitted: (applicationUuid: string | null) =>
      router.push(
        !isInstructorDomain && applicationUuid
          ? dashboardUrl('organisation', `approvals/${applicationUuid}`)
          : applicationsHref
      ),
  };

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      {isProgram ? (
        <AsyncSection
          loading={programQuery.isLoading && !program}
          error={programQuery.error}
          onRetry={() => void programQuery.refetch()}
          errorTitle='Couldn’t load this program'
          skeleton={<Skeleton className='h-16 w-full' />}
        >
          <PageHeader
            title={`Apply to train: ${contentTitle || 'Untitled'}`}
            description={`${program?.program_type ?? 'Program'} · ${program?.total_duration_display ?? '—'}`}
            action={
              <Button asChild variant='ghost' size='sm'>
                <Link href={backHref}>
                  <ArrowLeft className='mr-2 h-4 w-4' /> {backLabel}
                </Link>
              </Button>
            }
          />
        </AsyncSection>
      ) : (
        <CourseRecordPage
          courseUuid={trainingId}
          backHref={backHref}
          onPrimaryAction={() => {
            applyWizardRef.current?.focus({ preventScroll: true });
            applyWizardRef.current?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
              block: 'start',
            });
          }}
        />
      )}

      <section
        ref={applyWizardRef}
        id='apply-wizard'
        tabIndex={-1}
        aria-labelledby='apply-heading'
        className='scroll-mt-24 space-y-4 border-t pt-6'
      >
        <div>
          <h2 id='apply-heading' className='text-lg font-semibold'>
            {editingUuid ? 'Edit your application to train' : 'Apply to train'}{' '}
            {contentTitle || `this ${kind}`}
          </h2>
          <p className='text-muted-foreground text-sm'>
            Tell the {kind} creator where you would teach, what you can provide, and your rates.
          </p>
        </div>

        {editingUuid ? (
          <AsyncSection
            loading={edited.query.isLoading && !edited.application}
            error={edited.query.error}
            onRetry={() => void edited.query.refetch()}
            errorTitle='Couldn’t load your application'
            skeleton={<ApplyWizardSkeleton />}
          >
            {edited.application?.status === 'pending' ? (
              <ApplyWizard
                key={edited.application.uuid}
                {...wizardProps}
                application={edited.application}
              />
            ) : (
              <EmptyState
                variant='compact'
                title='This application can no longer be edited'
                description={`The ${kind} creator has already decided on it.`}
                action={
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      href={
                        isInstructorDomain
                          ? applicationsHref
                          : dashboardUrl('organisation', `approvals/${editingUuid}`)
                      }
                    >
                      View application
                    </Link>
                  </Button>
                }
              />
            )}
          </AsyncSection>
        ) : (
          <ApplyWizard {...wizardProps} />
        )}
      </section>
    </div>
  );
}
