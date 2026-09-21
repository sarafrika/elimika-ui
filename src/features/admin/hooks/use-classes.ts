'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import {
  cancelScheduledClass,
  type ClassDefinition,
  type ClassRatingSummary,
  deactivateClassDefinition,
  type Enrollment,
  markAttendance,
  type ScheduledInstance,
} from '@/services/client';
import {
  getClassDefinitionOptions,
  getClassEnrolmentCountsOptions,
  getClassRatingSummaryOptions,
  getClassScheduleOptions,
  getAllClassDefinitionsOptions,
  getClassDefinitionsForOrganisationOptions,
  getEnrollmentsForInstanceOptions,
  getInstructorScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateAdminOverview, listQuery, queueQuery } from '../lib/admin-queries';

export const CLASS_PAGE_SIZE = 20;
const SCHEDULE_PAGE = { page: 0, size: 50 };

/** Longest window the instructor calendar will ask for in one go. */
export const CALENDAR_MAX_DAYS = 31;

/**
 * Every class on the platform, one page at a time. The endpoint takes no filters and
 * refuses to sort by instructor_pay, so the page offers neither.
 */
export function useAllClasses(page: number) {
  const query = useQuery({
    ...getAllClassDefinitionsOptions({ query: { pageable: { page, size: CLASS_PAGE_SIZE } } }),
    ...listQuery,
  });

  const { classes, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<ClassDefinition>(query.data);
    return {
      classes: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { classes, totalRows, pageCount, query };
}

/** One class, opened in the drawer. */
export function useClassDefinition(uuid: string | null) {
  const query = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: uuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const definition = useMemo(() => {
    const response = extractEntity<{ class_definition?: ClassDefinition }>(query.data);
    return response?.class_definition ?? null;
  }, [query.data]);

  return { definition, query };
}

/** Sessions for the open class, newest page first. */
export function useClassSchedule(uuid: string | null) {
  const query = useQuery({
    ...getClassScheduleOptions({ path: { uuid: uuid ?? '' }, query: { pageable: SCHEDULE_PAGE } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const instances = useMemo(() => extractPage<ScheduledInstance>(query.data).items, [query.data]);
  return { instances, query };
}

/** What learners made of the class. */
export function useClassRating(uuid: string | null) {
  const query = useQuery({
    ...getClassRatingSummaryOptions({ path: { uuid: uuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const rating = useMemo(() => extractEntity<ClassRatingSummary>(query.data), [query.data]);
  return { rating, query };
}

/**
 * The roster for ONE session. Never called per class — that is what made the old
 * calendar fire twenty requests to draw a row of initials.
 */
export function useInstanceEnrolments(instanceUuid: string | null) {
  const query = useQuery({
    ...getEnrollmentsForInstanceOptions({ path: { instanceUuid: instanceUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instanceUuid),
  });

  const enrolments = useMemo(() => extractList<Enrollment>(query.data), [query.data]);
  return { enrolments, query };
}

/** An instructor's sessions inside a bounded window. */
export function useInstructorCalendar(instructorUuid: string, start: Date, end: Date) {
  const query = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid },
      query: { start, end },
    }),
    ...queueQuery,
    enabled: Boolean(instructorUuid),
  });

  const instances = useMemo(() => extractList<ScheduledInstance>(query.data), [query.data]);
  return { instances, query };
}

/** An organisation's classes, with enrolment counts from one extra query. */
export function useOrganisationClassLoad(organisationUuid: string) {
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    ...listQuery,
    enabled: Boolean(organisationUuid),
  });

  const countsQuery = useQuery({
    ...getClassEnrolmentCountsOptions({ path: { organisationUuid } }),
    ...listQuery,
    enabled: Boolean(organisationUuid),
  });

  const classes = useMemo(
    () => extractList<{ class_definition?: ClassDefinition }>(classesQuery.data),
    [classesQuery.data]
  );

  const enrolmentCounts = useMemo(() => {
    const rows = extractList<{ class_definition_uuid?: string; enrolled?: number }>(
      countsQuery.data
    );
    return Object.fromEntries(
      rows.map(row => [row.class_definition_uuid ?? '', Number(row.enrolled ?? 0)])
    );
  }, [countsQuery.data]);

  return {
    classes: classes.map(row => row.class_definition ?? (row as ClassDefinition)),
    enrolmentCounts,
    classesQuery,
    countsQuery,
  };
}

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Call off one session. Enrolled learners are cancelled with it. */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceUuid, reason }: { instanceUuid: string; reason: string; title: string }) => {
      const { data } = await cancelScheduledClass({
        path: { instanceUuid },
        query: { reason },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['getClassSchedule'] });
      await queryClient.invalidateQueries({ queryKey: ['getInstructorSchedule'] });
      await invalidateAdminOverview(queryClient);
      toast.success(`${variables.title} is cancelled`);
    },
    onError: (error, variables) => {
      if (statusOf(error) === 400) {
        toast.error('Only a scheduled or ongoing session can be cancelled');
        return;
      }
      toast.error(getErrorMessage(error, `Could not cancel ${variables.title}`));
    },
  });
}

/** Retire a class. Future sessions go with it. */
export function useDeactivateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid }: { uuid: string; title: string }) => {
      const { data } = await deactivateClassDefinition({ path: { uuid }, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['getAllClassDefinitions'] });
      await queryClient.invalidateQueries({ queryKey: ['getClassDefinition'] });
      await invalidateAdminOverview(queryClient);
      toast.success(`${variables.title} is no longer running`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not deactivate ${variables.title}`)),
  });
}

/** Record whether a learner turned up. The gradebook reads this. */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentUuid,
      attended,
    }: {
      enrollmentUuid: string;
      attended: boolean;
      learnerName: string;
    }) => {
      const { data } = await markAttendance({
        path: { enrollmentUuid },
        query: { attended },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['getEnrollmentsForInstance'] });
      toast.success(
        `${variables.learnerName} marked ${variables.attended ? 'present' : 'absent'}`
      );
    },
    onError: (error, variables) => {
      if (statusOf(error) === 400) {
        toast.error('Attendance was already marked for this enrolment');
        return;
      }
      toast.error(getErrorMessage(error, `Could not mark ${variables.learnerName}`));
    },
  });
}
