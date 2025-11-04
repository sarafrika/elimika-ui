import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { updateAssessmentRubricMutation } from '@/services/client/@tanstack/react-query.gen';
import { zApiResponsePagedDtoAssessmentRubric, zAssessmentRubric } from '@/services/client/zod.gen';
import type { Options, UpdateAssessmentRubricData } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const rubricListResponseSchema = zApiResponsePagedDtoAssessmentRubric.extend({
  data: zApiResponsePagedDtoAssessmentRubric.shape.data.default({ content: [] }),
});

export type AdminRubric = z.infer<typeof zAssessmentRubric>;

export interface AdminRubricListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'all' | 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  visibility?: 'all' | 'public' | 'private';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminRubricListResult {
  items: AdminRubric[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function buildRubricFilters(params: AdminRubricListParams) {
  const filters: Record<string, unknown> = {};

  if (params.search) {
    const query = params.search.trim();
    filters.title_like = query;
    filters.description_like = query;
  }

  if (params.status && params.status !== 'all') {
    filters.status_eq = params.status;
  }

  if (params.visibility && params.visibility !== 'all') {
    filters.is_public_eq = params.visibility === 'public';
  }

  return filters;
}

export async function fetchAdminRubrics(params: AdminRubricListParams = {}): Promise<AdminRubricListResult> {
  const { page = 0, size = 20, sortField = 'updated_date', sortOrder = 'desc' } = params;
  const pageable = {
    page,
    size,
    sort: [`${sortField},${sortOrder}`],
  };

  const filters = buildRubricFilters(params);
  const hasFilters = Object.keys(filters).length > 0;

  const response = await fetchClient.GET('/api/v1/rubrics/search', {
    params: {
      query: {
        searchParams: filters,
        pageable,
      },
    },
  });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch rubrics');
  }

  const parsed = rubricListResponseSchema.parse(response.data ?? {});
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

export const adminRubricsQueryKey = (params: AdminRubricListParams) => ['admin-rubrics', params] as const;

export function useAdminRubrics(
  params: AdminRubricListParams,
  options?: Partial<UseQueryOptions<AdminRubricListResult, Error>>
) {
  const normalizedParams: AdminRubricListParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    search: params.search ?? '',
    status: params.status ?? 'all',
    visibility: params.visibility ?? 'all',
    sortField: params.sortField ?? 'updated_date',
    sortOrder: params.sortOrder ?? 'desc',
  };

  return useQuery({
    queryKey: adminRubricsQueryKey(normalizedParams),
    queryFn: () => fetchAdminRubrics(normalizedParams),
    ...options,
  });
}

export function useUpdateAdminRubric(options?: Partial<Options<UpdateAssessmentRubricData>>) {
  const queryClient = useQueryClient();
  const baseOptions = updateAssessmentRubricMutation(options);

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rubrics'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}
