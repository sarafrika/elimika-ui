'use client';

import { SimilarCoursesRail } from '@/src/features/recommendations/similar-courses-rail';

const publicCourseHref = (courseUuid: string) => `/courses/${encodeURIComponent(courseUuid)}`;

/**
 * The similar-courses rail on the public record (`/courses/{uuid}/similar` is
 * anonymous-capable). A client island, because the rail takes its href builder as a
 * function, which a server component cannot pass down.
 */
export function PublicSimilarCourses({ courseUuid }: { courseUuid: string }) {
  return <SimilarCoursesRail courseUuid={courseUuid} hrefFor={publicCourseHref} className='mt-10' />;
}
