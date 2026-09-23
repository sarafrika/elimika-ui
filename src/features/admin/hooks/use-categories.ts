'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { type Category, createCategory, deleteCategory, updateCategory } from '@/services/client';
import {
  getRootCategoriesOptions,
  getSubCategoriesOptions,
  searchCategoriesOptions,
  searchCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { configQuery, listQuery } from '../lib/admin-queries';

/** Every read that shows a category, refreshed after one is saved or deleted. */
const CATEGORY_QUERY_IDS = [
  'getRootCategories',
  'getSubCategories',
  'searchCategories',
  'getAllCategories',
  'getCategoryByUuid',
] as const;

export const CATEGORY_SEARCH_PAGE_SIZE = 25;

/** Top of the tree. Children are fetched only when a node is opened. */
export function useRootCategories() {
  const query = useQuery({ ...getRootCategoriesOptions(), ...configQuery });
  const categories = useMemo(() => extractList<Category>(query.data), [query.data]);
  return { categories, query };
}

/** One level of children, loaded when its parent expands. */
export function useSubCategories(parentUuid: string | undefined, enabled: boolean) {
  const query = useQuery({
    ...getSubCategoriesOptions({ path: { parentUuid: parentUuid ?? '' } }),
    ...configQuery,
    enabled: Boolean(parentUuid) && enabled,
  });
  const categories = useMemo(() => extractList<Category>(query.data), [query.data]);
  return { categories, query };
}

/** Flat search across the whole tree, used instead of the tree while a term is typed. */
export function useCategorySearch(term: string, activeOnly: string) {
  const trimmed = term.trim();

  const searchParams: Record<string, unknown> = {};
  if (trimmed) searchParams.name_like = trimmed;
  if (activeOnly === 'active') searchParams.is_active_eq = true;
  if (activeOnly === 'inactive') searchParams.is_active_eq = false;

  const query = useQuery({
    ...searchCategoriesOptions({
      query: { searchParams, pageable: { page: 0, size: CATEGORY_SEARCH_PAGE_SIZE } },
    }),
    ...listQuery,
    enabled: trimmed.length > 0 || activeOnly !== 'any',
  });

  const { categories, totalRows } = useMemo(() => {
    const { items, metadata } = extractPage<Category>(query.data);
    return { categories: items, totalRows: getTotalFromMetadata(metadata) };
  }, [query.data]);

  return { categories, totalRows, query, isSearching: trimmed.length > 0 || activeOnly !== 'any' };
}

/**
 * How many courses carry this category. The course search filters on the category name,
 * so the count follows the name rather than the uuid.
 */
export function useCategoryCourseCount(categoryName: string | undefined) {
  const query = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: { category_name: categoryName ?? '' },
        pageable: { page: 0, size: 1 },
      },
    }),
    ...listQuery,
    enabled: Boolean(categoryName),
  });

  const count = useMemo(() => {
    const { metadata } = extractPage(query.data);
    return getTotalFromMetadata(metadata);
  }, [query.data]);

  return { count, query };
}

export interface CategoryFormValues {
  name: string;
  description?: string;
  parent_uuid?: string | null;
  is_active: boolean;
}

/**
 * Create or update a category. On update a null parent_uuid is skipped by the API, so a
 * category cannot be moved back to the root here — that needs a backend change.
 */
export function useSaveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      values,
    }: {
      uuid?: string;
      values: CategoryFormValues;
    }) => {
      const body: Category = {
        name: values.name,
        description: values.description,
        parent_uuid: values.parent_uuid ?? null,
        is_active: values.is_active,
      };

      if (uuid) {
        const { data } = await updateCategory({ path: { uuid }, body, throwOnError: true });
        return data;
      }

      const { data } = await createCategory({ body, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, CATEGORY_QUERY_IDS);
      toast.success(`${variables.values.name} saved`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not save ${variables.values.name}`)),
  });
}

/**
 * Delete a category. Courses lose it through a database cascade; the call is refused
 * when it still has children or a training program points at it.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid }: { uuid: string; name: string }) => {
      const { data } = await deleteCategory({ path: { uuid }, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, CATEGORY_QUERY_IDS);
      toast.success(`${variables.name} deleted`);
    },
    onError: (error, variables) =>
      toast.error(
        getErrorMessage(
          error,
          `Could not delete ${variables.name} — it may still have subcategories or be used by a program`
        )
      ),
  });
}
