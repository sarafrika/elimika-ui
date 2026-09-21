'use client';

import { useMemo, useState } from 'react';

import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import type { User } from '@/services/client';
import { AuditTab } from '../components/audit-tab';
import { ConfirmDialog } from '../components/confirm-dialog';
import { LearningTab } from '../components/learning-tab';
import { MoneyTab } from '../components/money-tab';
import { OverviewTab } from '../components/overview-tab';
import { SectionBoundary } from '../components/section-boundary';
import { RecordHeader, type RecordBadge } from '../components/record-header';
import { TeachingTab } from '../components/teaching-tab';
import { UnderlineTabs, type UnderlineTab } from '../components/underline-tabs';
import { VerificationTab } from '../components/verification-tab';
import { useSavePerson } from '../hooks/use-person-actions';
import {
  useDocumentTypes,
  useInstructorDocuments,
  useInstructorProfile,
  usePersonRecord,
  useStudentProfile,
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
  // Only the tabs that need a learner profile ask for one.
  const { student } = useStudentProfile(userUuid, tab === 'learning' || tab === 'money' || tab === 'audit');
  const { save, isPending: isSaving } = useSavePerson(person);
  const [accountAction, setAccountAction] = useState<'deactivate' | 'reactivate' | null>(null);

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
            actions={
              person ? (
                <Button
                  variant={person.active ? 'outline' : 'default'}
                  className='rounded-md'
                  onClick={() => setAccountAction(person.active ? 'deactivate' : 'reactivate')}
                >
                  {person.active ? 'Deactivate account' : 'Reactivate account'}
                </Button>
              ) : null
            }
          />
        </SectionBoundary>

        <UnderlineTabs
          tabs={tabs}
          active={tab}
          className='sticky top-0 z-10 bg-background'
        />

        {tab === 'overview' ? (
          <OverviewTab
            person={person}
            loading={personQuery.isLoading && !personQuery.data}
            error={personQuery.error}
            onRetry={() => personQuery.refetch()}
          />
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

        {tab === 'teaching' ? (
          <TeachingTab
            instructor={instructor}
            loading={instructorQuery.isLoading && !instructorQuery.data}
            personName={name}
          />
        ) : null}

        {tab === 'learning' ? (
          <LearningTab
            student={student}
            loading={personQuery.isLoading && !personQuery.data}
            personName={name}
          />
        ) : null}

        {tab === 'money' ? (
          <MoneyTab
            userUuid={userUuid}
            student={student}
            loading={personQuery.isLoading && !personQuery.data}
          />
        ) : null}

        {tab === 'audit' ? (
          <AuditTab
            userUuid={userUuid}
            targetUuids={[student?.uuid, instructor?.uuid].filter(Boolean) as string[]}
          />
        ) : null}

        {person ? (
          <ConfirmDialog
            open={accountAction !== null}
            onOpenChange={open => setAccountAction(open ? accountAction : null)}
            action={accountAction === 'reactivate' ? 'reactivateAccount' : 'deactivateAccount'}
            subject={{ name: name || 'this person', confirmValue: person.username }}
            isPending={isSaving}
            onConfirm={() =>
              save(
                { active: accountAction === 'reactivate' },
                {
                  successMessage:
                    accountAction === 'reactivate' ? 'Account reactivated' : 'Account deactivated',
                  onDone: () => setAccountAction(null),
                }
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
}

