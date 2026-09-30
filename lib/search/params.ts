import { toSearchTerm } from './query';

/**
 * `searchParams` with `q` added when there is a term worth sending (2+ characters after
 * trimming), and left untouched otherwise. Pass the result to the generated `searchXxxOptions`
 * helpers; the query serializer flattens `searchParams`, so `q` reaches the API as `?q=`.
 */
export function withQ<T extends Record<string, unknown>>(
  searchParams: T,
  q: string | null | undefined
): T & { q?: string } {
  const term = toSearchTerm(q);
  if (!term) return searchParams;
  return { ...searchParams, q: term };
}

/**
 * The sort to send alongside `q`. With a term, results come back in relevance order and a
 * sort the index cannot serve (such as `lastModifiedDate`) answers 400, so the sort is
 * dropped. Without a term the list keeps its usual order.
 */
export function sortUnlessQuery<S>(q: string | null | undefined, sort: S): S | undefined {
  return toSearchTerm(q) ? undefined : sort;
}
