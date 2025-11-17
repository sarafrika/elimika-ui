export type PageMetadataLike = {
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
} & Record<string, unknown>;

function unwrapPayload(layer: unknown): any {
  if (!layer || typeof layer !== 'object') {
    return undefined;
  }

  const payload = (layer as any).data ?? layer;
  return payload;
}

export function extractEntity<T>(apiResponse: unknown): T | null {
  const payload = unwrapPayload(apiResponse);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const entity = (payload as any).data ?? payload;
  if (!entity || typeof entity !== 'object') {
    return null;
  }

  return entity as T;
}

export function extractPage<T>(
  apiResponse: unknown
): { items: T[]; metadata: PageMetadataLike } {
  const firstLayer = unwrapPayload(apiResponse);
  const dataLayer = unwrapPayload(firstLayer);

  if (Array.isArray(dataLayer)) {
    return { items: dataLayer as T[], metadata: {} };
  }

  const content = (dataLayer as any)?.content ?? [];
  const metadata = ((dataLayer as any)?.metadata ?? {}) as PageMetadataLike;

  return {
    items: Array.isArray(content) ? (content as T[]) : [],
    metadata,
  };
}

export function getTotalFromMetadata(metadata?: PageMetadataLike): number {
  if (!metadata) return 0;

  const total =
    (metadata.totalElements as number | undefined) ??
    (metadata as any).total_elements ??
    0;

  return typeof total === 'number' ? total : 0;
}
