export type PageMetadataLike = {
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  total_elements?: number;
} & Record<string, unknown>;

function getObjectValue<T>(value: unknown, key: string): T | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<string, unknown>)[key] as T | undefined;
}

function unwrapPayload(layer: unknown): unknown {
  if (!layer || typeof layer !== 'object') {
    return undefined;
  }

  return getObjectValue(layer, 'data') ?? layer;
}

export function extractEntity<T>(apiResponse: unknown): T | null {
  const payload = unwrapPayload(apiResponse);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const entity = getObjectValue(payload, 'data') ?? payload;
  if (!entity || typeof entity !== 'object') {
    return null;
  }

  return entity as T;
}

export function extractList<T>(apiResponse: unknown): T[] {
  const payload = unwrapPayload(apiResponse);

  return Array.isArray(payload) ? (payload as T[]) : [];
}

export function extractPage<T>(apiResponse: unknown): { items: T[]; metadata: PageMetadataLike } {
  const firstLayer = unwrapPayload(apiResponse);
  const dataLayer = unwrapPayload(firstLayer);

  if (Array.isArray(dataLayer)) {
    return { items: dataLayer as T[], metadata: {} };
  }

  const content = getObjectValue<unknown[]>(dataLayer, 'content') ?? [];
  const metadata = (getObjectValue<PageMetadataLike>(dataLayer, 'metadata') ?? {}) as PageMetadataLike;

  return {
    items: Array.isArray(content) ? (content as T[]) : [],
    metadata,
  };
}

export function getTotalFromMetadata(metadata?: PageMetadataLike): number {
  if (!metadata) return 0;

  const total = metadata.totalElements ?? metadata.total_elements ?? 0;

  return typeof total === 'number' ? total : 0;
}
