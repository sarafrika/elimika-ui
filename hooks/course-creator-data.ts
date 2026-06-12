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
  searchCourses,
  type Course,
  type CourseCreator,
} from '@/services/client';
import { useEffect, useState } from 'react';
import { useUserProfile } from '../context/profile-context';

export function useCourseCreatorDashboardData() {
  const user = useUserProfile();
  const [data, setData] = useState<CourseCreatorDashboardData>(emptyCourseCreatorDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isLoading) {
      return;
    }
    if (!user?.email) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // The user record, domains and course-creator profile are already in
        // the profile context — re-searching them added two extra API calls
        // to every course_creator page.
        const userUuid = user?.uuid;
        if (!userUuid) {
          setData(emptyCourseCreatorDashboardData);
          return;
        }

        const userDomains = Array.isArray(user?.user_domain) ? user.user_domain : [];
        const hasCourseCreatorDomain = userDomains.includes('course_creator');

        if (!hasCourseCreatorDomain) {
          setData({
            ...emptyCourseCreatorDashboardData,
            userUuid,
          });
          return;
        }

        const courseCreator = (user?.courseCreator ?? null) as CourseCreator | null;

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
          userUuid,
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
