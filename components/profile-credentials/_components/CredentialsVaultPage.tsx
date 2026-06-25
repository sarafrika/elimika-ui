'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { UserProfileType } from '@/lib/types';
import {
  deleteCourseCreatorDocumentMutation,
  deleteCourseCreatorEducationMutation,
  deleteCourseCreatorExperienceMutation,
  deleteCourseCreatorMembershipMutation,
  deleteInstructorDocumentMutation,
  deleteInstructorEducationMutation,
  deleteInstructorExperienceMutation,
  deleteInstructorMembershipMutation,
  getCourseCreatorDocumentsOptions,
  getCourseCreatorEducationOptions,
  getCourseCreatorExperienceOptions,
  getCourseCreatorMembershipsOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  getStudentCertificatesOptions,
  listDocumentTypesOptions
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  CourseCreatorDocumentDto,
  CourseCreatorEducation,
  CourseCreatorExperience,
  CourseCreatorProfessionalMembership,
  DocumentTypeOption,
  InstructorDocument,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
} from '@/services/client/types.gen';
import { useOrganisation } from '../../../context/organisation-context';
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

const PAGEABLE = { page: 0, size: 200 };
type CredentialListItem = ReturnType<typeof buildCredentialsContent>['credentialsByTab'][CredentialsTabId][number];
type OptionalGeneratedQueryOptions = {
  queryKey: readonly unknown[];
  queryFn?: unknown;
};

function useOptionalGeneratedQuery(
  options: OptionalGeneratedQueryOptions | null,
  disabledKey: readonly unknown[]
) {
  return useQuery({
    queryKey: options?.queryKey ?? disabledKey,
    queryFn: context =>
      typeof options?.queryFn === 'function'
        ? Promise.resolve(options.queryFn(context as never))
        : Promise.resolve(null),
    enabled: Boolean(options),
  });
}

