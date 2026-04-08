'use client';

import { toast } from 'sonner';
import { fetchClient } from '../api/fetch-client';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { CreateCategoryData } from '../client/types.gen';

type CategoryQuery = {
  page?: number;
  size?: number;
  name?: string;
};

const getCategories = async (query?: CategoryQuery) => {
  const finalQuery = {
    page: query?.page ?? 0,
    size: query?.size ?? 10,
    ...(query?.name ? { name: query.name.trim() } : {}),
  };

  const res = await fetchClient.GET('/api/v1/config/categories', {
    params: {
      //@ts-expect-error
      query: finalQuery,
    },
  });

  if (res.error) {
    throw new Error(res.error.message || 'Failed to fetch categories');
  }

  return res.data;
};

export const useGetCategories = (query?: CategoryQuery) => {
  // Determine whether to enable fetching (if name is provided and not empty)
  const enabled = Boolean(query?.name?.trim());

  return useQuery({
    queryKey: ['categories', query],
    queryFn: () => getCategories(query),
    enabled,
  });
};

const createCategory = async ({ body }: { body: CreateCategoryData['body'] }) => {
  const res = await fetchClient.POST('/api/v1/config/categories', {
    body,
  });

  if (res.error) {
    throw new Error(res.error.message || 'Failed to fetch categories');
  }

  return res.data;
};

export const useCreateCategory = () => {
  return useMutation({
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error creating category');
    },
    mutationFn: (body: { body: CreateCategoryData['body'] }) => createCategory(body),
  });
};
