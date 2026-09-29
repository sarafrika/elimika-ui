'use client';

import {
  type UseQueryResult,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { toNumber } from '@/lib/metrics';
import { type Category, createCategory, deleteCategory, updateCategory } from '@/services/client';
import {
  getAllCategoriesOptions,
  getCoursesByCategoryOptions,
  getRootCategoriesOptions,
  getSubCategoriesOptions,
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

/** The whole category list is small, so it is read in a few large pages. */
const CATEGORY_LIST_PAGE_SIZE = 100;

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

/** Folds the later category pages into one list; module-level so its result is memoised. */
function combineCategoryPages(results: UseQueryResult<unknown>[]) {
  return {
    items: results.flatMap(result => extractPage<Category>(result.data).items),
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error ?? null,
    refetch: () => {
      for (const result of results) void result.refetch();
    },
  };
}

/**
 * Flat search across the whole tree, used instead of the tree while a term is typed.
 * Categories are not in the search index and the API has no free-text filter for them,
 * so the (small) list is read in full and matched by name here.
 */
export function useCategorySearch(term: string, activeOnly: string) {
  const needle = term.trim().toLowerCase();
  const isSearching = needle.length > 0 || activeOnly !== 'any';

  const first = useQuery({
    ...getAllCategoriesOptions({
      query: { pageable: { page: 0, size: CATEGORY_LIST_PAGE_SIZE } },
    }),
    ...configQuery,
    enabled: isSearching,
  });

  const firstPage = useMemo(() => extractPage<Category>(first.data), [first.data]);
  const pageCount = toNumber(firstPage.metadata.totalPages ?? 1);

  // Page through the rest only when the first page says there is more.
  const rest = useQueries({
    queries: Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => ({
      ...getAllCategoriesOptions({
        query: { pageable: { page: index + 1, size: CATEGORY_LIST_PAGE_SIZE } },
      }),
      ...configQuery,
      enabled: isSearching,
    })),
    combine: combineCategoryPages,
  });

  const categories = useMemo(
    () =>
      [...firstPage.items, ...rest.items]
        .filter(category => {
          if (activeOnly === 'active' && !category.is_active) return false;
          if (activeOnly === 'inactive' && category.is_active) return false;
          return !needle || category.name.toLowerCase().includes(needle);
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [firstPage.items, rest.items, needle, activeOnly]
  );

  return {
    categories,
    totalRows: categories.length,
    isSearching,
    isLoading: (first.isLoading && !first.data) || rest.isLoading,
    error: first.error ?? rest.error,
    refetch: () => {
      void first.refetch();
      rest.refetch();
    },
  };
}

/**
 * How many courses carry this category, read from the category's own course list so the
 * count follows the uuid (the course search no longer filters by category name).
 */
export function useCategoryCourseCount(categoryUuid: string | undefined) {
  const query = useQuery({
    ...getCoursesByCategoryOptions({
      path: { categoryUuid: categoryUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
    ...listQuery,
    enabled: Boolean(categoryUuid),
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
