'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseByUuidOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ApplyItem, ApplyKind } from './types';

/**
 * The item a deep link names, read from the course or programme itself. A programme's
 * band is where its courses' ranges overlap and its floor their highest fee, as the server has it.
 */
export function useDeepLinkItem(kind: ApplyKind | null, uuid: string | null) {
  const forCourse = kind === 'course' && Boolean(uuid);
  const forProgram = kind === 'program' && Boolean(uuid);

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: uuid ?? '' } }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: uuid ?? '' } }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });
  const programCoursesQuery = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: uuid ?? '' } }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });

  const course = forCourse ? courseQuery.data?.data : undefined;
  const program = forProgram ? programQuery.data?.data : undefined;
  const creatorUuid = course?.course_creator_uuid ?? program?.course_creator_uuid ?? '';
  const creatorIds = useMemo(() => (creatorUuid ? [creatorUuid] : []), [creatorUuid]);
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);
  const creator = courseCreatorMap[creatorUuid]?.full_name ?? null;
  const memberCourses = programCoursesQuery.data?.data;

  const item = useMemo<ApplyItem | null>(() => {
    if (course?.uuid)
      return {
        kind: 'course',
        uuid: course.uuid,
        title: course.name,
        code: course.course_code ?? null,
        category: course.category_names?.[0] ?? null,
        creator,
        thumbnailUrl: course.thumbnail_url ?? null,
        ageMin: course.age_lower_limit ?? null,
        ageMax: course.age_upper_limit ?? null,
        lessonCount: null,
        requirementCount: course.training_requirements?.length ?? null,
        courseCount: null,
        matchesSkills: false,
        application: null,
        minimumFee: course.minimum_training_fee ?? null,
      };
    if (program?.uuid) {
      const courses = memberCourses ?? [];
      const lows = courses.flatMap(row => (row.age_lower_limit == null ? [] : [row.age_lower_limit]));
      const highs = courses.flatMap(row => (row.age_upper_limit == null ? [] : [row.age_upper_limit]));
      const fees = courses.flatMap(row =>
        row.minimum_training_fee == null ? [] : [row.minimum_training_fee]
      );
      return {
        kind: 'program',
        uuid: program.uuid,
        title: program.title,
        code: program.program_code ?? null,
        category: null,
        creator,
        thumbnailUrl: program.thumbnail_url ?? null,
        ageMin: lows.length ? Math.max(...lows) : null,
        ageMax: highs.length ? Math.min(...highs) : null,
        lessonCount: null,
        requirementCount: null,
        courseCount: courses.length || null,
        matchesSkills: false,
        application: null,
        minimumFee: fees.length ? Math.max(...fees) : null,
      };
    }
    return null;
  }, [course, program, memberCourses, creator]);

  const active = forCourse ? courseQuery : programQuery;
  const loading =
    (forCourse || forProgram) &&
    (active.isLoading || (forProgram && programCoursesQuery.isLoading));
  const notFound = (forCourse || forProgram) && active.isSuccess && !item;
  return { item, loading, error: active.error ?? null, notFound, refetch: active.refetch };
}
