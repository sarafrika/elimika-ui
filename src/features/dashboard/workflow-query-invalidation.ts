import type { QueryClient, QueryKey } from '@tanstack/react-query';

type GeneratedQueryKeyHead = {
  _id?: string;
  path?: Record<string, unknown>;
};

/** Narrows a workflow's own detail reads to these ids; lists and searches are always invalidated. */
export type WorkflowInvalidationScope = {
  entityUuids?: readonly string[];
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
    'getCurrentAccountStatus',
    'getCurrentOnboarding',
    'getRegistrationQueue',
    'getUserByUuid',
    'searchUsers',
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
    'getTrainingApplicationHistory',
    'getProgramTrainingApplicationHistory',
    'listTrainingRateUpdates',
    'listProgramTrainingApplicationRateUpdates',
    'listCourseTrainingRateUpdates',
    'listProgramTrainingRateUpdates',
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
    'getOrganisationTimetable',
    'getJobEligibility',
    'getJobsEligibility',
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
    'getOrganisationTimetable',
    'listInstructorStudents',
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
    'getWallet',
  ],
  jobApplication: [
    'getJob',
    'listJobs',
    'getJobsEligibility',
    'getJobApplication',
    'listJobApplicationEvents',
    'listJobApplications',
    'listMyApplications',
    'listInstructorApplications',
    'getJobEligibility',
    'getClassDefinitionsForOrganisation',
    'getOrganisationTimetable',
    'getClassDefinitionsForInstructor',
    'getClassDefinition',
    'listBookings',
    'getCalendar',
    'getInstructorTimeHolds',
    'getInstructorCalendar',
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
  assessment: [
    'getAllAssignments',
    'searchAssignments',
    'getAssignmentByUuid',
    'getAssignmentSubmissions',
    'searchSubmissions',
    'getSubmissionAnalytics',
    'getHighPerformanceSubmissions',
    'getPendingGrading',
    'getEnrollmentGradeBook',
    'getStudentDashboard',
  ],
  certificate: [
    'getStudentCertificates',
    'getCourseCertificates',
    'getProgramCertificates',
    'getDownloadableCertificates',
    'getAllCertificates',
    'searchCertificates',
    'getStudentDashboard',
  ],
  invitation: [
    'getGuardians',
    'getMine',
    'getMyStudents',
    'getStudentDashboard',
    'listMyInvitations',
    'listOrganisationInvitations',
    'getOrganisationInstructorSummaries',
    'getOrganisationStatistics',
  ],
} as const;

const contentModerationQueryIds = workflowQueryIds.contentModeration;
const domainVerificationQueryIds = workflowQueryIds.domainVerification;
const trainingApplicationQueryIds = workflowQueryIds.trainingApplication;
const enrollmentQueryIds = workflowQueryIds.enrollment;
const jobApplicationQueryIds = workflowQueryIds.jobApplication;
const reviewQueryIds = workflowQueryIds.review;
const assessmentQueryIds = workflowQueryIds.assessment;
const certificateQueryIds = workflowQueryIds.certificate;
const invitationQueryIds = workflowQueryIds.invitation;

/** Course and program reads keyed by the uuid that moderation and application events name. */
const COURSE_DETAIL_QUERY_IDS: ReadonlySet<string> = new Set([
  'getCourseByUuid',
  'getTrainingProgramByUuid',
  'getCourseEditDiff',
  'getCourseModerationHistory',
  'getCourseApprovalStatus',
  'getProgramModerationHistory',
  'getProgramApprovalStatus',
]);

/** Application reads keyed by the application uuid that training-application events carry. */
const APPLICATION_DETAIL_QUERY_IDS: ReadonlySet<string> = new Set([
  ...COURSE_DETAIL_QUERY_IDS,
  'getTrainingApplication',
  'getProgramTrainingApplication',
  'getTrainingApplicationHistory',
  'getProgramTrainingApplicationHistory',
]);

/** Job reads keyed by the job uuid; only marketplace job events carry one. */
const JOB_DETAIL_QUERY_IDS: ReadonlySet<string> = new Set([
  'getJob',
  'getJobEligibility',
  'getJobApplication',
  'listJobApplicationEvents',
]);

