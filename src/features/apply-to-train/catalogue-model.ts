import type { ApplyCatalogueResponse, SearchApplyToTrainCatalogueData } from '@/services/client';
import { type ApplyItem, toApplyItem } from './types';

export type CatalogueShow = 'all' | 'courses' | 'programmes';
export type CatalogueFit = 'all' | 'open' | 'skills' | 'applied';
export type CatalogueFilters = {
  q: string;
  show: CatalogueShow;
  fit: CatalogueFit;
  category: string | null;
  page: number;
};
export const CATALOGUE_PAGE_SIZE = 24;

/** The API has no all-status fit: page the two disjoint buckets together. */
export function catalogueRequests(filters: CatalogueFilters, q: string) {
  const fits: Exclude<CatalogueFit, 'all'>[] = filters.fit === 'all'
    ? ['open', 'applied']
    : [filters.fit];
  return fits.map((fit): NonNullable<SearchApplyToTrainCatalogueData['query']> => ({
    ...(q ? { q } : {}),
    show: filters.show,
    fit,
    sort: q ? 'relevance' : 'newest',
    ...(filters.category ? { category_uuid: [filters.category] } : {}),
    page: String(filters.page),
    size: String(CATALOGUE_PAGE_SIZE / fits.length),
  }));
}

const count = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function mergeCataloguePages(pages: ApplyCatalogueResponse[]) {
  const items = new Map<string, ApplyItem>();
  const categories = new Map<string, { uuid: string; name: string; count: number }>();
  const show = { all: 0, courses: 0, programmes: 0 };
  for (const page of pages) {
    for (const hit of page.content ?? []) {
      const item = toApplyItem(hit);
      if (!item) continue;
      const key = `${item.kind}:${item.uuid}`;
      // An applied result takes precedence over an overlapping stale open result.
      if (!items.has(key) || item.application) items.set(key, item);
    }
    for (const key of ['all', 'courses', 'programmes'] as const) {
      show[key] += count(page.facets?.show?.[key]);
    }
    for (const row of page.facets?.category ?? []) {
      if (!row.uuid) continue;
      const existing = categories.get(row.uuid);
      categories.set(row.uuid, {
        uuid: row.uuid,
        name: row.name ?? 'Category',
        count: (existing?.count ?? 0) + count(row.count),
      });
    }
  }
  const fit = pages[0]?.facets?.fit;
  return {
    items: [...items.values()],
    total: pages.reduce((total, page) => total + count(page.metadata?.totalElements), 0),
    totalPages: Math.max(1, ...pages.map(page => page.metadata?.totalPages ?? 1)),
    facets: {
      show,
      fit: {
        all: count(fit?.open) + count(fit?.applied),
        open: count(fit?.open),
        skills: count(fit?.skills),
        applied: count(fit?.applied),
      },
      categories: [...categories.values()],
    },
  };
}
