'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type {
  AdminUserActivityEvent,
  BookingResponse,
  Certificate,
  ClassDefinition,
  ClassDefinitionResponse,
  ClassMarketplaceJobApplication,
  CourseCreator,
  DocumentTypeOption,
  Enrollment,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorRatingSummary,
  InstructorReview,
  RevenueSaleLineItemDto,
  Student,
  StudentEnrollmentOverview,
  User,
  WalletTransaction,
} from '@/services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getEnrollmentOverviewForStudentOptions,
  getInstructorBookingsOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorRatingSummaryOptions,
  getInstructorReviewsOptions,
  getScheduledInstanceEnrollmentsForStudentOptions,
  getStudentCertificatesOptions,
  getUserActivityOptions,
  getUserByUuidOptions,
  isUserAdminOptions,
  isUserSystemAdminOptions,
  listDocumentTypesOptions,
  listInstructorApplicationsOptions,
  listSalesOptions,
  listTransactions1Options,
  searchCourseCreatorsOptions,
  searchInstructorsOptions,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { configQuery, listQuery, queueQuery } from '../lib/admin-queries';

const SINGLE_PROFILE_PAGE = { page: 0, size: 1 };

/** The person behind the record: name, contact, roles and affiliations. */
export function usePersonRecord(userUuid: string) {
  const query = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userUuid } }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const person = useMemo(() => extractEntity<User>(query.data), [query.data]);
  return { person, query };
}

/**
 * The instructor profile for a user, if they have one. There is no lookup by user uuid,
 * so this searches for it. The response is typed as a page but arrives wrapped, so it is
 * normalised defensively.
 */
