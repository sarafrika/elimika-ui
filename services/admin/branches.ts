import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import {
  zApiResponsePagedDtoTrainingBranch,
  zApiResponsePagedDtoUser,
  zUser,
} from '@/services/client/zod.gen';
import type { TrainingBranch } from '@/services/client/types.gen';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const branchListResponseSchema = zApiResponsePagedDtoTrainingBranch.extend({
  data: zApiResponsePagedDtoTrainingBranch.shape.data.default({ content: [] }),
});

export interface AdminBranchListParams {
  organizationUuid: string;
  search?: string;
  page?: number;
  size?: number;
  active?: 'all' | 'true' | 'false';
}

export interface AdminBranchListResult {
  items: TrainingBranch[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export async function fetchAdminBranches(
  params: AdminBranchListParams
): Promise<AdminBranchListResult> {
  const { organizationUuid, page = 0, size = 10, search, active = 'all' } = params;

  const response = await fetchClient.GET('/api/v1/organisations/{uuid}/training-branches' as any, {
    params: {
      path: { uuid: organizationUuid },
      query: {
        page,
        size,
        search: search || undefined,
        active: active === 'all' ? undefined : active,
      },
    },
  });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to load branches');
  }

  const parsed = branchListResponseSchema.parse(response.data ?? {});
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
  };
}

export const adminBranchesQueryKey = (params: AdminBranchListParams) =>
  ['admin-branches', params] as const;

export function useAdminBranches(
  params: AdminBranchListParams | null,
  options?: Partial<UseQueryOptions<AdminBranchListResult, Error>>
) {
  return useQuery({
    queryKey: adminBranchesQueryKey(params ?? { organizationUuid: 'none' }),
    queryFn: () => {
      if (!params?.organizationUuid) {
        throw new Error('Missing organization id');
      }
      return fetchAdminBranches(params);
    },
    enabled: Boolean(params?.organizationUuid),
    ...options,
  });
}

const branchUsersResponseSchema = zApiResponsePagedDtoUser.extend({
  data: zApiResponsePagedDtoUser.shape.data.default({ content: [] }),
});

export type BranchUser = z.infer<typeof zUser>;

export interface BranchUserListParams {
  organizationUuid: string;
  branchUuid: string;
  page?: number;
  size?: number;
}

export interface BranchUserListResult {
  items: BranchUser[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export async function fetchBranchUsers(
  params: BranchUserListParams
): Promise<BranchUserListResult> {
  const { organizationUuid, branchUuid, page = 0, size = 20 } = params;

  const response = await fetchClient.GET(
    '/api/v1/organisations/{uuid}/training-branches/{branchUuid}/users' as any,
    {
      params: {
        path: { uuid: organizationUuid, branchUuid },
        query: {
          page,
          size,
        },
      },
    }
  );

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to load branch members'
    );
  }

  const parsed = branchUsersResponseSchema.parse(response.data ?? {});
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
  };
}

export const branchUsersQueryKey = (params: BranchUserListParams | null) =>
  ['branch-users', params?.organizationUuid, params?.branchUuid, params?.page, params?.size] as const;

export function useBranchUsers(
  params: BranchUserListParams | null,
  options?: Partial<UseQueryOptions<BranchUserListResult, Error>>
) {
  return useQuery({
    queryKey: branchUsersQueryKey(params),
    queryFn: () => {
      if (!params?.organizationUuid || !params.branchUuid) {
        throw new Error('Missing branch context');
      }
      return fetchBranchUsers(params);
    },
    enabled: Boolean(params?.organizationUuid && params?.branchUuid),
    ...options,
  });
}
