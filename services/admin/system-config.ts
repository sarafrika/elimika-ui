import { toNumber } from '@/lib/metrics';
import { getRuleOptions, listRulesOptions } from '@/services/client/@tanstack/react-query.gen';
import { createRule, updateRule } from '@/services/client/sdk.gen';
import type {
  ListRulesData,
  SchemaEnum,
  SchemaEnum2,
  ScopeEnum,
  ValueTypeEnum,
} from '@/services/client/types.gen';
import { zApiResponsePagedDtoSystemRuleResponse } from '@/services/client/zod.gen';
import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

export type SystemRule = Record<string, any>;
export type SystemRulePayload = z.infer<typeof zSystemRuleRequest>;
export type SystemRuleCategory = SchemaEnum;
export type SystemRuleStatus = SchemaEnum2;
export type SystemRuleScope = ScopeEnum;
export type SystemRuleValueType = ValueTypeEnum;
export type SystemRuleRequestPayload = {
  category: SystemRuleCategory;
  key: string;
  scope?: SystemRuleScope;
  scopeReference?: string;
  priority?: number;
  status?: SystemRuleStatus;
  valueType?: SystemRuleValueType;
  valuePayload: Record<string, any>;
  conditions?: Record<string, any>;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export interface SystemRuleListParams {
  page?: number;
  size?: number;
  category?: SystemRuleCategory | 'all';
  status?: SystemRuleStatus | 'all';
  sort?: string[];
}

export interface SystemRuleListResult {
  items: SystemRule[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const listRulesResponseSchema = zApiResponsePagedDtoSystemRuleResponse.passthrough();

const systemRuleRequestSchema = z.object({
  category: z.string(),
  key: z.string(),
  scope: z.string().optional(),
  scopeReference: z.string().optional(),
  priority: z.number().optional(),
  status: z.string().optional(),
  valueType: z.string().optional(),
  valuePayload: z.record(z.any()),
  conditions: z.record(z.any()).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

const buildListRulesOptions = (params: SystemRuleListParams) => {
  const query: ListRulesData['query'] = {
    pageable: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      ...(params.sort && params.sort.length > 0 ? { sort: params.sort } : {}),
    },
  };

  return listRulesOptions({ query });
};

const deriveListResult = (data: unknown, fallback: Required<SystemRuleListParams>): SystemRuleListResult => {
  // Use the raw response payload to avoid losing items if schemas drift
  const base: any = (data as any)?.data ?? data ?? {};
  const payload = base?.data ?? base; // handle possible double nesting

  const items =
    (Array.isArray(payload?.content) && payload.content) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(base?.content) && base.content) ||
    [];

  const metadata =
    payload?.metadata ??
    payload?.page ??
    base?.metadata ??
    {};

  const page =
    Number.isFinite(metadata.pageNumber) || Number.isFinite(metadata.page)
      ? (Number(metadata.pageNumber ?? metadata.page) as number)
      : fallback.page;
  const size =
    Number.isFinite(metadata.pageSize) || Number.isFinite(metadata.size)
      ? (Number(metadata.pageSize ?? metadata.size) as number)
      : fallback.size;
  const totalItems = toNumber(metadata.totalElements ?? metadata.totalItems ?? items.length, items.length);
  const totalPages =
    metadata.totalPages ??
    (totalItems > 0 && size > 0 ? Math.ceil(totalItems / size) : 0);

  return {
    items,
    page,
    size,
    totalItems,
    totalPages,
    hasNext: metadata.hasNext ?? page < totalPages - 1,
    hasPrevious: metadata.hasPrevious ?? page > 0,
  };
};

export function useSystemRules(
  params: SystemRuleListParams,
  options?: Partial<UseQueryOptions<SystemRuleListResult, Error>>
) {
  const normalized: Required<SystemRuleListParams> = {
    page: params.page ?? 0,
    size: params.size ?? 10,
    category: params.category ?? 'all',
    status: params.status ?? 'all',
    sort: params.sort ?? [],
  };

  return useQuery({
    ...buildListRulesOptions(normalized),
    select: data => deriveListResult(data, normalized),
    ...options,
  });
}

export function useSystemRule(uuid: string | null, options?: Partial<UseQueryOptions<SystemRule | null, Error>>) {
  return useQuery({
    ...getRuleOptions({
      path: { uuid: uuid ?? '' },
    }),
    enabled: Boolean(uuid),
    select: data => (data as any)?.data ?? data ?? null,
    ...options,
  });
}

export function useCreateSystemRule(
  options?: Partial<UseMutationOptions<SystemRule | null, Error, SystemRuleRequestPayload>>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation<SystemRule | null, Error, SystemRuleRequestPayload>({
    mutationFn: async payload => {
      const body = systemRuleRequestSchema.parse(payload);
      const { data } = await createRule({
        body,
        throwOnError: true,
      });
      return (data as any)?.data ?? data ?? null;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [{ _id: 'listRules' }] });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

type UpdateRuleVariables = {
  uuid: string;
  body: SystemRuleRequestPayload;
};

export function useUpdateSystemRule(
  options?: Partial<UseMutationOptions<SystemRule | null, Error, UpdateRuleVariables>>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation<SystemRule | null, Error, UpdateRuleVariables>({
    mutationFn: async variables => {
      const body = systemRuleRequestSchema.parse(variables.body);
      const { data } = await updateRule({
        path: { uuid: variables.uuid },
        body,
        throwOnError: true,
      });
      return (data as any)?.data ?? data ?? null;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [{ _id: 'listRules' }] });
      queryClient.invalidateQueries({ queryKey: [{ _id: 'getRule' }] });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
