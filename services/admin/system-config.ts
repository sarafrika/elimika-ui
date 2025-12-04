import { toNumber } from '@/lib/metrics';
import { getRuleOptions, listRulesOptions } from '@/services/client/@tanstack/react-query.gen';
import { createRule, updateRule } from '@/services/client/sdk.gen';
import type {
  ListRulesData,
  SchemaEnum,
  SchemaEnum2,
  ScopeEnum,
  SystemRuleRequest,
  ValueTypeEnum,
} from '@/services/client/types.gen';
import {
  zApiResponsePagedDtoSystemRuleResponse,
  zApiResponseSystemRuleResponse,
  zSystemRuleRequest,
  zSystemRuleResponse,
} from '@/services/client/zod.gen';
import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

export type SystemRule = z.infer<typeof zSystemRuleResponse>;
export type SystemRulePayload = z.infer<typeof zSystemRuleRequest>;
export type SystemRuleCategory = SchemaEnum;
export type SystemRuleStatus = SchemaEnum2;
export type SystemRuleScope = ScopeEnum;
export type SystemRuleValueType = ValueTypeEnum;

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

const ruleResponseSchema = zApiResponseSystemRuleResponse.passthrough();

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
  try {
    const parsed = listRulesResponseSchema.parse(data ?? {});
    const payload = parsed.data ?? {};
    const items = Array.isArray(payload.content) ? payload.content : [];
    const metadata = payload.metadata ?? {};

    const page = Number.isFinite(metadata.pageNumber) ? (metadata.pageNumber as number) : fallback.page;
    const size = Number.isFinite(metadata.pageSize) ? (metadata.pageSize as number) : fallback.size;
    const totalItems = toNumber(metadata.totalElements);
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
  } catch (error) {
    // If schema validation fails, return empty result
    return {
      items: [],
      page: fallback.page,
      size: fallback.size,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
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
    select: data => {
      const parsed = ruleResponseSchema.parse(data ?? {});
      return (parsed.data as SystemRule | undefined) ?? null;
    },
    ...options,
  });
}

export function useCreateSystemRule(
  options?: Partial<UseMutationOptions<SystemRule | null, Error, SystemRuleRequest>>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation<SystemRule | null, Error, SystemRuleRequest>({
    mutationFn: async payload => {
      const body = zSystemRuleRequest.parse(payload);
      const { data } = await createRule({
        body,
        throwOnError: true,
      });
      const parsed = ruleResponseSchema.parse(data ?? {});
      return (parsed.data as SystemRule | undefined) ?? null;
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
  body: SystemRuleRequest;
};

export function useUpdateSystemRule(
  options?: Partial<UseMutationOptions<SystemRule | null, Error, UpdateRuleVariables>>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation<SystemRule | null, Error, UpdateRuleVariables>({
    mutationFn: async variables => {
      const body = zSystemRuleRequest.parse(variables.body);
      const { data } = await updateRule({
        path: { uuid: variables.uuid },
        body,
        throwOnError: true,
      });
      const parsed = ruleResponseSchema.parse(data ?? {});
      return (parsed.data as SystemRule | undefined) ?? null;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [{ _id: 'listRules' }] });
      queryClient.invalidateQueries({ queryKey: [{ _id: 'getRule' }] });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
