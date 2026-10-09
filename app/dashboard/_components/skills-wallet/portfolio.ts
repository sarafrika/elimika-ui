import type { ItemTypeEnum } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

export const PORTFOLIO_ITEM_TYPES: Record<ItemTypeEnum, string> = {
  PROJECT: 'Project',
  PERFORMANCE: 'Performance',
  WORK_SAMPLE: 'Work sample',
  MEDIA: 'Media',
  OTHER: 'Other',
};

export function portfolioDateInput(value?: Date | string) {
  if (!value) return '';
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : '';
  }
  return value.slice(0, 10);
}

export function portfolioLink(value?: string) {
  const link = value?.trim();
  if (!link || link.includes('\\')) return null;
  // Uploaded documents can return a relative URL. Keep those behind the media proxy.
  if (link.startsWith('/') && !link.startsWith('//')) return toAuthenticatedMediaUrl(link);
  try {
    const parsed = new URL(link);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? toAuthenticatedMediaUrl(parsed.toString())
      : null;
  } catch {
    return null;
  }
}
