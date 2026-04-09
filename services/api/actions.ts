import { fetchClient } from './fetch-client';
import type { paths } from './schema';

/**
 * Generic Search function defination
 */
type SearchEndpoints = {
  [K in keyof paths]: paths[K] extends { get: unknown } ? K : never;
}[keyof paths];

type SearchParams = Record<string, unknown>;
type SearchInit = {
  params?: {
    pageable: {
      page: number;
      size: number;
    };
    query: SearchParams;
  };
};

export async function search<P extends SearchEndpoints>(endpoint: P, searchParams?: SearchParams) {
  const init: SearchInit = {};
  if (searchParams) {
    init.params = {
      pageable: {
        page: 0,
        size: 10,
      },
      query: { ...searchParams },
    };
  }
  const resp = await fetchClient.GET(endpoint, init);

  if (resp.error) {
    throw new Error(typeof resp.error === 'string' ? resp.error : JSON.stringify(resp.error));
  }

  if (resp.data.data?.content?.length === 0) {
    throw new Error('Not found');
  }

  return resp.data.data?.content!;
}

/** End of generic search function */