const NO_DETAIL_QUERY_IDS: ReadonlySet<string> = new Set();

/** A server-side event can change these unwatched, so a restored copy is never fresh. */
export const VOLATILE_GENERATED_QUERY_IDS: ReadonlySet<string> = Object.freeze(
  new Set<string>(Object.values(workflowQueryIds).flat())
);

function getGeneratedQueryHead(queryKey: QueryKey): GeneratedQueryKeyHead | undefined {
  const head = queryKey[0];
  return head && typeof head === 'object' && '_id' in head
    ? (head as GeneratedQueryKeyHead)
    : undefined;
}

function getGeneratedQueryId(queryKey: QueryKey) {
  const id = getGeneratedQueryHead(queryKey)?._id;
  return typeof id === 'string' ? id : undefined;
}

function pathMatchesScope(head: GeneratedQueryKeyHead, uuids: ReadonlySet<string>) {
  return Object.values(head.path ?? {}).some(
    value => typeof value === 'string' && uuids.has(value.toLowerCase())
  );
}

export function isVolatileGeneratedQuery(queryKey: QueryKey) {
  const id = getGeneratedQueryId(queryKey);
  return Boolean(id && VOLATILE_GENERATED_QUERY_IDS.has(id));
}

/** Only ids in `scopedIds` are narrowed to the scope; every other id is invalidated family-wide. */
export function invalidateGeneratedQueryIds(
  queryClient: QueryClient,
  queryIds: readonly string[],
  scope?: WorkflowInvalidationScope,
  scopedIds: ReadonlySet<string> = NO_DETAIL_QUERY_IDS
) {
  const idSet = new Set(queryIds);
  const uuids = scope?.entityUuids?.length
    ? new Set(scope.entityUuids.map(uuid => uuid.toLowerCase()))
    : null;
  return queryClient.invalidateQueries({
    predicate: query => {
      const head = getGeneratedQueryHead(query.queryKey);
      const id = typeof head?._id === 'string' ? head._id : undefined;
      if (!head || !id || !idSet.has(id)) return false;
      return !uuids || !scopedIds.has(id) || pathMatchesScope(head, uuids);
    },
  });
}

function invalidateQueryKeyPrefixes(queryClient: QueryClient, queryKeys: readonly QueryKey[]) {
  return Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey })));
}

export async function invalidateContentModerationWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(
      queryClient,
      contentModerationQueryIds,
      scope,
      COURSE_DETAIL_QUERY_IDS
    ),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['course-creator-dashboard-courses'],
      ['user-verification'],
    ]),
  ]);
}

export async function invalidateDomainVerificationWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, domainVerificationQueryIds, scope),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['profile'],
      ['organization'],
      ['user-profiles'],
      ['user-verification'],
    ]),
  ]);
}

export async function invalidateTrainingApplicationWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(
      queryClient,
      trainingApplicationQueryIds,
      scope,
      APPLICATION_DETAIL_QUERY_IDS
    ),
    invalidateQueryKeyPrefixes(queryClient, [
      notificationQueryKey,
      ['class-details-related'],
      ['course-creator-dashboard-courses'],
    ]),
  ]);
}

/** Job reads that quote an approved rate; rate events never name a job, so these stay family-wide. */
const rateUpdateJobQueryIds = [
  'getJob',
  'getJobEligibility',
  'getJobsEligibility',
  'listJobApplications',
  'listMyApplications',
  'listInstructorApplications',
] as const;

export async function invalidateRateUpdateWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateTrainingApplicationWorkflowQueries(queryClient, scope),
    invalidateGeneratedQueryIds(queryClient, rateUpdateJobQueryIds),
  ]);
}

export async function invalidateEnrollmentWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, enrollmentQueryIds, scope),
    invalidateQueryKeyPrefixes(queryClient, [notificationQueryKey, ['class-details-related']]),
  ]);
}

