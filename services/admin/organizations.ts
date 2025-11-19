import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import {
  moderateOrganisationMutation,
  updateOrganisationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ModerateOrganisationData,
  Options,
  UpdateOrganisationData,
} from '@/services/client/types.gen';
import { zApiResponsePagedDtoOrganisation, type zOrganisation } from '@/services/client/zod.gen';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

const organisationListResponseSchema = zApiResponsePagedDtoOrganisation.extend({
  data: zApiResponsePagedDtoOrganisation.shape.data.default({ content: [] }),
});

export type AdminOrganisation = z.infer<typeof zOrganisation>;

export interface AdminOrganisationListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  verification?: 'all' | 'verified' | 'pending';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrganisationListResult {
  items: AdminOrganisation[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function buildOrganisationFilters(params: AdminOrganisationListParams) {
  const filters: Record<string, unknown> = {};

  if (params.search) {
    const query = params.search.trim();
    filters.name_like = query;
    filters.description_like = query;
    filters.location_like = query;
  }

  if (params.status && params.status !== 'all') {
    filters.active_eq = params.status === 'active';
  }

  if (params.verification && params.verification !== 'all') {
    filters.admin_verified_eq = params.verification === 'verified';
  }

  return filters;
}

export async function fetchAdminOrganisations(
  params: AdminOrganisationListParams = {}
): Promise<AdminOrganisationListResult> {
  const { page = 0, size = 20, sortField = 'created_date', sortOrder = 'desc' } = params;
  const pageable = {
    page,
    size,
    sort: [`${sortField},${sortOrder}`],
  };

  const filters = buildOrganisationFilters(params);
  const hasFilters = Object.keys(filters).length > 0;

  const response = hasFilters
    ? await fetchClient.GET('/api/v1/organisations/search', {
      params: {
        query: {
          searchParams: filters,
          pageable,
        },
      },
    })
    : await fetchClient.GET('/api/v1/organisations', {
      params: {
        query: {
          pageable,
        },
      },
    });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch organisations');
  }

  const parsed = organisationListResponseSchema.parse(response.data ?? {});
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

export const adminOrganisationsQueryKey = (params: AdminOrganisationListParams) => ['admin-organisations', params] as const;

export function useAdminOrganisations(
  params: AdminOrganisationListParams,
  options?: Partial<UseQueryOptions<AdminOrganisationListResult, Error>>
) {
  const normalizedParams: AdminOrganisationListParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    search: params.search ?? '',
    status: params.status ?? 'all',
    verification: params.verification ?? 'all',
    sortField: params.sortField ?? 'created_date',
    sortOrder: params.sortOrder ?? 'desc',
  };

  return useQuery({
    queryKey: adminOrganisationsQueryKey(normalizedParams),
    queryFn: () => fetchAdminOrganisations(normalizedParams),
    ...options,
  });
}

export function useUpdateAdminOrganisation(options?: Partial<Options<UpdateOrganisationData>>) {
  const queryClient = useQueryClient();
  const baseOptions = updateOrganisationMutation(options);

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organisations'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}

export function useVerifyAdminOrganisation(options?: Partial<Options<ModerateOrganisationData>>) {
  const queryClient = useQueryClient();
  const baseOptions = moderateOrganisationMutation({
    ...options,
    query: { action: 'approve', ...(options?.query ?? {}) },
  });

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organisations'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}

export function useUnverifyAdminOrganisation(options?: Partial<Options<ModerateOrganisationData>>) {
  const queryClient = useQueryClient();
  const baseOptions = moderateOrganisationMutation({
    ...options,
    query: { action: 'revoke', ...(options?.query ?? {}) },
  });

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organisations'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}