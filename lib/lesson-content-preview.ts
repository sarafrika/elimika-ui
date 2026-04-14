import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

export type PreviewableLessonContent = {
  content_text?: string | null;
  file_url?: string | null;
  value?: string | null;
};

const HTML_TAG_PATTERN = /<[^>]*>/g;
const HTML_URL_PATTERN = /(href|src)=["']([^"']+)["']/i;

function stripHtml(value?: string | null) {
  if (!value) return '';
  return value.replace(HTML_TAG_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(candidate?: string | null) {
  if (!candidate) return '';

  const trimmed = candidate.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return toAuthenticatedMediaUrl(trimmed) || trimmed;
  }

  return '';
}

function extractUrlFromHtml(value?: string | null) {
  if (!value) return '';

  const attributeMatch = value.match(HTML_URL_PATTERN);
  if (attributeMatch?.[2]) {
    return attributeMatch[2];
  }

  return stripHtml(value);
}

export function resolveLessonContentSource(
  content: PreviewableLessonContent | null | undefined,
  contentType?: string | null
) {
  if (!content) return '';

  const type = contentType?.toLowerCase();
  if (type === 'text') {
    return content.content_text?.trim() || '';
  }

  const candidates = [
    content.file_url,
    content.value,
    extractUrlFromHtml(content.content_text),
    stripHtml(content.content_text),
  ];

  return candidates.map(normalizeUrl).find(Boolean) || '';
}
