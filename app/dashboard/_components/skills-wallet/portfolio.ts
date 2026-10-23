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

export function portfolioAttachmentName(url: string) {
  try {
    const parsed = new URL(url, 'https://local.invalid');
    const source = parsed.searchParams.get('url');
    const pathname = source ? new URL(source).pathname : parsed.pathname;
    return decodeURIComponent(pathname.split('/').pop() || 'Current attachment');
  } catch {
    return 'Current attachment';
  }
}

export function portfolioMediaType(url: string, name?: string, mime = '') {
  const extension = (name || portfolioAttachmentName(url)).split('.').pop()?.toLowerCase() ?? '';
  if (mime.startsWith('image/') || /^(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(extension))
    return 'image';
  if (mime.startsWith('video/') || /^(mp4|webm|mov|m4v|ogv)$/.test(extension)) return 'video';
  if (mime.startsWith('audio/') || /^(mp3|wav|m4a|aac|ogg|flac)$/.test(extension)) return 'audio';
  if (mime === 'application/pdf' || extension === 'pdf') return 'pdf';
  return 'other';
}
