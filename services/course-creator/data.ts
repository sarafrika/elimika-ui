'use server';

import {
  calculateCourseAnalytics,
  calculateMonetizationSummary,
  calculateTrainingRequirementSummary,
} from '@/lib/course-creator/utils';
import {
  CourseCreatorDashboardData,
  emptyCourseCreatorDashboardData,
} from '@/lib/types/course-creator';
import { auth } from '@/services/auth';
import {
  Course,
  CourseCreator,
  search,
  searchCourseCreators,
  searchCourses,
  SearchResponse,
  User,
} from '@/services/client';

export async function getCourseCreatorDashboardData(): Promise<CourseCreatorDashboardData> {
  const session = await auth();
  if (!session?.user?.email) {
    return emptyCourseCreatorDashboardData;
  }

  try {
    const { data: userSearchData } = await search({
      query: {
        searchParams: {
          email_eq: session.user.email,
        },
        pageable: {
          page: 0,
          size: 1,
          sort: [],
        },
      },
    });

    const userSearch = userSearchData as SearchResponse;
    const userRecord = Array.isArray(userSearch.data?.content)
      ? (userSearch.data.content[0] as unknown as User)
      : undefined;

    if (!userRecord || !userRecord.uuid) {
      return emptyCourseCreatorDashboardData;
    }

    const userDomains = Array.isArray(userRecord.user_domain)
      ? (userRecord.user_domain as string[])
      : userRecord.user_domain
        ? [userRecord.user_domain as string]
        : [];

    const hasCourseCreatorDomain = userDomains.includes('course_creator');
    if (!hasCourseCreatorDomain) {
      return {
        ...emptyCourseCreatorDashboardData,
        userUuid: userRecord.uuid,
      };
    }

    const {
      data: courseCreatorData,
    } = await searchCourseCreators({
      query: {
        searchParams: {
          user_uuid_eq: userRecord.uuid,
        },
        pageable: {
          page: 0,
          size: 1,
          sort: [],
        },
      },
    });

    const courseCreatorSearch = courseCreatorData as SearchResponse;
    const courseCreator = Array.isArray(courseCreatorSearch.data?.content)
      ? (courseCreatorSearch.data.content[0] as unknown as CourseCreator)
      : null;

    const coursesResponse =
      courseCreator?.uuid &&
      (await searchCourses({
        query: {
          searchParams: {
            course_creator_uuid_eq: courseCreator.uuid,
          },
          pageable: {
            page: 0,
            size: 100,
            sort: [],
          },
        },
      }));

    const coursesPayload = coursesResponse?.data;
    const courses: Course[] = Array.isArray(coursesPayload?.data?.content)
      ? (coursesPayload!.data!.content as Course[])
      : [];

    const analytics = calculateCourseAnalytics(courses);
    const monetization = calculateMonetizationSummary(courses);
    const trainingRequirements = calculateTrainingRequirementSummary(courses);

    const organisationAssignments =
      userRecord.organisation_affiliations
        ?.filter(affiliation => affiliation.domain_in_organisation === 'course_creator')
        ?.map(affiliation => ({
          organisationUuid: affiliation.organisation_uuid,
          organisationName: affiliation.organisation_name,
          branchUuid: affiliation.branch_uuid,
          branchName: affiliation.branch_name,
          startDate: affiliation.start_date,
          active: affiliation.active,
        })) ?? [];

    const verification = {
      adminVerified: courseCreator?.admin_verified ?? false,
      profileComplete: courseCreator?.is_profile_complete ?? false,
      lastUpdated: courseCreator?.updated_date ? new Date(courseCreator.updated_date) : undefined,
      createdDate: courseCreator?.created_date ? new Date(courseCreator.created_date) : undefined,
    };

    return {
      userUuid: userRecord.uuid,
      profile: courseCreator,
      courses,
      analytics,
      monetization,
      trainingRequirements,
      verification,
      assignments: {
        hasGlobalAccess: hasCourseCreatorDomain,
        organisations: organisationAssignments,
      },
    };
  } catch (error) {
    console.error('Failed to load course creator dashboard data', error);
    return emptyCourseCreatorDashboardData;
  }
}
