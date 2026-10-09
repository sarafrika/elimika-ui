'use client';

import { useMemo } from 'react';
import { useCoursesByIds, useProgramsByIds } from '../../../../../hooks/use-batched-lookups';
import {
  type CertificateDetails,
  type StudentOverviewSection,
  uniqueIds,
  useStudentCertificates,
} from './useStudentOverviewData';

export type StudentCredentials = {
  certificates: CertificateDetails[];
  verifiedSkills: number;
};

/** Credentials card: certificates, then one batched course and program lookup each. */
export function useStudentCredentials(): StudentOverviewSection<StudentCredentials> {
  const certificatesQuery = useStudentCertificates();
  const { certificates } = certificatesQuery;

  const courseIds = useMemo(
    () => uniqueIds(certificates.map(certificate => certificate.course_uuid)),
    [certificates]
  );
  const programIds = useMemo(
    () => uniqueIds(certificates.map(certificate => certificate.program_uuid)),
    [certificates]
  );
  const { courseMap, isLoading: isLoadingCourses } = useCoursesByIds(courseIds);
  const { programMap, isLoading: isLoadingPrograms } = useProgramsByIds(programIds);

  const data = useMemo<StudentCredentials>(
    () => ({
      certificates: certificates.map(certificate => ({
        ...certificate,
        course: certificate.course_uuid ? (courseMap[certificate.course_uuid] ?? null) : null,
        program: certificate.program_uuid ? (programMap[certificate.program_uuid] ?? null) : null,
      })),
      verifiedSkills: certificates.filter(item => item.is_valid).length,
    }),
    [certificates, courseMap, programMap]
  );

  return {
    data,
    isLoading: certificatesQuery.isLoading || isLoadingCourses || isLoadingPrograms,
    error: certificatesQuery.error,
    refetch: () => {
      certificatesQuery.refetch();
    },
  };
}
