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

/**
 * Turns a `/users/me` record into the dashboard profile: the user plus its student,
 * instructor and course-creator rows. Runs on the server render and in the client query.
 */
export async function loadDomainProfiles(userContent: User): Promise<UserProfileType> {
  const user: UserProfileType = {
    ...userContent,
    dob: new Date(userContent?.dob ?? Date.now()),
  };
  const domains: string[] = Array.isArray(user.user_domain) ? [...user.user_domain] : [];
  if (domains.length === 0 || !user.uuid) return user;

  // Independent lookups: sequential awaits used to delay every dashboard by all three.
  const searchByUserUuid = { user_uuid_eq: user.uuid };
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

  const student = firstContent(studentResponse);
  if (isRecord(student)) user.student = student as Student;

  const instructor = firstContent(instructorResponse);
  if (isRecord(instructor)) user.instructor = instructor as UserProfileType['instructor'];

  const courseCreator = firstContent(courseCreatorResponse);
  if (isRecord(courseCreator)) user.courseCreator = courseCreator as CourseCreator;

  return user;
}
