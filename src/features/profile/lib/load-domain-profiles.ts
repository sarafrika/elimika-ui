import type { UserProfileType } from '@/lib/types';
import {
  type CourseCreator,
  type Student,
  searchCourseCreators,
  searchInstructors,
  searchStudents,
  type User,
} from '@/services/client';

type SearchResult = { data?: unknown; error?: unknown } | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Search endpoints wrap the page as `{ data: { content: [...] } }` despite the generated `Page` type.
function firstContent(response: SearchResult): unknown {
  if (!response || response.error || !isRecord(response.data)) return undefined;
  const page = response.data.data;
  if (!isRecord(page) || !Array.isArray(page.content)) return undefined;
  return page.content[0];
}

export type DomainRows = {
  student?: Student;
  instructor?: UserProfileType['instructor'];
  courseCreator?: CourseCreator;
};

/** The student, instructor and course-creator rows for a user, looked up in parallel. */
export async function fetchDomainRows(userUuid: string, domains: string[]): Promise<DomainRows> {
  if (!userUuid || domains.length === 0) return {};
  const searchByUserUuid = { user_uuid_eq: userUuid };
  const [studentResponse, instructorResponse, courseCreatorResponse] = await Promise.all([
    domains.includes('student')
      ? searchStudents({
          query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 20 } },
        }).catch(() => null)
      : null,
    domains.includes('instructor')
      ? searchInstructors({
          query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 20 } },
        }).catch(() => null)
      : null,
    domains.includes('course_creator')
      ? searchCourseCreators({
          query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 1 } },
        }).catch(() => null)
      : null,
  ]);

  const rows: DomainRows = {};
  const student = firstContent(studentResponse);
  if (isRecord(student)) rows.student = student as Student;
  const instructor = firstContent(instructorResponse);
  if (isRecord(instructor)) rows.instructor = instructor as UserProfileType['instructor'];
  const courseCreator = firstContent(courseCreatorResponse);
  if (isRecord(courseCreator)) rows.courseCreator = courseCreator as CourseCreator;
  return rows;
}

/** The `/users/me` record as a dashboard profile, with the given domain rows attached. */
export function mergeDomainProfiles(userContent: User, rows: DomainRows): UserProfileType {
  const user: UserProfileType = {
    ...userContent,
    dob: new Date(userContent?.dob ?? Date.now()),
  };
  if (rows.student) user.student = rows.student;
  if (rows.instructor) user.instructor = rows.instructor;
  if (rows.courseCreator) user.courseCreator = rows.courseCreator;
  return user;
}

export function userDomains(userContent: User): string[] {
  return Array.isArray(userContent.user_domain) ? [...userContent.user_domain] : [];
}

/**
 * Turns a `/users/me` record into the dashboard profile: the user plus its student,
 * instructor and course-creator rows. Runs on the server render and in the client query.
 */
export async function loadDomainProfiles(userContent: User): Promise<UserProfileType> {
  const rows = userContent.uuid
    ? await fetchDomainRows(userContent.uuid, userDomains(userContent))
    : {};
  return mergeDomainProfiles(userContent, rows);
}
