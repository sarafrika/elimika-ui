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
import { enumParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { OrganisationVerificationTab } from '../components/organisation-verification-tab';
import { RecordHeader } from '../components/record-header';
import { SectionBoundary } from '../components/section-boundary';
import { UnderlineTabs } from '../components/underline-tabs';
import {
  useDocumentTypes,
  useOrganisation,
  useOrganisationBranches,
  useOrganisationDocuments,
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

  const { organisation, query } = useOrganisation(uuid);
  const needsRecordData = tab === 'overview' || tab === 'verification';

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

        {organisation && tab !== 'overview' && tab !== 'verification' ? (
          <SectionCard
            title={`${TAB_LABELS[tab]} lands in P3`}
            description='This tab is designed but not built yet.'
          >
            <p className='text-muted-foreground text-sm'>
              Overview and Verification are live. Branch management, members, classes and finance
              arrive with the people and organisations phase.
            </p>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
