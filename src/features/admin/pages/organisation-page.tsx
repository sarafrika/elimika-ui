'use client';

import { Building2 } from 'lucide-react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { adminRoutes, type OrganisationTab } from '../lib/admin-routes';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { BranchesTab } from '../components/branches-tab';
import { ClassesTab } from '../components/classes-tab';
import { FinanceTab } from '../components/finance-tab';
import { MembersTab } from '../components/members-tab';
import { OrganisationVerificationTab } from '../components/organisation-verification-tab';
import { RecordHeader } from '../components/record-header';
import { SectionBoundary } from '../components/section-boundary';
import { UnderlineTabs } from '../components/underline-tabs';
import {
  useDocumentTypes,
  useOrganisation,
  useOrganisationBranches,
  useOrganisationClasses,
  useOrganisationDocuments,
  useOrganisationEnrolmentCounts,
  useOrganisationInstructors,
  useOrganisationInvitations,
  useOrganisationMembers,
  useOrganisationObligations,
  useOrganisationPayables,
  useOrganisationSettlements,
  useOrganisationSkillsFund,
  useOrganisationStatistics,
} from '../hooks/use-organisation-record';

const TAB_IDS = [
  'overview',
  'verification',
  'branches',
  'members',
  'classes',
  'finance',
] as const satisfies readonly OrganisationTab[];

const TAB_LABELS: Record<OrganisationTab, string> = {
  overview: 'Overview',
  verification: 'Verification',
  branches: 'Branches',
  members: 'Members',
  classes: 'Classes',
  finance: 'Finance',
};

const tabParam = enumParam(TAB_IDS, 'overview');
const memberPageParam = numberParam(0);
const obligationStatusParam = stringParam('any');

/** Initials for the monogram, e.g. "Nairobi Music Academy" becomes NM. */
function monogram(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase() ?? '')
      .join('') || '??'
  );
}