export function useInstructorProfile(userUuid: string) {
  const query = useQuery({
    ...searchInstructorsOptions({
      query: { searchParams: { user_uuid: userUuid }, pageable: SINGLE_PROFILE_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const instructor = useMemo(
    () => extractPage<Instructor>(query.data).items[0] ?? null,
    [query.data]
  );
  return { instructor, query };
}

/** The course-creator profile for a user, if they have one. */
export function useCourseCreatorProfile(userUuid: string) {
  const query = useQuery({
    ...searchCourseCreatorsOptions({
      query: { searchParams: { user_uuid: userUuid }, pageable: SINGLE_PROFILE_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const courseCreator = useMemo(
    () => extractPage<CourseCreator>(query.data).items[0] ?? null,
    [query.data]
  );
  return { courseCreator, query };
}

/** Every document the instructor has uploaded, verified or not. */
export function useInstructorDocuments(instructorUuid?: string) {
  const query = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid),
  });

  const documents = useMemo(() => {
    const list = extractList<InstructorDocument>(query.data);
    if (list.length) return list;
    return extractPage<InstructorDocument>(query.data).items;
  }, [query.data]);

  return { documents, query };
}

/** Qualifications claimed on the profile, used to check a certificate against the record. */
export function useInstructorEducation(instructorUuid?: string, enabled = true) {
  const query = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const education = useMemo(() => {
    const list = extractList<InstructorEducation>(query.data);
    if (list.length) return list;
    return extractPage<InstructorEducation>(query.data).items;
  }, [query.data]);

  return { education, query };
}

/** The document checklist: which types exist and which of them are required. */
export function useDocumentTypes(appliesTo = 'CREDENTIAL') {
  const query = useQuery({
    ...listDocumentTypesOptions({ query: { applies_to: appliesTo } }),
    ...configQuery,
  });

  const documentTypes = useMemo(() => {
    const list = extractList<DocumentTypeOption>(query.data);
    if (list.length) return list;
    return extractPage<DocumentTypeOption>(query.data).items;
  }, [query.data]);

  const byUuid = useMemo(() => {
    const map = new Map<string, DocumentTypeOption>();
    for (const type of documentTypes) {
      if (type.uuid) map.set(type.uuid, type);
    }
    return map;
  }, [documentTypes]);

  return { documentTypes, byUuid, query };
}

/** The student profile for a user, if they have one. Looked up by search, like the others. */
export function useStudentProfile(userUuid: string, enabled = true) {
  const query = useQuery({
    ...searchStudentsOptions({
      query: { searchParams: { user_uuid: userUuid }, pageable: SINGLE_PROFILE_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(userUuid) && enabled,
  });

  const student = useMemo(() => extractPage<Student>(query.data).items[0] ?? null, [query.data]);
  return { student, query };
}

/** Whether the person holds platform admin, and whether it is the global kind. */
export function useAdminFlags(userUuid: string, enabled = true) {
  const isAdminQuery = useQuery({
    ...isUserAdminOptions({ path: { uuid: userUuid } }),
    ...listQuery,
    enabled: Boolean(userUuid) && enabled,
  });

  const isSystemAdminQuery = useQuery({
    ...isUserSystemAdminOptions({ path: { uuid: userUuid } }),
    ...listQuery,
    enabled: Boolean(userUuid) && enabled,
  });

  return {
    isAdmin: extractEntity<boolean>(isAdminQuery.data) ?? false,
    isSystemAdmin: extractEntity<boolean>(isSystemAdminQuery.data) ?? false,
    isLoading: isAdminQuery.isLoading || isSystemAdminQuery.isLoading,
  };
}

/** Classes the instructor is the default teacher for. */
export function useInstructorClasses(instructorUuid?: string, enabled = true) {
  const query = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { activeOnly: false },
    }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const classes = useMemo(() => {
    const list = extractList<ClassDefinitionResponse>(query.data);
    return list.map(entry => entry.class_definition).filter(Boolean) as ClassDefinition[];
  }, [query.data]);

  return { classes, query };
}

/** One-to-one sessions booked with the instructor. */
export function useInstructorBookings(instructorUuid?: string, page = 0, enabled = true) {
  const query = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { pageable: { page, size: 10 } },
    }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const { items, metadata } = useMemo(() => extractPage<BookingResponse>(query.data), [query.data]);
  return { bookings: items, total: getTotalFromMetadata(metadata), query };
}

/** What learners said about the instructor. */
export function useInstructorReviews(instructorUuid?: string, enabled = true) {
  const summaryQuery = useQuery({
    ...getInstructorRatingSummaryOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const reviewsQuery = useQuery({
    ...getInstructorReviewsOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const summary = useMemo(
    () => extractEntity<InstructorRatingSummary>(summaryQuery.data),
    [summaryQuery.data]
  );

  const reviews = useMemo(() => {
    const list = extractList<InstructorReview>(reviewsQuery.data);
    if (list.length) return list;
    return extractPage<InstructorReview>(reviewsQuery.data).items;
  }, [reviewsQuery.data]);

  return { summary, reviews, summaryQuery, reviewsQuery };
}

/** Marketplace jobs the instructor applied for. */
export function useInstructorApplications(instructorUuid?: string, enabled = true) {
  const query = useQuery({
    ...listInstructorApplicationsOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { pageable: { page: 0, size: 10 } },
    }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const applications = useMemo(
    () => extractPage<ClassMarketplaceJobApplication>(query.data).items,
    [query.data]
  );
  return { applications, query };
}

/** Course and class enrolments in one call. */
export function useStudentEnrolments(studentUuid?: string, enabled = true) {
  const query = useQuery({
    ...getEnrollmentOverviewForStudentOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { pageable: { page: 0, size: 50 } },
    }),
    ...listQuery,
    enabled: Boolean(studentUuid) && enabled,
  });

  const overview = useMemo(
    () => extractEntity<StudentEnrollmentOverview>(query.data),
    [query.data]
  );

  return {
    courseEnrolments: overview?.course_enrollments?.content ?? [],
    classEnrolments: overview?.class_enrollments?.content ?? [],
    query,
  };
}

/** Certificates the learner has earned. */
export function useStudentCertificates(studentUuid?: string, enabled = true) {
  const query = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: studentUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(studentUuid) && enabled,
  });

  const certificates = useMemo(() => {
    const list = extractList<Certificate>(query.data);
    if (list.length) return list;
    return extractPage<Certificate>(query.data).items;
  }, [query.data]);

  return { certificates, query };
}

/**
 * Attendance has no platform summary, so the session enrolments are counted here.
 * One page of 100 covers a normal learner; the tab says when there are more.
 */
export function useStudentAttendance(studentUuid?: string, enabled = true) {
  const query = useQuery({
    ...getScheduledInstanceEnrollmentsForStudentOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { pageable: { page: 0, size: 100 } },
    }),
    ...listQuery,
    enabled: Boolean(studentUuid) && enabled,
  });

  const summary = useMemo(() => {
    const { items, metadata } = extractPage<Enrollment>(query.data);
    const marked = items.filter(item => item.is_attendance_marked === true);
    return {
      attended: marked.filter(item => item.did_attend === true).length,
      absent: marked.filter(item => item.did_attend === false).length,
      counted: items.length,
      total: getTotalFromMetadata(metadata) || items.length,
    };
  }, [query.data]);

  return { summary, query };
}

/**
 * Wallet transactions, read first on purpose: GET /wallets/{userUuid} CREATES a wallet
 * as a side effect, so the console never calls it. The balance is the newest
 * balance_after, and no transactions means no wallet yet.
 */
export function useWalletHistory(userUuid: string, page = 0, enabled = true) {
  const query = useQuery({
    ...listTransactions1Options({
      path: { userUuid },
      query: { pageable: { page, size: 10 } },
    }),
    ...listQuery,
    enabled: Boolean(userUuid) && enabled,
  });

  const { items, metadata } = useMemo(() => extractPage<WalletTransaction>(query.data), [query.data]);

  const total = getTotalFromMetadata(metadata) || items.length;
  const latest = items[0];
  return {
    transactions: items,
    total,
    hasWallet: total > 0,
    balance: latest?.balance_after ?? null,
    currency: latest?.currency_code ?? null,
    query,
  };
}

/** Lifetime is asked for explicitly: the sales endpoint defaults to the last 30 days. */
const LIFETIME_START = new Date('2020-01-01T00:00:00.000Z');

/** What the learner has paid for. */
export function useStudentPurchases(studentUuid?: string, enabled = true) {
  const query = useQuery({
    ...listSalesOptions({
      query: {
        domain: 'admin',
        student_uuid: studentUuid ?? '',
        start_date: LIFETIME_START,
        pageable: { page: 0, size: 10 },
      },
    }),
    ...listQuery,
    enabled: Boolean(studentUuid) && enabled,
  });

  const sales = useMemo(() => extractPage<RevenueSaleLineItemDto>(query.data).items, [query.data]);
  return { sales, query };
}

/** The audit trail for one person, filtered by scope and category. */
export function usePersonActivity(
  userUuid: string,
  options: { scope?: string; category?: string; targetUuids?: string[]; page?: number },
  enabled = true
) {
  const { scope = 'all', category, targetUuids = [], page = 0 } = options;

  const query = useQuery({
    ...getUserActivityOptions({
      path: { uuid: userUuid },
      query: {
        scope: scope as 'actor' | 'target' | 'all',
        ...(category ? { category } : {}),
        ...(targetUuids.length ? { target_uuids: targetUuids.join(',') } : {}),
        pageable: { page, size: 25, sort: ['createdDate,desc'] },
      },
    }),
    ...queueQuery,
    enabled: Boolean(userUuid) && enabled,
  });

  const { items, metadata } = useMemo(
    () => extractPage<AdminUserActivityEvent>(query.data),
    [query.data]
  );

  const total = getTotalFromMetadata(metadata);
  return { events: items, total, pageCount: Math.max(1, Math.ceil(total / 25)), query };
}