export function CredentialsVaultPage({ role }: CredentialsVaultPageProps) {
  const user = useUserProfile();
  const organisation = useOrganisation();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<CredentialsStatusFilter>('all');
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const canManageCredentials = role === 'instructor' || role === 'course_creator';

  const profile =
    role === 'instructor'
      ? user?.instructor
      : role === 'course_creator'
        ? user?.courseCreator
        : role === 'organisation'
          ? organisation
          : user?.student;
  const profileData =
    role === 'organisation' && organisation
      ? ({ ...(user ?? {}), organizations: [organisation] } as UserProfileType)
      : (user as UserProfileType | undefined);

  const profileUuid = profile?.uuid;
  const studentCertificatesOptions =
    role === 'student' && profileUuid
      ? getStudentCertificatesOptions({ path: { studentUuid: profileUuid } })
      : null;
  const studentCertificatesQuery = useOptionalGeneratedQuery(studentCertificatesOptions, [
    'credentials',
    'student-certificates',
    'disabled',
  ]);

  const instructorDocumentsOptions =
    role === 'instructor' && profileUuid
      ? getInstructorDocumentsOptions({ path: { instructorUuid: profileUuid } })
      : null;
  const instructorDocumentsQuery = useOptionalGeneratedQuery(instructorDocumentsOptions, [
    'credentials',
    'instructor-documents',
    'disabled',
  ]);

  const courseCreatorDocumentsOptions =
    role === 'course_creator' && profileUuid
      ? getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid: profileUuid } })
      : null;
  const courseCreatorDocumentsQuery = useOptionalGeneratedQuery(courseCreatorDocumentsOptions, [
    'credentials',
    'course-creator-documents',
    'disabled',
  ]);

  const instructorEducationOptions =
    role === 'instructor' && profileUuid
      ? getInstructorEducationOptions({ path: { instructorUuid: profileUuid } })
      : null;
  const instructorEducationQuery = useOptionalGeneratedQuery(instructorEducationOptions, [
    'credentials',
    'instructor-education',
    'disabled',
  ]);
  const instructorMembershipsOptions =
    role === 'instructor' && profileUuid
      ? getInstructorMembershipsOptions({
          path: { instructorUuid: profileUuid },
          query: { pageable: PAGEABLE },
        })
      : null;
  const instructorMembershipsQuery = useOptionalGeneratedQuery(instructorMembershipsOptions, [
    'credentials',
    'instructor-memberships',
    'disabled',
  ]);
  const instructorExperienceOptions =
    role === 'instructor' && profileUuid
      ? getInstructorExperienceOptions({
          path: { instructorUuid: profileUuid },
          query: { pageable: PAGEABLE },
        })
      : null;
  const instructorExperienceQuery = useOptionalGeneratedQuery(instructorExperienceOptions, [
    'credentials',
    'instructor-experience',
    'disabled',
  ]);

  const courseCreatorEducationOptions =
    role === 'course_creator' && profileUuid
      ? getCourseCreatorEducationOptions({
          path: { courseCreatorUuid: profileUuid },
          query: { pageable: PAGEABLE },
        })
      : null;
  const courseCreatorEducationQuery = useOptionalGeneratedQuery(courseCreatorEducationOptions, [
    'credentials',
    'course-creator-education',
    'disabled',
  ]);
  const courseCreatorMembershipsOptions =
    role === 'course_creator' && profileUuid
      ? getCourseCreatorMembershipsOptions({
          path: { courseCreatorUuid: profileUuid },
          query: { pageable: PAGEABLE },
        })
      : null;
  const courseCreatorMembershipsQuery = useOptionalGeneratedQuery(courseCreatorMembershipsOptions, [
    'credentials',
    'course-creator-memberships',
    'disabled',
  ]);
  const courseCreatorExperienceOptions =
    role === 'course_creator' && profileUuid
      ? getCourseCreatorExperienceOptions({
          path: { courseCreatorUuid: profileUuid },
          query: { pageable: PAGEABLE },
        })
      : null;
  const courseCreatorExperienceQuery = useOptionalGeneratedQuery(courseCreatorExperienceOptions, [
    'credentials',
    'course-creator-experience',
    'disabled',
  ]);

  const documentTypesQuery = useQuery({
    ...listDocumentTypesOptions(),
    enabled: canManageCredentials,
  });

  const deleteInstructorDocument = useMutation(deleteInstructorDocumentMutation());
  const deleteCourseCreatorDocument = useMutation(deleteCourseCreatorDocumentMutation());
  const deleteInstructorEducation = useMutation(deleteInstructorEducationMutation());
  const deleteInstructorMembership = useMutation(deleteInstructorMembershipMutation());
  const deleteInstructorExperience = useMutation(deleteInstructorExperienceMutation());
  const deleteCourseCreatorEducation = useMutation(deleteCourseCreatorEducationMutation());
  const deleteCourseCreatorMembership = useMutation(deleteCourseCreatorMembershipMutation());
  const deleteCourseCreatorExperience = useMutation(deleteCourseCreatorExperienceMutation());

  const documents =
    role === 'instructor'
      ? extractList<InstructorDocument>(instructorDocumentsQuery.data)
      : role === 'course_creator'
        ? extractList<CourseCreatorDocumentDto>(courseCreatorDocumentsQuery.data)
        : [];
  const certificates =
    role === 'student' ? extractList<Certificate>(studentCertificatesQuery.data) : [];
  const instructorEducations =
    role === 'instructor'
      ? extractList<InstructorEducation>(instructorEducationQuery.data)
      : [];
  const instructorMemberships =
    role === 'instructor'
      ? extractPage<InstructorProfessionalMembership>(instructorMembershipsQuery.data).items
      : [];
  const instructorExperiences =
    role === 'instructor'
      ? extractPage<InstructorExperience>(instructorExperienceQuery.data).items
      : [];
  const courseCreatorEducations =
    role === 'course_creator'
      ? extractPage<CourseCreatorEducation>(courseCreatorEducationQuery.data).items
      : [];
  const courseCreatorMemberships =
    role === 'course_creator'
      ? extractPage<CourseCreatorProfessionalMembership>(courseCreatorMembershipsQuery.data).items
      : [];
  const courseCreatorExperiences =
    role === 'course_creator'
      ? extractPage<CourseCreatorExperience>(courseCreatorExperienceQuery.data).items
      : [];

  const documentTypes = extractList<DocumentTypeOption>(documentTypesQuery.data);

  const content = buildCredentialsContent({
    role,
    profile: profileData,
    documents,
    certificates,
    educationRecords:
      role === 'instructor' ? instructorEducations : courseCreatorEducations,
    membershipRecords:
      role === 'instructor' ? instructorMemberships : courseCreatorMemberships,
    experienceRecords:
      role === 'instructor' ? instructorExperiences : courseCreatorExperiences,
    documentTypes,
    searchValue,
    statusFilter,
  });

  const refreshDocuments = async () => {
    if (role === 'instructor' && profileUuid) {
      await Promise.all([
        instructorDocumentsQuery.refetch(),
        instructorEducationQuery.refetch(),
        instructorMembershipsQuery.refetch(),
        instructorExperienceQuery.refetch(),
      ]);
      return;
    }

    if (role === 'course_creator' && profileUuid) {
      await Promise.all([
        courseCreatorDocumentsQuery.refetch(),
        courseCreatorEducationQuery.refetch(),
        courseCreatorMembershipsQuery.refetch(),
        courseCreatorExperienceQuery.refetch(),
      ]);
      return;
    }

    if (role === 'student' && profileUuid) {
      await studentCertificatesQuery.refetch();
    }
  };

  const removeCredential = async (item: CredentialListItem) => {
    if (!profileUuid) return;
    if (!item.documentUuid && !item.recordUuid) {
      toast.error('This credential is missing identifiers.');
      return;
    }

    const confirmed = confirm(
      item.recordKind
        ? `Delete this ${item.recordKind} and its linked document?`
        : 'Delete this document?'
    );
    if (!confirmed) return;

    try {
      if (role === 'instructor') {
        if (item.documentUuid) {
          await deleteInstructorDocument.mutateAsync({
            path: { instructorUuid: profileUuid, documentUuid: item.documentUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'education') {
          await deleteInstructorEducation.mutateAsync({
            path: { instructorUuid: profileUuid, educationUuid: item.recordUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'membership') {
          await deleteInstructorMembership.mutateAsync({
            path: { instructorUuid: profileUuid, membershipUuid: item.recordUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'experience') {
          await deleteInstructorExperience.mutateAsync({
            path: { instructorUuid: profileUuid, experienceUuid: item.recordUuid },
          });
        }
      } else if (role === 'course_creator') {
        if (item.documentUuid) {
          await deleteCourseCreatorDocument.mutateAsync({
            path: { courseCreatorUuid: profileUuid, documentUuid: item.documentUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'education') {
          await deleteCourseCreatorEducation.mutateAsync({
            path: { courseCreatorUuid: profileUuid, educationUuid: item.recordUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'membership') {
          await deleteCourseCreatorMembership.mutateAsync({
            path: { courseCreatorUuid: profileUuid, membershipUuid: item.recordUuid },
          });
        }

        if (item.recordUuid && item.recordKind === 'experience') {
          await deleteCourseCreatorExperience.mutateAsync({
            path: { courseCreatorUuid: profileUuid, experienceUuid: item.recordUuid },
          });
        }
      }

      await refreshDocuments();
      toast.success('Credential deleted successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete this credential.');
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
          onAddClick={canManageCredentials ? () => setIsUploadSheetOpen(true) : undefined}
        />

        <Tabs defaultValue='all' className='gap-4'>
          <CredentialsTabs tabs={content.tabs} />

          {content.tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4'>
              <CredentialsPanel
                profile={profileData}
                badges={content.summary.badges}
                blockchain={content.summary.blockchain}
                shares={content.summary.shares}
                role={role}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                items={content.credentialsByTab[tab.id as CredentialsTabId]}
                timeline={content.timeline}
                onDeleteItem={canManageCredentials ? removeCredential : undefined}
                deleting={
                  deleteInstructorDocument.isPending ||
                  deleteCourseCreatorDocument.isPending ||
                  deleteInstructorEducation.isPending ||
                  deleteInstructorMembership.isPending ||
                  deleteInstructorExperience.isPending ||
                  deleteCourseCreatorEducation.isPending ||
                  deleteCourseCreatorMembership.isPending ||
                  deleteCourseCreatorExperience.isPending
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {canManageCredentials ? (
        <CredentialsUploadSheet
          open={isUploadSheetOpen}
          onOpenChange={setIsUploadSheetOpen}
          role={role}
          profileUuid={profileUuid}
          documentTypes={documentTypes}
          onSaved={refreshDocuments}
        />
      ) : null}
    </main>
  );
}

type CredentialsPanelProps = {
  profile?: UserProfileType;
  badges: string;
  blockchain: string;
  shares: string;
  role: CredentialsRole;
  statusFilter: CredentialsStatusFilter;
  onStatusFilterChange: (value: CredentialsStatusFilter) => void;
  items: ReturnType<typeof buildCredentialsContent>['credentialsByTab'][CredentialsTabId];
  timeline: ReturnType<typeof buildCredentialsContent>['timeline'];
  onDeleteItem?: (item: CredentialListItem) => void;
  deleting?: boolean;
};

function CredentialsPanel({
  profile,
  badges,
  blockchain,
  shares,
  role,
  statusFilter,
  onStatusFilterChange,
  items,
  timeline,
  onDeleteItem,
  deleting,
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
                <CredentialCertificateCard
                  key={item.id}
                  item={item}
                  ownerName={profile?.full_name as string}
                  onDelete={onDeleteItem}
                  isDeleting={deleting}
                />
              ))}
            </div>
          ) : (
            <EmptyVaultState role={role} />
          )}
        </div>
      </section>

      <GrowthTimelineSection items={timeline} ownerName={profile?.full_name as string}
      />
    </>
  );
}

function EmptyVaultState({ role }: { role?: CredentialsRole }) {
  const isStudent = role === 'student';
  const isOrganisation = role === 'organisation';

  return (
    <div className='min-h-[360px]'>
      <div className='border-border/60 bg-card/90 flex h-full min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-dashed px-6 py-10 text-center shadow-sm'>
        <div className='bg-primary/10 text-primary mb-4 grid size-14 place-items-center rounded-full'>
          <FileText className='size-7' />
        </div>

        <div className='space-y-2'>
          <h3 className='text-foreground text-xl font-semibold'>
            {isStudent ? 'No certificates yet' : 'No credentials yet'}
          </h3>

          <p className='text-muted-foreground max-w-md text-sm leading-6'>
            {isStudent
              ? 'Certificates you acquired on Elimika platform will appear here once they are verified.'
              : isOrganisation
                ? 'Validation documents and approvals linked to this organisation will appear here when available.'
              : 'Uploaded documents will appear here once they are added and verified.'}
          </p>
        </div>
      </div>
    </div>
  );
}
