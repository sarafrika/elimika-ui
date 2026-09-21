'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import {
  createRule,
  type SchemaEnum,
  type SchemaEnum2,
  type ScopeEnum,
  type SystemRuleRequest,
  type SystemRuleResponse,
  updateRule,
  type ValueTypeEnum,
} from '@/services/client';
import { getRuleOptions, listRulesOptions } from '@/services/client/@tanstack/react-query.gen';
import { configQuery, listQuery } from '../lib/admin-queries';

export const RULES_PAGE_SIZE = 50;

const RULE_QUERY_IDS = ['listRules', 'getRule'] as const;

/**
 * How the backend picks a rule when several match, mirrored here so the impact preview
 * says the same thing the platform will do.
 */
const SCOPE_WEIGHT: Record<string, number> = {
  TENANT: 5,
  SEGMENT: 4,
  DEMOGRAPHIC: 3,
  REGION: 2,
  GLOBAL: 1,
};

export interface RuleFilters {
  category?: string;
  status?: string;
  /** Filtered in the browser: the API has no key search. */
  q?: string;
  page?: number;
}

/** The rule list. Category and status are the only filters the API accepts. */
export function useSystemRules(filters: RuleFilters) {
  const page = filters.page ?? 0;

  const query = useQuery({
    ...listRulesOptions({
      query: {
        ...(filters.category && filters.category !== 'any'
          ? { category: filters.category as SchemaEnum }
          : {}),
        ...(filters.status && filters.status !== 'any'
          ? { status: filters.status as SchemaEnum2 }
          : {}),
        pageable: { page, size: RULES_PAGE_SIZE },
      },
    }),
    ...listQuery,
  });

  const { rules, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<SystemRuleResponse>(query.data);
    return {
      rules: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  // The key search is client-side because the endpoint has no search parameter.
  const visible = useMemo(() => {
    const term = filters.q?.trim().toLowerCase();
    if (!term) return rules;
    return rules.filter(rule => (rule.key ?? '').toLowerCase().includes(term));
  }, [rules, filters.q]);

  return { rules: visible, loadedCount: rules.length, totalRows, pageCount, page, query };
}

/** One rule, loaded when the editor opens on an existing uuid. */
export function useSystemRule(uuid: string | undefined) {
  const query = useQuery({
    ...getRuleOptions({ path: { uuid: uuid ?? '' } }),
    ...configQuery,
    enabled: Boolean(uuid) && uuid !== 'new',
  });

  const rule = useMemo(() => extractEntity<SystemRuleResponse>(query.data), [query.data]);
  return { rule, query };
}

export interface RuleFormValues {
  category: SchemaEnum;
  key: string;
  scope: ScopeEnum;
  scopeReference?: string;
  priority: number;
  status: SchemaEnum2;
  valueType: ValueTypeEnum;
  /** Raw JSON text; parsed before it is sent. */
  valuePayload: string;
  conditions?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

/** Turns the form into the request body. This endpoint is camelCase, unlike the rest of the API. */
function toRequest(values: RuleFormValues): SystemRuleRequest {
  return {
    category: values.category,
    key: values.key.trim(),
    scope: values.scope,
    scopeReference: values.scope === 'GLOBAL' ? undefined : values.scopeReference?.trim(),
    priority: values.priority,
    status: values.status,
    valueType: values.valueType,
    valuePayload: JSON.parse(values.valuePayload),
    conditions: values.conditions?.trim() ? JSON.parse(values.conditions) : undefined,
    effectiveFrom: values.effectiveFrom ? new Date(values.effectiveFrom) : undefined,
    effectiveTo: values.effectiveTo ? new Date(values.effectiveTo) : undefined,
  };
}

/**
 * Save a rule. Replacing keeps one row and loses the previous value; scheduling writes a
 * second rule with a later start, which is why the editor defaults to scheduling.
 */
export function useSaveRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, values }: { uuid?: string; values: RuleFormValues }) => {
      const body = toRequest(values);

      if (uuid && uuid !== 'new') {
        const { data } = await updateRule({ path: { uuid }, body, throwOnError: true });
        return data;
      }

      const { data } = await createRule({ body, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, RULE_QUERY_IDS);
      toast.success(`${variables.values.key} saved`);
    },
    onError: (error, variables) =>
      toast.error(
        getErrorMessage(
          error,
          `Could not save ${variables.values.key} — a rule with this category, key, scope and start may already exist`
        )
      ),
  });
}

export interface FeePayload {
  mode: 'PERCENTAGE' | 'FLAT';
  amount: number;
  currency?: string;
}

/** Reads the platform-fee shape out of a payload, when it has one. */
export function readFeePayload(payload: unknown): FeePayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const mode = record.mode;
  const amount = Number(record.amount);

  if ((mode !== 'PERCENTAGE' && mode !== 'FLAT') || !Number.isFinite(amount)) return null;
  return {
    mode,
    amount,
    currency: typeof record.currency === 'string' ? record.currency : undefined,
  };
}

/** True while a rule is inside its effective window. */
function isInWindow(rule: SystemRuleResponse, at: Date) {
  const from = rule.effectiveFrom ? new Date(rule.effectiveFrom) : null;
  const to = rule.effectiveTo ? new Date(rule.effectiveTo) : null;
  if (from && from > at) return false;
  if (to && to < at) return false;
  return true;
}

/**
 * Which rule the platform would actually use, following the backend's order: active and
 * in window, then highest priority, then the most specific scope, then the latest start.
 */
export function pickWinningRule(
  rules: SystemRuleResponse[],
  key: string,
  at: Date = new Date()
): SystemRuleResponse | null {
  const candidates = rules
    .filter(rule => rule.key === key && rule.status === 'ACTIVE' && isInWindow(rule, at))
    .sort((left, right) => {
      const byPriority = (right.priority ?? 0) - (left.priority ?? 0);
      if (byPriority !== 0) return byPriority;

      const byScope =
        (SCOPE_WEIGHT[right.scope ?? 'GLOBAL'] ?? 0) - (SCOPE_WEIGHT[left.scope ?? 'GLOBAL'] ?? 0);
      if (byScope !== 0) return byScope;

      const leftFrom = left.effectiveFrom ? new Date(left.effectiveFrom).valueOf() : 0;
      const rightFrom = right.effectiveFrom ? new Date(right.effectiveFrom).valueOf() : 0;
      return rightFrom - leftFrom;
    });

  return candidates[0] ?? null;
}
