import type { QueryClient, QueryKey } from '@tanstack/react-query';

type GeneratedQueryKeyHead = {
  _id?: string;
};

type WorkflowNotification = {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
};

const notificationQueryKey = ['notifications'] as const;

const workflowQueryIds = {
  contentModeration: [
    'getCourseByUuid',
    'getAllCourses',
    'searchCourses',
    'getPublishedCourses',
    'searchCatalogue',
    'listPendingCourses',
    'listPendingCourseEdits',
    'getCourseEditDiff',
    'getCourseModerationHistory',
    'getCourseApprovalStatus',
    'getTrainingProgramByUuid',
    'getAllTrainingPrograms',
    'searchTrainingPrograms',
    'getPublishedPrograms',
    'getProgramsByCourseCreator',
    'listPendingPrograms',
    'getProgramModerationHistory',
    'getProgramApprovalStatus',
  ],
  domainVerification: [
    'getInstructorByUuid',
    'getCourseCreatorByUuid',
    'getOrganisationByUuid',
    'getAllInstructors',
    'getAllCourseCreators',
    'getAllOrganisations',
    'searchInstructors',
    'searchCourseCreators',
    'getPendingOrganisations',
    'isInstructorVerified',
    'isCourseCreatorVerified',
    'isOrganisationVerified',
    'getOrganisationSupportedDomains',
    'getOrganisationStatistics',
    'getOrganisationInstructorSummaries',
    'getInstructorDocuments',
    'getCourseCreatorDocuments',
    'getInstructorDocumentMedia',
    'getCourseCreatorDocumentMedia',
    'searchDocuments',
  ],
  trainingApplication: [
    'getTrainingApplication',
    'getProgramTrainingApplication',
    'listTrainingApplications',
    'listProgramTrainingApplications',
    'searchTrainingApplications',
    'searchProgramTrainingApplications',
    'getCourseByUuid',
    'getTrainingProgramByUuid',
    'getAllCourses',
    'getAllTrainingPrograms',
    'searchCourses',
    'searchTrainingPrograms',
    'getPublishedCourses',
    'getPublishedPrograms',
    'getProgramsByCourseCreator',
    'getClassDefinitionsForInstructor',
    'getClassDefinitionsForOrganisation',
  ],
  enrollment: [
    'getEnrollmentOverviewForStudent',
    'getCourseEnrollments',
    'getCourseEnrollmentsForStudent',
    'getClassEnrollmentsForStudent',
    'getScheduledInstanceEnrollmentsForStudent',
    'getProgramEnrollments',
    'searchProgramEnrollments',
    'getStudentSchedule',
    'getStudentCertificates',
    'getStudentDashboard',
    'getEnrollmentsForClass',
    'getClassDefinition',
    'getClassDefinitionsForCourse',
    'getClassDefinitionsForProgram',
    'getAllActiveClassDefinitions',
    'getClassEnrolmentEligibility',
    'getPublishedCourses',
    'getPublishedPrograms',
    'getCourseRecommendations',
    'searchCatalogue',
    'getCart',
    'getOrder',
    'getPaymentStatus',
  ],
  jobApplication: [
    'getJob',
    'listJobs',
    'listJobApplications',
    'listMyApplications',
    'listInstructorApplications',
    'getJobEligibility',
    'getClassDefinitionsForOrganisation',
    'getClassDefinitionsForInstructor',
    'getClassDefinition',
  ],
  review: [
    'getCourseReviews',
    'getClassReviews',
    'getProgramReviews',
    'getInstructorReviews',
    'getClassRatingSummary',
    'getProgramRatingSummary',
    'getInstructorRatingSummary',
    'getCourseByUuid',
    'getAllCourses',
    'searchCourses',
    'getPublishedCourses',
    'searchCatalogue',
    'getTrainingProgramByUuid',
    'getAllTrainingPrograms',
    'searchTrainingPrograms',
    'getPublishedPrograms',
    'getProgramsByCourseCreator',
    'getClassDefinition',
    'getClassDefinitionsForCourse',
    'getClassDefinitionsForProgram',
    'getClassDefinitionsForInstructor',
    'getClassDefinitionsForOrganisation',
    'getAllActiveClassDefinitions',
    'getInstructorByUuid',
    'getAllInstructors',
    'searchInstructors',
    'getOrganisationInstructorSummaries',
  ],
} as const;

