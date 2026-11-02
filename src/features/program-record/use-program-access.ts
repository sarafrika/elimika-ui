'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganisation, useOrganisationLoading } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import {
  searchProgramEnrollmentsOptions,
  searchProgramTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { ApplicantTypeEnum, type TrainingProgram } from '@/services/client/types.gen';
import { type CourseAccess, courseCapability } from '@/src/features/course-record/types';

/** Program relationships come from ownership, applications and enrollments, rather than role alone. */
export function useProgramAccess(
  programUuid: string,
  program: TrainingProgram | undefined,
  segment: string | null
): { access: CourseAccess; label: string; loading: boolean } {
  const profile = useUserProfile();
  const organisation = useOrganisation();
  const organisationLoading = useOrganisationLoading();
  const student = useStudent();
  const applicantUuid =
    segment === 'instructor'
      ? profile?.instructor?.uuid
      : segment === 'organisation'
        ? organisation?.uuid
        : undefined;
  const applicantType =
    segment === 'organisation' ? ApplicantTypeEnum.ORGANISATION : ApplicantTypeEnum.INSTRUCTOR;
  const applications = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: { page: 0, size: 1 },
        searchParams: {
          program_uuid_eq: programUuid,
          applicant_uuid_eq: applicantUuid,
          applicant_type_eq: applicantType,
        },
      },
    }),
    enabled: Boolean(programUuid && applicantUuid),
    staleTime: STALE_TIMES.entity,
    ...APPROVAL_QUERY_FRESHNESS,
  });
  const enrollment = useQuery({
    ...searchProgramEnrollmentsOptions({
      query: {
        pageable: { page: 0, size: 1 },
        searchParams: {
          program_uuid_eq: programUuid,
          student_uuid_eq: student?.uuid,
          status_in: 'ACTIVE,COMPLETED',
        },
      },
    }),
    enabled: Boolean(segment === 'student' && programUuid && student?.uuid),
    staleTime: STALE_TIMES.entity,
  });

  const application =
    applications.isError || applications.data?.error || applications.data?.success === false
      ? undefined
      : applications.data?.data?.content?.find(
          item =>
            item.program_uuid === programUuid &&
            item.applicant_uuid === applicantUuid &&
            item.applicant_type === applicantType
        );
  const hasEnrollment = Boolean(
    !enrollment.isError &&
      !enrollment.data?.error &&
      enrollment.data?.success !== false &&
      enrollment.data?.data?.content?.some(
        item =>
          item.program_uuid === programUuid &&
          item.student_uuid === student?.uuid &&
          (item.status === 'ACTIVE' || item.status === 'COMPLETED')
      )
  );
  const isOwner = Boolean(
    program?.course_creator_uuid && program.course_creator_uuid === profile?.courseCreator?.uuid
  );
  let access: CourseAccess = 'prospect';
  if (segment === 'admin' && profile?.user_domain?.includes('admin')) access = 'admin';
  else if (segment === 'course-creator' && isOwner) access = 'creator';
  else if (segment === 'student' && hasEnrollment) access = 'student';
  else if (applicantUuid) {
    if (application?.status === 'approved')
      access = segment === 'organisation' ? 'organisation' : 'instructor';
    else if (application?.status === 'pending') access = 'pending';
    else access = 'applicant';
  }

  const loading = Boolean(
    profile?.isLoading ||
      !program ||
      (segment === 'organisation' && organisationLoading) ||
      (applicantUuid && applications.isLoading) ||
      (segment === 'student' && student?.uuid && enrollment.isLoading)
  );
  let label = courseCapability(access).accessLabel;
  if (access === 'creator') label = 'Programme owner — full access';
  if (access === 'student') label = 'Enrolled in programme — reading access';
  if (access === 'instructor' || access === 'organisation') label = 'Approved to train this programme';
  if (access === 'pending') label = 'Programme preview — application pending';
  if (access === 'applicant') label = 'Programme preview — not approved to train';
  if (access === 'prospect') label = 'Programme preview — not enrolled';
  if (segment === 'course-creator' && !isOwner) label = 'Programme preview — not the owner';
  if (application?.status === 'rejected') label = 'Programme preview — application rejected';
  if (application?.status === 'revoked') label = 'Programme preview — training approval revoked';
  if (
    (applicantUuid &&
      (applications.isError || applications.data?.error || applications.data?.success === false)) ||
    (segment === 'student' &&
      (enrollment.isError || enrollment.data?.error || enrollment.data?.success === false))
  )
    label = 'Programme preview — access could not be verified';

  return { access, label, loading };
}
