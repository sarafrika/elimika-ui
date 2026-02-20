'use client';

import {
  calculateCourseAnalytics,
  calculateMonetizationSummary,
  calculateTrainingRequirementSummary,
} from '@/lib/course-creator/utils';
import {
  emptyCourseCreatorDashboardData,
  type CourseCreatorDashboardData,
} from '@/lib/types/course-creator';
import {
  search,
  searchCourseCreators,
  searchCourses,
  type Course,
  type CourseCreator,
  type SearchResponse,
  type User,
} from '@/services/client';
import { useEffect, useState } from 'react';
import { useUserProfile } from '../context/profile-context';

export function useCourseCreatorDashboardData() {
  const user = useUserProfile();
  const [data, setData] = useState<CourseCreatorDashboardData>(emptyCourseCreatorDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const { data: userSearchData } = await search({
          query: {
            searchParams: { email_eq: user.email },
            pageable: { page: 0, size: 1, sort: [] },
          },
        });

        const userSearch = userSearchData as SearchResponse;
        const userRecord = Array.isArray(userSearch.data?.content)
          ? (userSearch.data.content[0] as User)
          : undefined;

        if (!userRecord?.uuid) {
          setData(emptyCourseCreatorDashboardData);
          return;
        }

        const userDomains = Array.isArray(userRecord.user_domain)
          ? userRecord.user_domain
          : userRecord.user_domain
            ? [userRecord.user_domain]
            : [];

        const hasCourseCreatorDomain = userDomains.includes('course_creator');

        if (!hasCourseCreatorDomain) {
          setData({
            ...emptyCourseCreatorDashboardData,
            userUuid: userRecord.uuid,
          });
          return;
        }

        const { data: courseCreatorData } = await searchCourseCreators({
          query: {
            searchParams: { user_uuid_eq: userRecord.uuid },
            pageable: { page: 0, size: 1, sort: [] },
          },
        });

        const courseCreatorSearch = courseCreatorData as SearchResponse;
        const courseCreator = Array.isArray(courseCreatorSearch.data?.content)
          ? (courseCreatorSearch.data.content[0] as CourseCreator)
          : null;

        const coursesResponse =
          courseCreator?.uuid &&
          (await searchCourses({
            query: {
              searchParams: {
                course_creator_uuid_eq: courseCreator.uuid,
              },
              pageable: { page: 0, size: 100, sort: [] },
            },
          }));

        const courses: Course[] = Array.isArray(coursesResponse?.data?.data?.content)
          ? (coursesResponse?.data?.data?.content as Course[])
          : [];

        const analytics = calculateCourseAnalytics(courses);
        const monetization = calculateMonetizationSummary(courses);
        const trainingRequirements = calculateTrainingRequirementSummary(courses);

        setData({
          userUuid: userRecord.uuid,
          profile: courseCreator,
          courses,
          analytics,
          monetization,
          trainingRequirements,
          verification: {
            adminVerified: courseCreator?.admin_verified ?? false,
            profileComplete: courseCreator?.is_profile_complete ?? false,
            lastUpdated: courseCreator?.updated_date
              ? new Date(courseCreator.updated_date)
              : undefined,
            createdDate: courseCreator?.created_date
              ? new Date(courseCreator.created_date)
              : undefined,
          },
          assignments: {
            hasGlobalAccess: hasCourseCreatorDomain,
            organisations: [],
          },
        });
      } catch (err) {
        setData(emptyCourseCreatorDashboardData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return { data, loading };
}
