'use client';

import { useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  countOfferingTrainers,
  enrollmentTotal,
  type OfferingReference,
} from '@/lib/course-creator/offering-counts';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForCourse,
  getClassDefinitionsForProgram,
  getCourseEnrollments,
  getProgramEnrollments,
  searchProgramTrainingApplications,
  searchTrainingApplications,
  type PageMetadata,
} from '@/services/client';
import {
  getClassDefinitionsForCourseQueryKey,
  getClassDefinitionsForProgramQueryKey,
  getCourseEnrollmentsQueryKey,
  getProgramEnrollmentsQueryKey,
  searchProgramTrainingApplicationsInfiniteQueryKey,
  searchTrainingApplicationsInfiniteQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const APPROVAL_PAGE_SIZE = 100;
let activeRequests = 0;
const waiting: Array<() => void> = [];

// The current enrollment/class APIs require one offering per request. Keep this
// explicitly authorized fallback to three concurrent requests, including approvals.
async function limited<T>(signal: AbortSignal, request: () => Promise<T>): Promise<T> {
  signal.throwIfAborted();
  if (activeRequests >= 3) await new Promise<void>(resolve => waiting.push(resolve));
  else activeRequests += 1;
  try {
    signal.throwIfAborted();
    return await request();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else activeRequests -= 1;
  }
}

function checked<T>(payload: { success?: boolean; error?: unknown; data?: T } | undefined): T {
  if (!payload || payload.error || payload.success === false || payload.data == null) {
    throw new Error('Unable to load offering counts');
  }
  return payload.data;
}

function nextApprovalPage(metadata: PageMetadata | undefined, page: number) {
  if (metadata?.hasNext !== undefined) return metadata.hasNext ? page + 1 : undefined;
  if (metadata?.totalPages !== undefined)
    return page + 1 < metadata.totalPages ? page + 1 : undefined;
  if (metadata?.last === true) return undefined;
  throw new Error('Training application pagination is unavailable');
}

function useApprovedTrainers(type: OfferingReference['type'], ids: string[]) {
  const options = {
    query: {
      searchParams: {
        [type === 'courses' ? 'course_uuid_in' : 'program_uuid_in']: ids.join(','),
        status: 'approved',
      },
      pageable: { page: 0, size: APPROVAL_PAGE_SIZE },
    },
  };
  const result = useInfiniteQuery({
    queryKey:
      type === 'courses'
        ? searchTrainingApplicationsInfiniteQueryKey(options)
        : searchProgramTrainingApplicationsInfiniteQueryKey(options),
    initialPageParam: 0,
    queryFn: ({ signal, pageParam }) =>
      limited(signal, async () => {
        const params = {
          query: { ...options.query, pageable: { page: pageParam, size: APPROVAL_PAGE_SIZE } },
          signal,
        };
        const { data, error } =
          type === 'courses'
            ? await searchTrainingApplications(params)
            : await searchProgramTrainingApplications(params);
        if (error) throw error;
        const page = checked(data);
        if (!page.content) throw new Error('Training applications are unavailable');
        nextApprovalPage(page.metadata, pageParam);
        return data;
      }),
    getNextPageParam: (lastPage, _pages, pageParam) =>
      nextApprovalPage(lastPage?.data?.metadata, pageParam),
    enabled: ids.length > 0,
    staleTime: STALE_TIMES.entity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { hasNextPage, isFetching, isError, fetchNextPage } = result;
  useEffect(() => {
    if (ids.length && hasNextPage && !isFetching && !isError) void fetchNextPage();
  }, [ids.length, hasNextPage, isFetching, isError, fetchNextPage]);
  const applications = useMemo(
    () => result.data?.pages.flatMap(page => page?.data?.content ?? []) ?? [],
    [result.data]
  );

  return {
    ...result,
    pending: result.isPending || !!result.hasNextPage || result.isFetchingNextPage,
    applications,
  };
}

export type OfferingCountState = {
  pending: boolean;
  value?: number;
  description: string;
  retry: () => void;
};

export type OfferingCounts = { students: OfferingCountState; trainers: OfferingCountState };

export function useOfferingCounts(offerings: OfferingReference[]) {
  const courseIds = useMemo(
    () =>
      [...new Set(offerings.filter(item => item.type === 'courses').map(item => item.uuid))].sort(),
    [offerings]
  );
  const programIds = useMemo(
    () =>
      [
        ...new Set(offerings.filter(item => item.type === 'programs').map(item => item.uuid)),
      ].sort(),
    [offerings]
  );
  const courseApprovals = useApprovedTrainers('courses', courseIds);
  const programApprovals = useApprovedTrainers('programs', programIds);

  const enrollments = useQueries({
    queries: offerings.map(offering => {
      const query = { pageable: { page: 0, size: 1 } };
      const courseOptions = { path: { courseUuid: offering.uuid }, query };
      const programOptions = { path: { programUuid: offering.uuid }, query };
      return {
        queryKey:
          offering.type === 'courses'
            ? getCourseEnrollmentsQueryKey(courseOptions)
            : getProgramEnrollmentsQueryKey(programOptions),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          limited(signal, async () => {
            const { data, error } =
              offering.type === 'courses'
                ? await getCourseEnrollments({ ...courseOptions, signal })
                : await getProgramEnrollments({ ...programOptions, signal });
            if (error) throw error;
            checked<unknown>(data);
            return data;
          }),
        enabled: !!offering.uuid,
        staleTime: STALE_TIMES.live,
        retry: false,
        refetchOnWindowFocus: false,
      };
    }),
  });
  const classes = useQueries({
    queries: offerings.map(offering => {
      const courseOptions = { path: { courseUuid: offering.uuid }, query: { activeOnly: false } };
      const programOptions = { path: { programUuid: offering.uuid }, query: { activeOnly: false } };
      return {
        queryKey:
          offering.type === 'courses'
            ? getClassDefinitionsForCourseQueryKey(courseOptions)
            : getClassDefinitionsForProgramQueryKey(programOptions),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          limited(signal, async () => {
            const { data, error } =
              offering.type === 'courses'
                ? await getClassDefinitionsForCourse({ ...courseOptions, signal })
                : await getClassDefinitionsForProgram({ ...programOptions, signal });
            if (error) throw error;
            checked(data);
            return data;
          }),
        enabled: !!offering.uuid,
        staleTime: STALE_TIMES.entity,
        retry: false,
        refetchOnWindowFocus: false,
      };
    }),
  });

  return new Map(
    offerings.map((offering, index) => {
      const enrollment = enrollments[index];
      const definitions = classes[index];
      const approvals = offering.type === 'courses' ? courseApprovals : programApprovals;
      const enrollmentFailed =
        enrollment?.isError || enrollment?.data?.error || enrollment?.data?.success === false;
      const classesFailed =
        definitions?.isError || definitions?.data?.error || definitions?.data?.success === false;
      const trainers =
        !classesFailed && !approvals.isError && !approvals.pending && definitions?.data?.data
          ? countOfferingTrainers(
              offering,
              definitions.data.data.flatMap(item =>
                item.class_definition ? [item.class_definition] : []
              ),
              approvals.applications
            )
          : undefined;
      const counts: OfferingCounts = {
        students: {
          pending: !!enrollment?.isPending,
          value: enrollmentFailed ? undefined : enrollmentTotal(enrollment?.data?.data?.metadata),
          description: 'Total student enrollments',
          retry: () => {
            void enrollment?.refetch();
          },
        },
        trainers: {
          pending:
            !classesFailed && !approvals.isError && (!!definitions?.isPending || approvals.pending),
          value: trainers?.total,
          description: trainers
            ? `${trainers.instructors} instructors, ${trainers.organisations} organisations; unique providers with classes or approved to train`
            : 'Instructors and organisations with classes or approved to train',
          retry: () => {
            void definitions?.refetch();
            void approvals.refetch();
          },
        },
      };
      return [`${offering.type}-${offering.uuid}`, counts] as const;
    })
  );
}
