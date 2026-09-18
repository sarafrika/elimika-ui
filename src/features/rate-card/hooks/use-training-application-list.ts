'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import type { Course, TrainingProgram } from '@/services/client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingApplication, TrainingApplicationKind } from '../types';

export type TrainingApplicationEntry = {
  kind: TrainingApplicationKind;
  uuid: string;
  parentUuid: string;
  application: TrainingApplication;
  course?: Course;
  program?: TrainingProgram;
  /** Course name or program title, once looked up. */
  title?: string;
  creatorUuid?: string;
  /** The course's minimum training fee; programs resolve theirs server-side. */
  minimum: number | null;
};

const PAGE_SIZE = 100;

/** Course and program training applications matching one search, merged newest first. */
export function useTrainingApplicationList(searchParams: Record<string, string>, enabled: boolean) {
  const query = { searchParams, pageable: { page: 0, size: PAGE_SIZE } };
  const courses = useQuery({
    ...searchTrainingApplicationsOptions({ query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled,
  });
  const programs = useQuery({
    ...searchProgramTrainingApplicationsOptions({ query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled,
  });

  const courseRows = courses.data?.data?.content;
  const programRows = programs.data?.data?.content;
  const courseUuids = useMemo(
    () => (courseRows ?? []).flatMap(row => (row.course_uuid ? [row.course_uuid] : [])),
    [courseRows]
  );
  const programUuids = useMemo(
    () => (programRows ?? []).flatMap(row => (row.program_uuid ? [row.program_uuid] : [])),
    [programRows]
  );
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);
  const { programMap, isLoading: programsLoading } = useProgramsByIds(programUuids);

  const entries = useMemo<TrainingApplicationEntry[]>(() => {
    const fromCourses = (courseRows ?? []).flatMap(application => {
      if (!application.uuid || !application.course_uuid) return [];
      const course = courseMap[application.course_uuid];
      return [
        {
          kind: 'course' as const,
          uuid: application.uuid,
          parentUuid: application.course_uuid,
          application,
          course,
          title: course?.name,
          creatorUuid: course?.course_creator_uuid,
          minimum: course?.minimum_training_fee ?? null,
        },
      ];
    });
    const fromPrograms = (programRows ?? []).flatMap(application => {
      if (!application.uuid || !application.program_uuid) return [];
      const program = programMap[application.program_uuid];
      return [
        {
          kind: 'program' as const,
          uuid: application.uuid,
          parentUuid: application.program_uuid,
          application,
          program,
          title: program?.title,
          creatorUuid: program?.course_creator_uuid,
          minimum: null,
        },
      ];
    });
    const time = (entry: TrainingApplicationEntry) =>
      entry.application.created_date ? new Date(entry.application.created_date).getTime() : 0;
    return [...fromCourses, ...fromPrograms].sort((a, b) => time(b) - time(a));
  }, [courseRows, programRows, courseMap, programMap]);

  return {
    entries,
    loading:
      !enabled || (courses.isLoading && !courses.data) || (programs.isLoading && !programs.data),
    titlesLoading: coursesLoading || programsLoading,
    error: courses.error ?? programs.error,
    refetch: () => {
      void courses.refetch();
      void programs.refetch();
    },
  };
}
