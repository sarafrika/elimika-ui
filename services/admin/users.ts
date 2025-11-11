import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { updateUserMutation } from '@/services/client/@tanstack/react-query.gen';
import { zApiResponsePagedDtoUser, zUser } from '@/services/client/zod.gen';
import type { Options, UpdateUserData } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const userListResponseSchema = zApiResponsePagedDtoUser.extend({
  data: zApiResponsePagedDtoUser.shape.data.default({ content: [] }),
});

export type AdminUser = z.infer<typeof zUser>;

export interface AdminUserListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  domain?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUserListResult {
  items: AdminUser[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function buildUserSearchFilters(params: AdminUserListParams) {
  const filters: Record<string, unknown> = {};

  if (params.search) {
    const query = params.search.trim();
    filters.first_name_like = query;
    filters.last_name_like = query;
    filters.email_like = query;
    filters.username_like = query;
  }

  if (params.status && params.status !== 'all') {
    filters.active_eq = params.status === 'active';
  }

  if (params.domain && params.domain !== 'all') {
    filters.user_domain_eq = params.domain;
  }

  return filters;
}

export async function fetchAdminUsers(params: AdminUserListParams = {}): Promise<AdminUserListResult> {
  const { page = 0, size = 20, sortField = 'created_date', sortOrder = 'desc' } = params;
  const pageable = {
    page,
    size,
    sort: [`${sortField},${sortOrder}`],
  };

  const searchFilters = buildUserSearchFilters(params);
  const hasSearchFilters = Object.keys(searchFilters).length > 0;

  const response = hasSearchFilters
    ? await fetchClient.GET('/api/v1/users/search', {
        params: {
          query: {
            searchParams: searchFilters,
            pageable,
          },
        },
      })
    : await fetchClient.GET('/api/v1/users', {
        params: {
          query: {
            pageable,
          },
        },
      });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch users');
  }

  const parsed = userListResponseSchema.parse(response.data ?? {});
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

export const adminUsersQueryKey = (params: AdminUserListParams) => ['admin-users', params] as const;

export function useAdminUsers(
  params: AdminUserListParams,
  options?: Partial<UseQueryOptions<AdminUserListResult, Error>>
) {
  const normalizedParams: AdminUserListParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    search: params.search ?? '',
    status: params.status ?? 'all',
    domain: params.domain ?? 'all',
    sortField: params.sortField ?? 'created_date',
    sortOrder: params.sortOrder ?? 'desc',
  };

  return useQuery({
    queryKey: adminUsersQueryKey(normalizedParams),
    queryFn: () => fetchAdminUsers(normalizedParams),
    ...options,
  });
}

export function useUpdateAdminUser(options?: Partial<Options<UpdateUserData>>) {
  const queryClient = useQueryClient();
  const baseOptions = updateUserMutation(options);

  return useMutation({
    ...baseOptions,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      baseOptions.onSuccess?.(data, variables, context);
    },
  });
}
