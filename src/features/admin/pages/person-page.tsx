'use client';

import { useMemo } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  surfaceTheme,
} from '@/components/data-display';
import { formatDate } from '@/lib/date';
import type { User } from '@/services/client';
import { SectionBoundary } from '../components/section-boundary';
import { RecordHeader, type RecordBadge } from '../components/record-header';
import { UnderlineTabs, type UnderlineTab } from '../components/underline-tabs';
import { VerificationTab } from '../components/verification-tab';
import {
  useDocumentTypes,
  useInstructorDocuments,
  useInstructorProfile,
  usePersonRecord,
} from '../hooks/use-person-record';
import { adminRoutes, type PersonTab } from '../lib/admin-routes';
import { enumParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const PERSON_TABS: PersonTab[] = [
  'overview',
  'verification',
  'teaching',
  'learning',
  'money',
  'audit',
];

const TAB_LABELS: Record<PersonTab, string> = {
  overview: 'Overview',
  verification: 'Verification',
  teaching: 'Teaching',
  learning: 'Learning',
  money: 'Money',
  audit: 'Audit trail',
};

const initialsOf = (person: User | null) => {
  const first = person?.first_name?.[0] ?? '';
  const last = person?.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || '··';
};

export function AdminPersonPage({ userUuid }: { userUuid: string }) {
  const [tab, setTab] = useSearchState('tab', enumParam(PERSON_TABS, 'overview'));
  const [reviewQueue] = useSearchState('review', stringParam());
  const [selectedItem, setSelectedItem] = useSearchState('item', stringParam());

  const { person, query: personQuery } = usePersonRecord(userUuid);
  const { instructor, query: instructorQuery } = useInstructorProfile(userUuid);
  const { documents, query: documentsQuery } = useInstructorDocuments(instructor?.uuid);
  const { byUuid, documentTypes } = useDocumentTypes();

  const requiredTypeUuids = useMemo(
    () => documentTypes.filter(type => type.is_required && type.uuid).map(type => type.uuid ?? ''),
    [documentTypes]
  );

  const name = person?.full_name ?? `${person?.first_name ?? ''} ${person?.last_name ?? ''}`.trim();
  const pendingDocuments = documents.filter(
    document => document.is_verified !== true && document.status !== 'APPROVED'
  ).length;

  const badges: RecordBadge[] = [{ status: person?.active ? 'active' : 'inactive' }];
  if (instructor) {
    badges.push({
      status: instructor.admin_verified ? 'verified' : 'pending',
      label: instructor.admin_verified
        ? 'Instructor · Verified'
        : 'Instructor · Verification pending',
    });
  }

  const tabs: UnderlineTab[] = PERSON_TABS.map(id => ({
    id,
    label: TAB_LABELS[id],
    count: id === 'verification' ? pendingDocuments : undefined,
    href: adminRoutes.person(userUuid, id),
  }));

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionBoundary
          label='this person'
          loading={personQuery.isLoading && !personQuery.data}
          error={personQuery.error}
          onRetry={() => personQuery.refetch()}
          skeleton={<SectionCardSkeleton rows={2} />}
        >
          <RecordHeader
            initials={initialsOf(person)}
            imageUrl={person?.profile_image_url}
            title={name || 'Person'}
            facts={[
              person?.email,
              person?.phone_number,
              person?.created_date ? `Member since ${formatDate(person.created_date)}` : null,
            ].filter(Boolean)}
            badges={badges}
          />
        </SectionBoundary>

        <UnderlineTabs
          tabs={tabs}
          active={tab}
          className='sticky top-0 z-10 bg-background'
        />

        {tab === 'overview' ? (
          <OverviewTab person={person} loading={personQuery.isLoading && !personQuery.data} />
        ) : null}

        {tab === 'verification' ? (
          <VerificationTab
            person={person}
            instructor={instructor}
            documents={documents}
            documentTypesByUuid={byUuid}
            requiredTypeUuids={requiredTypeUuids}
            loading={
              (instructorQuery.isLoading && !instructorQuery.data) ||
              (documentsQuery.isLoading && !documentsQuery.data)
            }
            error={instructorQuery.error ?? documentsQuery.error}
            onRetry={() => {
              void instructorQuery.refetch();
              void documentsQuery.refetch();
            }}
            selectedDocumentUuid={selectedItem}
            onSelectDocument={setSelectedItem}
            reviewQueue={reviewQueue}
          />
        ) : null}

        {tab !== 'overview' && tab !== 'verification' ? (
          <SectionCard title={TAB_LABELS[tab]}>
            <p className='text-muted-foreground text-sm'>
              This tab lands with the rest of the person record. Nothing is shown here yet rather
              than showing something that is not real.
            </p>
            <button
              type='button'
              className='text-primary mt-3 text-sm font-semibold'
              onClick={() => setTab('verification')}
            >
              Back to verification
            </button>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}

function OverviewTab({ person, loading }: { person: User | null; loading: boolean }) {
  const affiliations = person?.organisation_affiliations ?? [];

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <SectionBoundary
        label='the identity details'
        loading={loading}
        skeleton={<SectionCardSkeleton rows={4} />}
      >
        <SectionCard title='Identity & contact' description='Editing lands with the People section'>
          <DetailGrid
            columns={2}
            items={[
              { label: 'First name', value: person?.first_name ?? '—' },
              { label: 'Last name', value: person?.last_name ?? '—' },
              { label: 'Email', value: person?.email ?? '—' },
              { label: 'Username', value: person?.username ?? '—' },
              { label: 'Phone', value: person?.phone_number ?? '—' },
              { label: 'Date of birth', value: person?.dob ? formatDate(person.dob) : '—' },
              { label: 'Gender', value: person?.gender ?? '—' },
              { label: 'Account', value: person?.active ? 'Active' : 'Inactive' },
            ]}
          />
        </SectionCard>
      </SectionBoundary>

      <SectionBoundary
        label='the roles and affiliations'
        loading={loading}
        skeleton={<SectionCardSkeleton rows={3} />}
      >
        <SectionCard title='Roles & access'>
          <div className='flex flex-col gap-4'>
            <DetailGrid
              columns={2}
              items={[
                { label: 'User no.', value: person?.user_no ?? '—' },
                { label: 'Platform role', value: person?.user_domain ?? '—' },
                {
                  label: 'Joined',
                  value: person?.created_date ? formatDate(person.created_date) : '—',
                },
                {
                  label: 'Last updated',
                  value: person?.updated_date ? formatDate(person.updated_date) : '—',
                },
              ]}
            />
            <div>
              <p className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                Organisation affiliations
              </p>
              {affiliations.length ? (
                <ul className='flex flex-col gap-2'>
                  {affiliations.map((affiliation, index) => (
                    <li key={index} className='text-foreground text-sm'>
                      {affiliation.organisation_name}
                      <span className='text-muted-foreground'>
                        {' · '}
                        {affiliation.domain_in_organisation}
                        {affiliation.branch_name ? ` · ${affiliation.branch_name}` : ''}
                        {affiliation.active === false ? ' · inactive' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-muted-foreground text-sm'>No organisation affiliations.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </SectionBoundary>
    </div>
  );
}
