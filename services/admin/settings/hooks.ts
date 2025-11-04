import { useCallback } from 'react';
import {
  QueryFunctionContext,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { fetchAuditLogs, type AuditLogFilters } from './audit-logs';
import { listEmailTemplates, updateEmailTemplate } from './templates';
import { listFeatureToggles, updateFeatureToggle } from './feature-toggles';
import { AuditLogPage, EmailTemplate, FeatureToggle, UpdateEmailTemplateInput } from './schemas';

const emailTemplatesQueryKey = ['admin', 'settings', 'email-templates'];
const auditLogQueryKey = ['admin', 'settings', 'audit-logs'];
const featureToggleQueryKey = ['admin', 'settings', 'feature-toggles'];

type InfiniteAuditLogQueryKey = [string, string, string, AuditLogFilters | undefined];

export function useAdminEmailTemplates() {
  return useQuery<EmailTemplate[]>({
    queryKey: emailTemplatesQueryKey,
    queryFn: listEmailTemplates,
    staleTime: 1000 * 60,
  });
}

export function useAdminUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: UpdateEmailTemplateInput;
    }) => updateEmailTemplate(templateId, payload),
    onSuccess: updatedTemplate => {
      queryClient.setQueryData<EmailTemplate[]>(emailTemplatesQueryKey, current => {
        if (!current) {
          return [updatedTemplate];
        }
        return current.map(template =>
          template.id === updatedTemplate.id ? updatedTemplate : template
        );
      });
    },
  });
}

const createAuditLogQuery = async (
  context: QueryFunctionContext<InfiniteAuditLogQueryKey, number>
): Promise<AuditLogPage> => {
  const [, , , filters] = context.queryKey;
  const pageParam = context.pageParam ?? 0;

  return fetchAuditLogs({
    page: pageParam,
    filters: filters ?? {},
  });
};

export function useAdminAuditLogs(filters?: AuditLogFilters) {
  return useInfiniteQuery<AuditLogPage, Error, AuditLogPage, InfiniteAuditLogQueryKey, number>({
    queryKey: [...auditLogQueryKey, filters] as InfiniteAuditLogQueryKey,
    queryFn: createAuditLogQuery,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasNext ? (lastPageParam ?? 0) + 1 : undefined,
    refetchOnWindowFocus: false,
  });
}

export function useAdminFeatureToggles() {
  return useQuery<FeatureToggle[]>({
    queryKey: featureToggleQueryKey,
    queryFn: listFeatureToggles,
    staleTime: 1000 * 30,
  });
}

export function useAdminUpdateFeatureToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      featureName,
      enabled,
    }: {
      featureName: string;
      enabled: boolean;
    }) => updateFeatureToggle(featureName, enabled),
    onMutate: async ({ featureName, enabled }) => {
      await queryClient.cancelQueries({ queryKey: featureToggleQueryKey });
      const previous = queryClient.getQueryData<FeatureToggle[]>(featureToggleQueryKey);

      queryClient.setQueryData<FeatureToggle[]>(featureToggleQueryKey, current => {
        if (!current) {
          return [
            {
              name: featureName,
              enabled,
            },
          ];
        }

        return current.map(toggle =>
          toggle.name === featureName ? { ...toggle, enabled } : toggle
        );
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(featureToggleQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: featureToggleQueryKey });
    },
  });
}

export function useAdminInvalidateAuditLogs() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: auditLogQueryKey });
  }, [queryClient]);
}
