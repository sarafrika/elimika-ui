'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, GraduationCap, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { ClassDefinition, CourseTrainingApplication } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '../_components/ui';

const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

/**
 * Organisation Reports & Analytics — strictly scoped to the current organisation
 * (its own members, branches, classes and training applications), never platform-wide.
 */
export default function OrganisationReportsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const membersQuery = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
  });
  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled,
  });
  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
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
  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled,
  });

  const studentsPage = extractPage(studentsQuery.data);
  const instructorsPage = extractPage(instructorsQuery.data);
  const totalMembers = getTotalFromMetadata(extractPage(membersQuery.data).metadata);
  const totalStudents = getTotalFromMetadata(studentsPage.metadata) || studentsPage.items.length;
  const totalInstructors =
    getTotalFromMetadata(instructorsPage.metadata) || instructorsPage.items.length;
  const totalBranches = getTotalFromMetadata(extractPage(branchesQuery.data).metadata);

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );
  const activeClasses = classes.filter(c => c.is_active).length;
  const avgClassProgress = classes.length
    ? Math.round(
        classes.reduce((sum, c) => sum + Number(c.class_progress_percentage ?? 0), 0) /
          classes.length
      )
    : 0;

  const applications = (applicationsQuery.data?.data?.content ?? []) as CourseTrainingApplication[];
  const appCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const a of applications) {
      if (a.status === 'pending') counts.pending += 1;
      else if (a.status === 'approved') counts.approved += 1;
      else if (a.status === 'rejected') counts.rejected += 1;
    }
    return counts;
  }, [applications]);

  const kpiLoading = membersQuery.isLoading || branchesQuery.isLoading;

  const kpis = [
    { label: 'Members', value: num(totalMembers), icon: Users, tone: 'info' as const },
    { label: 'Students', value: num(totalStudents), icon: GraduationCap, tone: 'success' as const },
    {
      label: 'Instructors',
      value: num(totalInstructors),
      icon: Briefcase,
      tone: 'neutral' as const,
    },
    { label: 'Branches', value: num(totalBranches), icon: Building, tone: 'warning' as const },
  ];

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Reports & Analytics'
          description='Insights for your organisation — your members, classes and applications.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {kpiLoading
            ? kpis.map(k => <StatCardSkeleton key={k.label} />)
            : kpis.map(k => (
                <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} tone={k.tone} />
              ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard title='Classes' description='Your organisation’s classes and delivery'>
            <DetailGrid
              items={[
                { label: 'Total classes', value: num(classes.length) },
                { label: 'Active classes', value: num(activeClasses) },
                { label: 'Avg class progress', value: `${avgClassProgress}%` },
                {
                  label: 'Sessions completed',
                  value: num(
                    classes.reduce((s, c) => s + Number(c.completed_session_count ?? 0), 0)
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title='Training applications'
            description='Applications your organisation has submitted'
          >
            <DetailGrid
              items={[
                { label: 'Total submitted', value: num(applications.length) },
                { label: 'Pending', value: num(appCounts.pending) },
                { label: 'Approved', value: num(appCounts.approved) },
                { label: 'Rejected', value: num(appCounts.rejected) },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
