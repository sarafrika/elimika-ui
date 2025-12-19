import { toNumber } from '@/lib/metrics';
import { fetchClient } from '@/services/api/fetch-client';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const moderationQueueItemSchema = z.object({
  uuid: z.string().uuid(),
  entity_uuid: z.string(),
  entity_type: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'DISMISSED']).default('PENDING'),
  submitted_by: z.string().optional(),
  submitted_by_name: z.string().optional(),
  submitted_at: z.string().datetime().optional(),
  payload: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

const moderationQueueResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      content: z.array(moderationQueueItemSchema).default([]),
      metadata: z
        .object({
          pageNumber: z.number().int().optional(),
          pageSize: z.number().int().optional(),
          totalElements: z.coerce.bigint().optional(),
          totalPages: z.number().int().optional(),
          hasNext: z.boolean().optional(),
          hasPrevious: z.boolean().optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
  message: z.string().optional(),
});

const moderationActionResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: moderationQueueItemSchema.optional(),
});

export type ModerationQueueItem = z.infer<typeof moderationQueueItemSchema>;
export type ModerationActionResult = z.infer<typeof moderationActionResponseSchema>;

export interface ModerationQueueParams {
  page?: number;
  size?: number;
  status?: 'all' | 'PENDING' | 'APPROVED' | 'DISMISSED';
  entityType?: string;
  search?: string;
}

export interface ModerationQueueResult {
  items: ModerationQueueItem[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type ModerationAction = 'approve' | 'dismiss';

export interface ModerationActionInput {
  queueUuid: string;
  action: ModerationAction;
  reason?: string;
  listParams: ModerationQueueParams;
}

function normalizeModerationParams(params: ModerationQueueParams = {}): ModerationQueueParams {
  return {
    page: params.page ?? 0,
    size: params.size ?? 20,
    status: params.status ?? 'all',
    entityType: params.entityType ?? '',
    search: params.search ?? '',
  } satisfies ModerationQueueParams;
}

function buildModerationFilters(params: ModerationQueueParams) {
  const filters: Record<string, unknown> = {};

  if (params.search?.trim()) {
    const query = params.search.trim();
    filters.entity_uuid_like = query;
    filters.entity_type_like = query;
    filters.submitted_by_like = query;
    filters.submitted_by_name_like = query;
    filters.notes_like = query;
  }

  if (params.status && params.status !== 'all') {
    filters.status_eq = params.status;
  }

  if (params.entityType) {
    filters.entity_type_eq = params.entityType;
  }

  return filters;
}

export async function fetchModerationQueue(
  params: ModerationQueueParams = {}
): Promise<ModerationQueueResult> {
  const normalizedParams = normalizeModerationParams(params);
  const { page = 0, size = 20 } = normalizedParams;
  const filters = buildModerationFilters(normalizedParams);

  const response = await fetchClient.GET('/api/v1/admin/moderation/queue', {
    params: {
      query: {
        pageable: {
          page,
          size,
          sort: ['submitted_at,desc'],
        },
        searchParams: filters,
      },
    },
  });

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch moderation queue'
    );
  }

  const parsed = moderationQueueResponseSchema.parse(response.data ?? {});
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

export const adminModerationQueueQueryKey = (params: ModerationQueueParams) =>
  ['admin-moderation', params] as const;

export function useModerationQueue(
  params: ModerationQueueParams,
  options?: Partial<UseQueryOptions<ModerationQueueResult, Error>>
) {
  const normalizedParams = normalizeModerationParams(params);

  return useQuery({
    queryKey: adminModerationQueueQueryKey(normalizedParams),
    queryFn: () => fetchModerationQueue(normalizedParams),
    ...options,
  });
}

async function runModerationAction({ queueUuid, action, reason }: ModerationActionInput) {
  const response = await fetchClient.POST('/api/v1/admin/moderation/actions', {
    body: {
      queue_uuid: queueUuid,
      action,
      reason,
    },
  });

  if (response.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to update moderation item'
    );
  }

  return moderationActionResponseSchema.parse(response.data ?? {});
}

type ModerationActionContext = {
  previous?: ModerationQueueResult;
  queryKey: ReturnType<typeof adminModerationQueueQueryKey>;
};

export function useModerationAction() {
  const queryClient = useQueryClient();

  return useMutation<ModerationActionResult, Error, ModerationActionInput, ModerationActionContext>(
    {
      mutationFn: (input: ModerationActionInput) => runModerationAction(input),
      onMutate: async variables => {
        const normalizedParams = normalizeModerationParams(variables.listParams);
        const queryKey = adminModerationQueueQueryKey(normalizedParams);
        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueryData<ModerationQueueResult>(queryKey);

        if (previous) {
          const nextItems = previous.items.map(item =>
            item.uuid === variables.queueUuid
              ? {
                  ...item,
                  status: variables.action === 'approve' ? 'APPROVED' : 'DISMISSED',
                }
              : item
          );

          queryClient.setQueryData<ModerationQueueResult>(queryKey, {
            ...previous,
            items: nextItems,
          });
        }

        return { previous, queryKey } satisfies ModerationActionContext;
      },
      onError: (_error, _variables, context) => {
        if (context?.previous && context.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previous);
        }
      },
      onSettled: (_data, _error, variables) => {
        const normalizedParams = normalizeModerationParams(variables.listParams);
        queryClient.invalidateQueries({ queryKey: adminModerationQueueQueryKey(normalizedParams) });
      },
    }
  );
}
