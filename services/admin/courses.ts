import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { updateCourseMutation } from '@/services/client/@tanstack/react-query.gen';
import { zApiResponsePagedDtoCourse, type zCourse } from '@/services/client/zod.gen';
import type { Options, UpdateCourseData } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { z } from 'zod';

const courseListResponseSchema = zApiResponsePagedDtoCourse.extend({
  data: zApiResponsePagedDtoCourse.shape.data.default({ content: [] }),
});

export type AdminCourse = z.infer<typeof zCourse>;

export interface AdminCourseListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'all' | 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminCourseListResult {
  items: AdminCourse[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function buildCourseFilters(params: AdminCourseListParams) {
  const filters: Record<string, unknown> = {};

  if (params.search) {
    const query = params.search.trim();
    filters.name_like = query;
    filters.description_like = query;
  }

  if (params.status && params.status !== 'all') {
    filters.status_eq = params.status;
  }

  return filters;
}

export async function fetchAdminCourses(
  params: AdminCourseListParams = {}
): Promise<AdminCourseListResult> {
  const { page = 0, size = 20, sortField = 'updated_date', sortOrder = 'desc' } = params;
  const pageable = {
    page,
    size,
    sort: [`${sortField},${sortOrder}`],
  };

  const filters = buildCourseFilters(params);
  const hasFilters = Object.keys(filters).length > 0;

  const response = hasFilters
    ? await fetchClient.GET('/api/v1/courses/search', {
        params: {
          query: {
            searchParams: filters,
            pageable,
          },
        },
      })
    : await fetchClient.GET('/api/v1/courses', {
        params: {
          query: {
            pageable,
          },
        },
      });

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch courses'
    );
  }

  const parsed = courseListResponseSchema.parse(response.data ?? {});
  const items = parsed.data?.content ?? [];
  const metadata = parsed.data?.metadata ?? {};

  const totalItems = toNumber(metadata.totalElements);
  const totalPages = metadata.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / size) : 0);

  return {
    items,
    page: metadata.pageNumber ?? page,
    size: metadata.pageSize ?? size,
    totalItems,
    totalPages,
    hasNext: metadata.hasNext ?? (metadata.pageNumber ?? page) < totalPages - 1,
    hasPrevious: metadata.hasPrevious ?? (metadata.pageNumber ?? page) > 0,
  };
}

export const adminCoursesQueryKey = (params: AdminCourseListParams) =>
  ['admin-courses', params] as const;

export function useAdminCourses(
  params: AdminCourseListParams,
  options?: Partial<UseQueryOptions<AdminCourseListResult, Error>>
) {
  const normalizedParams: AdminCourseListParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    search: params.search ?? '',
    status: params.status ?? 'all',
    sortField: params.sortField ?? 'updated_date',
    sortOrder: params.sortOrder ?? 'desc',
  };

  return useQuery({
    queryKey: adminCoursesQueryKey(normalizedParams),
    queryFn: () => fetchAdminCourses(normalizedParams),
    ...options,
  });
}

export function useUpdateAdminCourse(options?: Partial<Options<UpdateCourseData>>) {
  const queryClient = useQueryClient();
  const baseOptions = updateCourseMutation(options);

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}
