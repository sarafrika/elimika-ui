'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import {
  type CommerceCatalogueItem,
  type CommerceCatalogueItemUpsertRequest,
  createCatalogItem,
  updateCatalogItem,
} from '@/services/client';
import { searchCatalogueOptions } from '@/services/client/@tanstack/react-query.gen';
import { invalidateAdminOverview, listQuery } from '../lib/admin-queries';

export const CATALOGUE_PAGE_SIZE = 20;

export interface CatalogueFilters {
  active: string;
  visible: string;
  page: number;
}

/**
 * The catalogue as the storefront sees it. `/search` is used rather than the plain list
 * because it pages and carries the course snapshot, so a row can show a name without a
 * lookup per item. Product and variant codes are not filterable.
 */
export function useCatalogue({ active, visible, page }: CatalogueFilters) {
  const searchParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (active !== 'any') params.active = active === 'active';
    if (visible !== 'any') params.publiclyVisible = visible === 'public';
    return params;
  }, [active, visible]);

  const query = useQuery({
    ...searchCatalogueOptions({
      query: { searchParams, pageable: { page, size: CATALOGUE_PAGE_SIZE } },
    }),
    ...listQuery,
  });

  const { items, totalRows, pageCount } = useMemo(() => {
    const { items: rows, metadata } = extractPage<CommerceCatalogueItem>(query.data);
    return {
      items: rows,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { items, totalRows, pageCount, query };
}

/** What a catalogue row is selling, worked out from whichever uuid is set. */
export function catalogueItemKind(item: CommerceCatalogueItem): 'Course' | 'Class' | 'Program' {
  if (item.class_definition_uuid) return 'Class';
  if (item.program_uuid) return 'Program';
  return 'Course';
}

/** The name to show for a row: the course snapshot, else the code it sells under. */
export function catalogueItemName(item: CommerceCatalogueItem): string {
  return item.course?.name || item.product_code || 'Catalogue entry';
}

export interface CatalogueUpsertVariables {
  /** Present when editing; absent when creating. */
  catalogUuid?: string;
  body: CommerceCatalogueItemUpsertRequest;
  /** Used in the toast so the admin sees which entry moved. */
  name: string;
}

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * Create or replace a catalogue entry. A PUT replaces every field, so the form always
 * sends the whole object; price is set on the variant, not here.
 */
export function useSaveCatalogueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ catalogUuid, body }: CatalogueUpsertVariables) => {
      if (catalogUuid) {
        const { data } = await updateCatalogItem({
          path: { catalogUuid },
          body,
          throwOnError: true,
        });
        return data;
      }
      const { data } = await createCatalogItem({ body, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['searchCatalogue'] });
      await queryClient.invalidateQueries({ queryKey: ['listCatalogItems'] });
      await invalidateAdminOverview(queryClient);
      toast.success(`${variables.name} saved`);
    },
    onError: (error, variables) => {
      if (statusOf(error) === 409) {
        toast.error('Another entry already uses that product and variant code');
        return;
      }
      toast.error(getErrorMessage(error, `Could not save ${variables.name}`));
    },
  });
}
