'use client';

import { useQuery } from '@tanstack/react-query';
import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useOrganisation } from '@/context/organisation-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { managesOrganisation } from '@/src/features/rate-card/application-display';
import { TrainingApplicationDetails } from '@/src/features/rate-card/components/training-application-details';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';
import { OrgPage } from '../../_components/org-page';
import { ApplicationDetailsSkeleton } from '../_components/application-details-skeleton';

/** The URL carries only the application uuid; find whether it targets a course or a program. */
function useLocateApplication(organisationUuid: string, applicationUuid: string) {
  const query = {
    searchParams: { uuid_eq: applicationUuid, applicant_uuid_eq: organisationUuid },
    pageable: { page: 0, size: 1 },
  };
  const enabled = Boolean(organisationUuid && applicationUuid);
  // Kind and parent never change, so these lookups do not poll; the details below do.
  const courses = useQuery({
    ...searchTrainingApplicationsOptions({ query }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const programs = useQuery({
    ...searchProgramTrainingApplicationsOptions({ query }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });

  const course = courses.data?.data?.content?.[0];
  const program = programs.data?.data?.content?.[0];
  const located: { kind: TrainingApplicationKind; parentUuid: string } | null = course?.course_uuid
    ? { kind: 'course', parentUuid: course.course_uuid }
    : program?.program_uuid
      ? { kind: 'program', parentUuid: program.program_uuid }
      : null;

  return {
    located,
    loading: !located && (courses.isLoading || programs.isLoading || !enabled),
    error: !located && (courses.error || programs.error),
    retry: () => {
      void courses.refetch();
      void programs.refetch();
    },
  };
}

export default function OrganisationApplicationDetailsPage() {
  const params = useParams<{ applicationUuid: string }>();
  const applicationUuid = params?.applicationUuid ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const profile = useUserProfile();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { located, loading, error, retry } = useLocateApplication(
    organisationUuid,
    applicationUuid
  );

  const approvalsHref = dashboardUrl('organisation', 'approvals');

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: dashboardUrl('organisation', 'overview') },
      { id: 'approvals', title: 'Approvals', url: approvalsHref },
      {
        id: 'application',
        title: 'Application',
        url: dashboardUrl('organisation', `approvals/${applicationUuid}`),
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, approvalsHref, applicationUuid]);

  const programQuery = located?.kind === 'program' ? '&kind=program' : '';
  const applyPath = located ? `courses/apply/${located.parentUuid}` : 'courses/catalog';

  return (
    <OrgPage className='space-y-5'>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={retry}
        errorTitle='Couldn’t load this application'
        empty={!located}
        skeleton={<ApplicationDetailsSkeleton />}
        emptyState={
          <EmptyState
            icon={FileSearch}
            title='Application not found'
            description='It may have been withdrawn, or it belongs to another organisation.'
            action={
              <Button asChild variant='outline'>
                <Link href={approvalsHref}>All approvals</Link>
              </Button>
            }
          />
        }
      >
        {located ? (
          <TrainingApplicationDetails
            kind={located.kind}
            parentUuid={located.parentUuid}
            applicationUuid={applicationUuid}
            applicantName={organisation?.name}
            canAct={managesOrganisation(profile?.organisation_affiliations, organisationUuid)}
            backHref={approvalsHref}
            backLabel='All approvals'
            editHref={dashboardUrl(
              'organisation',
              `${applyPath}?application=${applicationUuid}${programQuery}`
            )}
            reapplyHref={dashboardUrl(
              'organisation',
              `${applyPath}${located.kind === 'program' ? '?kind=program' : ''}`
            )}
            onWithdrawn={() => router.push(approvalsHref)}
          />
        ) : null}
      </AsyncSection>
    </OrgPage>
  );
}
