'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useState } from 'react';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import type { UserProfileType } from '@/lib/types';
import {
  getCourseCreatorDocumentsOptions,
  getInstructorDocumentsOptions,
  listDocumentTypesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseCreatorDocumentDto,
  DocumentTypeOption,
  InstructorDocument,
} from '@/services/client/types.gen';

import type { CredentialsRole, CredentialsStatusFilter, CredentialsTabId } from '../data';
import { buildCredentialsContent } from '../live-data';
import { CredentialCertificateCard } from './CredentialCertificateCard';
import { CredentialsHeader } from './CredentialsHeader';
import { CredentialsTabs } from './CredentialsTabs';
import { CredentialsUploadSheet } from './CredentialsUploadSheet';
import { GrowthTimelineSection } from './GrowthTimelineSection';
import { ProfileOverviewCard } from './ProfileOverviewCard';
import { VaultHighlights } from './VaultHighlights';

type CredentialsVaultPageProps = {
  role: CredentialsRole;
};

export function CredentialsVaultPage({ role }: CredentialsVaultPageProps) {
  const user = useUserProfile();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<CredentialsStatusFilter>('all');
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);

  const profile =
    role === 'instructor'
      ? user?.instructor
      : role === 'course_creator'
        ? user?.courseCreator
        : user?.student;
  const profileData = user as UserProfileType | undefined;

  const profileUuid = profile?.uuid;

  const instructorDocumentsQuery = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: profileUuid ?? '' } }),
    enabled: role === 'instructor' && !!profileUuid,
  });

  const courseCreatorDocumentsQuery = useQuery({
    ...getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid: profileUuid ?? '' } }),
    enabled: role === 'course_creator' && !!profileUuid,
  });

  const documentTypesQuery = useQuery({
    ...listDocumentTypesOptions(),
  });

  const documents =
    role === 'instructor'
      ? ((instructorDocumentsQuery.data?.data ?? []) as InstructorDocument[])
      : role === 'course_creator'
        ? ((courseCreatorDocumentsQuery.data?.data ?? []) as CourseCreatorDocumentDto[])
        : [];

  const documentTypes = (documentTypesQuery.data?.data ?? []) as DocumentTypeOption[];

  const content = buildCredentialsContent({
    role,
    profile: profileData,
    documents,
    documentTypes,
    searchValue,
    statusFilter,
  });

  const refreshDocuments = async () => {
    if (role === 'instructor' && profileUuid) {
      await instructorDocumentsQuery.refetch();
      return;
    }

    if (role === 'course_creator' && profileUuid) {
      await courseCreatorDocumentsQuery.refetch();
    }
  };

  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,var(--el-accent-azure)_4%),color-mix(in_srgb,var(--background)_94%,white_6%))] px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-[1520px] flex-col gap-4'>
        <CredentialsHeader
          title={content.pageTitle}
          description={content.pageDescription}
          searchPlaceholder={content.searchPlaceholder}
          addLabel={content.addLabel}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAddClick={() => setIsUploadSheetOpen(true)}
        />

        <Tabs defaultValue='all' className='gap-4'>
          <CredentialsTabs tabs={content.tabs} />

          {content.tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4'>
              <CredentialsPanel
                profile={content.profile}
                badges={content.summary.badges}
                blockchain={content.summary.blockchain}
                shares={content.summary.shares}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                items={content.credentialsByTab[tab.id as CredentialsTabId]}
                timeline={content.timeline}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <CredentialsUploadSheet
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
        role={role}
        profileUuid={profileUuid}
        documentTypes={documentTypes}
        onSaved={refreshDocuments}
      />
    </main>
  );
}

type CredentialsPanelProps = {
  profile: ReturnType<typeof buildCredentialsContent>['profile'];
  badges: string;
  blockchain: string;
  shares: string;
  statusFilter: CredentialsStatusFilter;
  onStatusFilterChange: (value: CredentialsStatusFilter) => void;
  items: ReturnType<typeof buildCredentialsContent>['credentialsByTab'][CredentialsTabId];
  timeline: ReturnType<typeof buildCredentialsContent>['timeline'];
};

function CredentialsPanel({
  profile,
  badges,
  blockchain,
  shares,
  statusFilter,
  onStatusFilterChange,
  items,
  timeline,
}: CredentialsPanelProps) {
  return (
    <>
      <section className='grid gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]'>
        <ProfileOverviewCard profile={profile} />

        <div className='space-y-4'>
          <VaultHighlights
            badges={badges}
            blockchain={blockchain}
            shares={shares}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
          />
          {items.length > 0 ? (
            <div className='grid gap-4 xl:grid-cols-2'>
              {items.map(item => (
                <CredentialCertificateCard key={item.id} item={item} ownerName={profile.name} />
              ))}
            </div>
          ) : (
            <EmptyVaultState />
          )}
        </div>
      </section>

      <GrowthTimelineSection items={timeline} />
    </>
  );
}

function EmptyVaultState() {
  return (
    <div className='min-h-[360px]'>
      <div className='border-border/60 bg-card/90 flex h-full min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-dashed px-6 py-10 text-center shadow-sm'>
        <div className='bg-primary/10 text-primary mb-4 grid size-14 place-items-center rounded-full'>
          <FileText className='size-7' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-foreground text-xl font-semibold'>No credentials yet</h3>
          <p className='text-muted-foreground max-w-md text-sm leading-6'>
            Uploaded documents will appear here once they are added and verified.
          </p>
        </div>
      </div>
    </div>
  );
}
