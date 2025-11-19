import { fetchClient } from '@/services/api/fetch-client';
import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';

export type SystemRuleStatus = 'ACTIVE' | 'DRAFT' | 'DISABLED' | string;
export type SystemRuleCategory = 'PLATFORM_FEE' | 'AGE_GATE' | 'NOTIFICATIONS' | string;

export interface SystemRule {
  uuid: string;
  key: string;
  category: string;
  status: SystemRuleStatus;
  priority?: number | null;
  scope_type?: string | null;
  scope_reference?: string | null;
  scope_label?: string | null;
  description?: string | null;
  payload?: Record<string, unknown> | null;
  effective_from?: string | null;
  effective_to?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface SystemRuleListParams {
  page?: number;
  size?: number;
  category?: SystemRuleCategory | 'all';
  status?: SystemRuleStatus | 'all';
  search?: string;
}

export interface SystemRuleListResult {
  items: SystemRule[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
}

const normalizeRulesPayload = (payload: unknown): SystemRule[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as SystemRule[];
  }

  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    if (Array.isArray(data.content)) return data.content as SystemRule[];
    if (Array.isArray(data.items)) return data.items as SystemRule[];
    if (Array.isArray(data.rules)) return data.rules as SystemRule[];
  }

  return [];
};

const normalizeMetadata = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const data = payload as Record<string, unknown>;
  if (typeof data.metadata === 'object' && data.metadata !== null) {
    return data.metadata as Record<string, unknown>;
  }

  return data;
};

export async function fetchSystemRules(params: SystemRuleListParams = {}): Promise<SystemRuleListResult> {
  const { page = 0, size = 10, category = 'all', status = 'all', search = '' } = params;

  const response = await fetchClient.GET('/api/v1/system-rules' as any, {
    params: {
      query: {
        page,
        size,
        category: category === 'all' ? undefined : category,
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      },
    },
  });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to load system rules');
  }

  const data = (response.data as any)?.data ?? response.data ?? {};
  const items = normalizeRulesPayload(data);
  const metadata = normalizeMetadata(data.metadata ?? data);

  const totalItems =
    typeof metadata.totalElements === 'number'
      ? metadata.totalElements
      : Array.isArray(items)
        ? items.length
        : 0;

  const totalPages =
    typeof metadata.totalPages === 'number'
      ? metadata.totalPages
      : totalItems > 0
        ? Math.ceil(totalItems / size)
        : 0;

  return {
    items,
    page: typeof metadata.pageNumber === 'number' ? metadata.pageNumber : page,
    size: typeof metadata.pageSize === 'number' ? metadata.pageSize : size,
    totalItems,
    totalPages,
  };
}

export const systemRulesQueryKey = (params: SystemRuleListParams) =>
  ['system-rules', params] as const;

export function useSystemRules(
  params: SystemRuleListParams,
  options?: Partial<UseQueryOptions<SystemRuleListResult, Error>>
) {
  const normalizedParams: SystemRuleListParams = {
    page: params.page ?? 0,
    size: params.size ?? 10,
    category: params.category ?? 'all',
    status: params.status ?? 'all',
    search: params.search ?? '',
  };

  return useQuery({
    queryKey: systemRulesQueryKey(normalizedParams),
    queryFn: () => fetchSystemRules(normalizedParams),
    staleTime: 30_000,
    ...options,
  });
}

export async function fetchSystemRule(uuid: string): Promise<SystemRule> {
  const response = await fetchClient.GET(`/api/v1/system-rules/${uuid}` as any);

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to load rule');
  }

  return ((response.data as any)?.data ?? response.data) as SystemRule;
}

export function useSystemRule(
  uuid: string | null,
  options?: Partial<UseQueryOptions<SystemRule, Error>>
) {
  return useQuery({
    queryKey: ['system-rule', uuid],
    queryFn: () => {
      if (!uuid) throw new Error('Missing rule id');
      return fetchSystemRule(uuid);
    },
    enabled: Boolean(uuid),
    ...options,
  });
}

export interface UpsertSystemRuleInput {
  category: string;
  key: string;
  status: SystemRuleStatus;
  priority?: number | null;
  scope_type?: string | null;
  scope_reference?: string | null;
  description?: string | null;
  payload: Record<string, unknown>;
  effective_from?: string | null;
  effective_to?: string | null;
}

async function createSystemRule(payload: UpsertSystemRuleInput): Promise<SystemRule> {
  const response = await fetchClient.POST('/api/v1/system-rules' as any, {
    body: payload,
  });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to create rule');
  }

  return ((response.data as any)?.data ?? response.data) as SystemRule;
}

async function updateSystemRule(uuid: string, payload: Partial<UpsertSystemRuleInput>): Promise<SystemRule> {
  const response = await fetchClient.PUT(`/api/v1/system-rules/${uuid}` as any, {
    body: payload,
  });

  if (response.error) {
    throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update rule');
  }

  return ((response.data as any)?.data ?? response.data) as SystemRule;
}

export function useCreateSystemRule(
  options?: UseMutationOptions<SystemRule, Error, UpsertSystemRuleInput>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSystemRule,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['system-rules'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

type UpdateRuleVariables = {
  uuid: string;
  payload: Partial<UpsertSystemRuleInput>;
};

export function useUpdateSystemRule(
  options?: UseMutationOptions<SystemRule, Error, UpdateRuleVariables>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variables => updateSystemRule(variables.uuid, variables.payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['system-rules'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