export async function invalidateJobApplicationWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, jobApplicationQueryIds, scope, JOB_DETAIL_QUERY_IDS),
    invalidateQueryKeyPrefixes(queryClient, [notificationQueryKey, ['class-details-related']]),
  ]);
}

/** Review events name the reviewed class or program, not every read they move, so nothing is scoped. */
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

async function invalidateAssessmentWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, assessmentQueryIds, scope),
    invalidateQueryKeyPrefixes(queryClient, [notificationQueryKey, ['class-details-related']]),
  ]);
}

async function invalidateCertificateWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, certificateQueryIds, scope),
    invalidateQueryKeyPrefixes(queryClient, [notificationQueryKey]),
  ]);
}

async function invalidateInvitationWorkflowQueries(
  queryClient: QueryClient,
  scope?: WorkflowInvalidationScope
) {
  await Promise.all([
    invalidateGeneratedQueryIds(queryClient, invitationQueryIds, scope),
    invalidateQueryKeyPrefixes(queryClient, [notificationQueryKey, ['organization']]),
  ]);
}

/** Grading events that move a mark or a queue; the reminders that share their prefix do not. */
const GRADING_NOTIFICATION_TYPES = new Set([
  'ASSIGNMENT_GRADED',
  'ASSIGNMENT_RETURNED_FOR_REVISION',
  'ASSIGNMENT_SUBMITTED_CONFIRMATION',
  'NEW_ASSIGNMENT_SUBMISSION',
  'ASSESSMENT_COMPLETED',
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The entity uuids an event names; none means the event cannot be targeted. */
function notificationScope(notification: WorkflowNotification): WorkflowInvalidationScope {
  const entityUuids = Object.values(notification.metadata ?? {}).filter(
    (value): value is string => typeof value === 'string' && UUID_PATTERN.test(value)
  );
  return { entityUuids };
}

export function invalidateWorkflowQueriesForNotification(
  queryClient: QueryClient,
  notification: WorkflowNotification
) {
  const type = notification.type ?? '';
  const scope = notificationScope(notification);

  if (type.includes('TRAINING_RATE_UPDATE')) {
    return invalidateRateUpdateWorkflowQueries(queryClient, scope);
  }

  if (type.includes('TRAINING_APPLICATION')) {
    return invalidateTrainingApplicationWorkflowQueries(queryClient, scope);
  }

  if (
    type.includes('VERIFICATION') ||
    type.includes('DOMAIN_APPROVAL') ||
    type === 'PROFILE_DOCUMENT_VERIFIED'
  ) {
    return invalidateDomainVerificationWorkflowQueries(queryClient, scope);
  }

  if (type.includes('CONTENT_APPROVED') || type.includes('CONTENT_REJECTED')) {
    return invalidateContentModerationWorkflowQueries(queryClient, scope);
  }

  if (
    type.includes('ENROLLMENT') ||
    type === 'CLASS_SCHEDULE_UPDATED' ||
    type === 'UPCOMING_CLASS_REMINDER' ||
    type === 'ORDER_PAYMENT_RECEIPT'
  ) {
    return invalidateEnrollmentWorkflowQueries(queryClient, scope);
  }

  // Includes HIRE_BLOCKED: a refused hire moves nothing, but both sides re-read applicants and holds.
  if (type.includes('CLASS_MARKETPLACE_JOB')) {
    return invalidateJobApplicationWorkflowQueries(queryClient, scope);
  }

  if (type.includes('REVIEW') || type.includes('RATING')) {
    return invalidateReviewWorkflowQueries(queryClient);
  }

  if (GRADING_NOTIFICATION_TYPES.has(type)) {
    return invalidateAssessmentWorkflowQueries(queryClient, scope);
  }

  if (type.includes('CERTIFICATE')) {
    return invalidateCertificateWorkflowQueries(queryClient, scope);
  }

  if (
    type.includes('INVITATION') ||
    type.includes('CONSENT') ||
    type === 'GUARDIAN_LINK_ESTABLISHED'
  ) {
    return invalidateInvitationWorkflowQueries(queryClient, scope);
  }

  return Promise.resolve();
}