export function AdminOrganisationPage({ uuid }: { uuid: string }) {
  const [tab] = useSearchState<OrganisationTab>('tab', tabParam);
  const [memberPage, setMemberPage] = useSearchState('page', memberPageParam);
  const [obligationStatus, setObligationStatus] = useSearchState('status', obligationStatusParam);

  const { organisation, query } = useOrganisation(uuid);
  // Branches feed the overview, the verification checks and the branch manager itself.
  const needsRecordData = tab === 'overview' || tab === 'verification' || tab === 'branches';

  // The statistics endpoint builds three full member lists server-side, so only the
  // Overview tab asks for it. Verification reuses the answer when it is already cached.
  const { statistics, query: statisticsQuery } = useOrganisationStatistics(
    uuid,
    tab === 'overview'
  );
  const { branches, query: branchesQuery } = useOrganisationBranches(uuid, needsRecordData);
  const { documents, query: documentsQuery } = useOrganisationDocuments(
    uuid,
    tab === 'verification'
  );
  const { documentTypes } = useDocumentTypes('ORGANISATION', tab === 'verification');

  // Members also need the branch list, so a role change can move someone between them.
  const membersEnabled = tab === 'members';
  const { branches: memberBranches } = useOrganisationBranches(uuid, membersEnabled);
  const {
    members,
    totalRows: memberTotal,
    pageCount: memberPages,
    query: membersQuery,
  } = useOrganisationMembers(uuid, memberPage, membersEnabled);
  const { invitations, query: invitationsQuery } = useOrganisationInvitations(uuid, membersEnabled);

  const classesEnabled = tab === 'classes';
  const { classes, query: classesQuery } = useOrganisationClasses(uuid, classesEnabled);
  const { counts: enrolmentCounts } = useOrganisationEnrolmentCounts(uuid, classesEnabled);
  const { instructors, query: instructorsQuery } = useOrganisationInstructors(uuid, classesEnabled);

  const financeEnabled = tab === 'finance';
  const { obligations, query: obligationsQuery } = useOrganisationObligations(
    uuid,
    obligationStatus,
    financeEnabled
  );
  const { settlements, query: settlementsQuery } = useOrganisationSettlements(uuid, financeEnabled);
  const { payables, query: payablesQuery } = useOrganisationPayables(uuid, financeEnabled);
  const { skillsFund, query: skillsFundQuery } = useOrganisationSkillsFund(uuid, financeEnabled);

  const tabs = TAB_IDS.map(id => ({
    id,
    label: TAB_LABELS[id],
    href: adminRoutes.organisation(uuid, id),
  }));

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionBoundary
          label='this organisation'
          loading={query.isLoading && !organisation}
          error={query.error}
          onRetry={query.refetch}
          skeleton={<SectionCardSkeleton rows={2} />}
          empty={!query.isLoading && !organisation}
          emptyTitle='Organisation not found'
          emptyDescription='It may have been deleted since this link was made.'
        >
          {organisation ? (
            <RecordHeader
              initials={monogram(organisation.name)}
              title={organisation.name}
              facts={[
                organisation.slug ? (
                  <span className='font-mono text-xs'>{organisation.slug}</span>
                ) : null,
                [organisation.location, organisation.country].filter(Boolean).join(', ') || null,
                organisation.licence_no ? `Licence ${organisation.licence_no}` : null,
                `Registered ${formatDate(organisation.created_date) || '—'}`,
              ].filter(Boolean)}
              badges={[
                organisation.admin_verified
                  ? { label: 'Verified', tone: 'success' as const }
                  : organisation.verification_requested_at
                    ? { label: 'Awaiting review', tone: 'warning' as const }
                    : { label: 'Not submitted', tone: 'neutral' as const },
                organisation.active
                  ? { label: 'Active', tone: 'success' as const }
                  : { label: 'Suspended', tone: 'destructive' as const },
              ]}
            />
          ) : null}
        </SectionBoundary>

        <UnderlineTabs tabs={tabs} active={tab} />

        {organisation && tab === 'overview' ? (
          <div className='flex flex-col gap-4'>
            <SectionBoundary
              label='the membership counts'
              loading={statisticsQuery.isLoading}
              error={statisticsQuery.error}
              onRetry={statisticsQuery.refetch}
              skeleton={
                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                  {[0, 1, 2, 3].map(item => (
                    <StatCardSkeleton key={item} />
                  ))}
                </div>
              }
            >
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <StatCard
                  label='Members'
                  value={toNumber(statistics?.total_members)}
                  icon={Building2}
                />
                <StatCard label='Students' value={toNumber(statistics?.total_students)} />
                <StatCard label='Instructors' value={toNumber(statistics?.total_instructors)} />
                <StatCard label='Branches' value={toNumber(statistics?.total_branches)} />
              </div>
            </SectionBoundary>

            <SectionCard title='Organisation details'>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Name', value: organisation.name },
                  { label: 'Licence no.', value: organisation.licence_no || '—' },
                  { label: 'Location', value: organisation.location || '—' },
                  { label: 'Country', value: organisation.country || '—' },
                  {
                    label: 'Slug',
                    value: <span className='font-mono text-xs'>{organisation.slug || '—'}</span>,
                  },
                  {
                    label: 'Coordinates',
                    value:
                      organisation.latitude !== null && organisation.longitude !== null ? (
                        <span className='font-mono text-xs'>
                          {organisation.latitude}, {organisation.longitude}
                        </span>
                      ) : (
                        'No pin set'
                      ),
                  },
                  { label: 'Registered', value: formatDate(organisation.created_date) || '—' },
                  {
                    label: 'Verification requested',
                    value: organisation.verification_requested_at
                      ? formatDate(organisation.verification_requested_at)
                      : 'Never submitted',
                  },
                  { label: 'Last updated', value: formatDate(organisation.updated_date) || '—' },
                ]}
              />
              {organisation.description ? (
                <p className='text-muted-foreground mt-4 text-sm'>{organisation.description}</p>
              ) : null}
            </SectionCard>

            <SectionCard title='Branches' description='Where this organisation teaches.'>
              <SectionBoundary
                label='the branches'
                loading={branchesQuery.isLoading}
                error={branchesQuery.error}
                empty={branches.length === 0}
                onRetry={branchesQuery.refetch}
                emptyTitle='No branches yet'
                emptyDescription='This organisation has not registered a training branch.'
              >
                <ul className='flex flex-col gap-2'>
                  {branches.map(branch => (
                    <li
                      key={branch.uuid}
                      className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='text-foreground text-sm font-medium'>{branch.branch_name}</p>
                        <p className='text-muted-foreground text-xs'>
                          {branch.address || 'No address recorded'}
                        </p>
                      </div>
                      {branch.latitude === null || branch.longitude === null ? (
                        <StatusBadge label='Pin missing' tone='warning' />
                      ) : null}
                      <StatusBadge status={branch.active ? 'active' : 'inactive'} />
                    </li>
                  ))}
                </ul>
              </SectionBoundary>
            </SectionCard>
          </div>
        ) : null}

        {organisation && tab === 'verification' ? (
          <OrganisationVerificationTab
            organisation={organisation}
            documents={documents}
            documentTypes={documentTypes}
            branches={branches}
            statistics={statistics}
            documentsQuery={documentsQuery}
            branchesQuery={branchesQuery}
          />
        ) : null}

        {organisation && tab === 'branches' ? (
          <BranchesTab
            organisation={organisation}
            branches={branches}
            branchesQuery={branchesQuery}
          />
        ) : null}

        {organisation && tab === 'members' ? (
          <MembersTab
            organisation={organisation}
            members={members}
            branches={memberBranches}
            invitations={invitations}
            membersQuery={{
              isLoading: membersQuery.isLoading,
              error: membersQuery.error,
              refetch: membersQuery.refetch,
              page: memberPage,
              pageCount: memberPages,
              totalRows: memberTotal,
              onPageChange: setMemberPage,
            }}
            invitationsQuery={invitationsQuery}
          />
        ) : null}

        {organisation && tab === 'classes' ? (
          <ClassesTab
            classes={classes}
            enrolmentCounts={enrolmentCounts}
            instructors={instructors}
            classesQuery={classesQuery}
            instructorsQuery={instructorsQuery}
          />
        ) : null}

        {organisation && tab === 'finance' ? (
          <FinanceTab
            organisation={organisation}
            obligations={obligations}
            settlements={settlements}
            payables={payables}
            skillsFund={skillsFund}
            status={obligationStatus}
            onStatusChange={setObligationStatus}
            obligationsQuery={obligationsQuery}
            settlementsQuery={settlementsQuery}
            payablesQuery={payablesQuery}
            skillsFundQuery={skillsFundQuery}
          />
        ) : null}
      </div>
    </div>
  );
}
