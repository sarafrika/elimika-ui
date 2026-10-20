'use client';

import { useUserProfile } from '@/context/profile-context';
import { useClassesByIds, useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllClassDefinitionsOptions,
  getClassSchedulesOptions,
  getClassSchedulesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import {
  buildTrainingOrders,
  type ClassFinanceMetadata,
  type TrainingWalletRole,
} from '@/src/features/wallet/training-orders';
import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTrainingSales } from './useTrainingSales';

export const ORDERS_PAGE_SIZE = 20;

export function useTrainingOrders(role: TrainingWalletRole, page: number, courseUuid?: string) {
  const profile = useUserProfile();
  const profileUuid =
    role === 'instructor' ? profile?.instructor?.uuid : profile?.courseCreator?.uuid;
  const salesQuery = useTrainingSales(role, Boolean(profileUuid), undefined, courseUuid);
  // Pagination is by class, while each class retains every loaded checkout line.
  const allIds = useMemo(
    () => [
      ...new Set(
        salesQuery.sales.flatMap(sale =>
          sale.class_definition_uuid && (!courseUuid || sale.course_uuid === courseUuid)
            ? [sale.class_definition_uuid]
            : []
        )
      ),
    ],
    [salesQuery.sales, courseUuid]
  );
  const classIds = useMemo(
    () => allIds.slice(page * ORDERS_PAGE_SIZE, (page + 1) * ORDERS_PAGE_SIZE),
    [allIds, page]
  );
  const visibleSales = useMemo(() => {
    const ids = new Set(classIds);
    return salesQuery.sales.filter(
      sale =>
        sale.class_definition_uuid &&
        ids.has(sale.class_definition_uuid) &&
        (!courseUuid || sale.course_uuid === courseUuid)
    );
  }, [classIds, salesQuery.sales, courseUuid]);
  const classes = useClassesByIds(classIds);
  // The listing documents uuid_in even though its generated query type omits it.
  // Scope full pricing metadata to visible classes for both wallet roles.
  const definitionsQueryParams = {
    uuid_in: classIds.join(','),
    pageable: { page: 0, size: classIds.length || 1 },
  };
  const definitionsQuery = useQuery({
    ...getAllClassDefinitionsOptions({ query: definitionsQueryParams }),
    enabled: Boolean(profileUuid && classIds.length),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const schedulesOptions = classIds.length
    ? getClassSchedulesOptions({ query: { class_uuids: classIds } })
    : undefined;
  const schedulesQuery = useQuery({
    ...schedulesOptions,
    queryKey:
      schedulesOptions?.queryKey ?? getClassSchedulesQueryKey({ query: { class_uuids: [] } }),
    queryFn: schedulesOptions?.queryFn ?? skipToken,
    enabled: Boolean(schedulesOptions),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const classMap = useMemo(() => {
    const map: Record<string, ClassFinanceMetadata> = { ...classes.classMap };
    if (!definitionsQuery.data?.error && definitionsQuery.data?.success !== false) {
      for (const { class_definition: definition } of definitionsQuery.data?.data?.content ?? []) {
        if (definition?.uuid && classIds.includes(definition.uuid))
          map[definition.uuid] = {
            ...map[definition.uuid],
            ...definition,
            hasFullDefinition: true,
          };
      }
    }
    return map;
  }, [classes.classMap, definitionsQuery.data, classIds]);
  const courseIds = useMemo(
    () => [
      ...new Set([
        ...Object.values(classMap).flatMap(item => (item.course_uuid ? [item.course_uuid] : [])),
        ...visibleSales.flatMap(item => (item.course_uuid ? [item.course_uuid] : [])),
      ]),
    ],
    [classMap, visibleSales]
  );
  const courses = useCoursesByIds(courseIds);
  const schedules = useMemo(
    () =>
      schedulesQuery.data?.error || schedulesQuery.data?.success === false
        ? []
        : (schedulesQuery.data?.data ?? []),
    [schedulesQuery.data]
  );
  const schedulesAvailable =
    Boolean(schedulesQuery.data?.data) &&
    !schedulesQuery.isError &&
    !schedulesQuery.data?.error &&
    schedulesQuery.data?.success !== false;
  const rows = useMemo(
    () =>
      buildTrainingOrders({
        sales: visibleSales,
        classMap,
        courseMap: courses.courseMap,
        schedules,
        schedulesAvailable,
        salesComplete: salesQuery.complete,
        role,
      }),
    [
      visibleSales,
      classMap,
      courses.courseMap,
      schedules,
      schedulesAvailable,
      salesQuery.complete,
      role,
    ]
  );

  return {
    rows,
    sales: salesQuery.sales,
    hasProfile: Boolean(profileUuid),
    isLoading:
      Boolean(profile?.isLoading) ||
      salesQuery.isLoading ||
      classes.isLoading ||
      definitionsQuery.isLoading ||
      schedulesQuery.isLoading ||
      courses.isLoading,
    salesFailed: salesQuery.failed,
    detailsFailed:
      classes.isError ||
      definitionsQuery.isError ||
      Boolean(definitionsQuery.data?.error) ||
      definitionsQuery.data?.success === false ||
      courses.isError ||
      schedulesQuery.isError ||
      Boolean(schedulesQuery.data?.error) ||
      schedulesQuery.data?.success === false ||
      classIds.some(id => !classMap[id]) ||
      salesQuery.sales.some(
        sale => !sale.class_definition_uuid || !sale.order_currency_code?.trim()
      ),
    isFetching: salesQuery.isFetching || definitionsQuery.isFetching || schedulesQuery.isFetching,
    complete: salesQuery.complete,
    hasMoreSales: salesQuery.hasNextPage,
    loadMoreSales: salesQuery.fetchNextPage,
    totalPages: Math.max(1, Math.ceil(allIds.length / ORDERS_PAGE_SIZE)),
    refetch: () =>
      Promise.all([
        salesQuery.refetch(),
        classes.refetch(),
        courses.refetch(),
        ...(profileUuid && classIds.length ? [definitionsQuery.refetch()] : []),
        ...(schedulesOptions ? [schedulesQuery.refetch()] : []),
      ]),
  };
}