const contentModerationQueryIds = workflowQueryIds.contentModeration;
const domainVerificationQueryIds = workflowQueryIds.domainVerification;
const trainingApplicationQueryIds = workflowQueryIds.trainingApplication;
const enrollmentQueryIds = workflowQueryIds.enrollment;
const jobApplicationQueryIds = workflowQueryIds.jobApplication;
const reviewQueryIds = workflowQueryIds.review;

/** A server-side event can change these unwatched, so a restored copy is never fresh. */
export const VOLATILE_GENERATED_QUERY_IDS: ReadonlySet<string> = Object.freeze(
  new Set<string>(Object.values(workflowQueryIds).flat())
);

function getGeneratedQueryId(queryKey: QueryKey) {
  const head = queryKey[0] as GeneratedQueryKeyHead | unknown;
  if (head && typeof head === 'object' && '_id' in head) {
    const id = (head as GeneratedQueryKeyHead)._id;
    return typeof id === 'string' ? id : undefined;
  }

  return undefined;
}

export function isVolatileGeneratedQuery(queryKey: QueryKey) {
  const id = getGeneratedQueryId(queryKey);
  return Boolean(id && VOLATILE_GENERATED_QUERY_IDS.has(id));
}

export function invalidateGeneratedQueryIds(
  queryClient: QueryClient,
  queryIds: readonly string[]
) {
  const idSet = new Set(queryIds);
  return queryClient.invalidateQueries({
    predicate: query => {
      const id = getGeneratedQueryId(query.queryKey);
      return Boolean(id && idSet.has(id));
    },
  });
}

function invalidateQueryKeyPrefixes(queryClient: QueryClient, queryKeys: readonly QueryKey[]) {
  return Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey })));
}

export function invalidateNotificationQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: notificationQueryKey });
}

export async function invalidateContentModerationWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, contentModerationQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['course-creator-dashboard-courses'],
      ['user-verification'],
    ]),
  ]);
}

export async function invalidateDomainVerificationWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, domainVerificationQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['profile'],
      ['organization'],
      ['user-profiles'],
      ['user-verification'],
    ]),
  ]);
}

export async function invalidateTrainingApplicationWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, trainingApplicationQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['class-details-related'],
      ['course-creator-dashboard-courses'],
    ]),
  ]);
}

export async function invalidateEnrollmentWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, enrollmentQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['class-details-related'],
    ]),
  ]);
}

export async function invalidateJobApplicationWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, jobApplicationQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['class-details-related'],
    ]),
  ]);
}

export async function invalidateReviewWorkflowQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, reviewQueryIds),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['class-details-related'],
      ['course-creator-dashboard-courses'],
    ]),
  ]);
}

export function invalidateWorkflowQueriesForNotification(
  queryClient: QueryClient,
  notification: WorkflowNotification
) {
  const type = notification.type ?? '';

  if (type.includes('TRAINING_APPLICATION')) {
    return invalidateTrainingApplicationWorkflowQueries(queryClient);
  }

  if (type.includes('VERIFICATION') || type === 'PROFILE_DOCUMENT_VERIFIED') {
    return invalidateDomainVerificationWorkflowQueries(queryClient);
  }

  if (type.includes('CONTENT_APPROVED') || type.includes('CONTENT_REJECTED')) {
    return invalidateContentModerationWorkflowQueries(queryClient);
  }

  if (
    type.includes('ENROLLMENT') ||
    type === 'CLASS_SCHEDULE_UPDATED' ||
    type === 'UPCOMING_CLASS_REMINDER'
  ) {
    return invalidateEnrollmentWorkflowQueries(queryClient);
  }

  if (type.includes('CLASS_MARKETPLACE_JOB')) {
    return invalidateJobApplicationWorkflowQueries(queryClient);
  }

  if (type.includes('REVIEW') || type.includes('RATING')) {
    return invalidateReviewWorkflowQueries(queryClient);
  }

  return Promise.resolve();
}
