'use client';

import { useQuery } from '@tanstack/react-query';

import { GettingStarted, type GettingStartedStep } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  getClassDefinitionsForOrganisationOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Onboarding checklist whose completion is derived from real org state
 * (verification, instructors, venues, classes, students). Read-only — steps are
 * not manually toggleable because they reflect backend truth.
 */
export function OverviewGettingStarted() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled,
  });
  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled,
  });
  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled,
  });

  const instructorCount =
    getTotalFromMetadata(extractPage(instructorsQuery.data).metadata) ||
    extractPage(instructorsQuery.data).items.length;
  const studentCount =
    getTotalFromMetadata(extractPage(studentsQuery.data).metadata) ||
    extractPage(studentsQuery.data).items.length;
  const branchCount = getTotalFromMetadata(extractPage(branchesQuery.data).metadata);
  const classCount = (classesQuery.data?.data ?? []).length;

  const steps: GettingStartedStep[] = [
    {
      key: 'account',
      label: 'Create organisation account',
      href: '/dashboard/organisation/account',
      done: enabled,
    },
    {
      key: 'verify',
      label: 'Get verified',
      href: '/dashboard/organisation/account',
      done: organisation?.admin_verified === true,
    },
    {
      key: 'venues',
      label: 'Add training venues',
      href: '/dashboard/organisation/branches',
      done: branchCount > 0,
    },
    {
      key: 'instructors',
      label: 'Onboard instructors',
      href: '/dashboard/organisation/instructors',
      done: instructorCount > 0,
    },
    {
      key: 'classes',
      label: 'Create classes',
      href: '/dashboard/organisation/classes',
      done: classCount > 0,
    },
    {
      key: 'students',
      label: 'Invite students',
      href: '/dashboard/organisation/students',
      done: studentCount > 0,
    },
  ];

  return <GettingStarted steps={steps} />;
}
