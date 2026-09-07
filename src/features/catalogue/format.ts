import type { Course, Lesson } from '@/services/client';
import type { PublicCatalogueCourse, PublicCourseDetail } from '@/src/features/catalogue/types';

export const sanitizeRichText = (value?: string | null) => {
  if (!value) return '';

  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s(on\w+)\s*=\s*(['"]).*?\2/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"]?)javascript:[^'"]*\2/gi, '');
};

/**
 * Rich text or plain text -> one line of readable prose, tags and entities gone.
 *
 * Used wherever the markup cannot come along: the hero summary, a lesson's
 * one-line objective.
 */
export const stripRichText = (value?: string | null) => {
  if (!value) return '';

  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
};

/**
 * Split one of the course's free-text blobs - `objectives`, `prerequisites` -
 * into the bullets the overview lists.
 *
 * The field arrives as HTML from the builder's editor, or as newline- or
 * bullet-separated plain text, so both are handled. Lines break on newlines and
 * bullet glyphs only: a hyphen is stripped where it *leads* a line and left
 * alone everywhere else, so "Face-to-face practicals" stays one bullet instead
 * of becoming three.
 */
export const toBulletLines = (value?: string | null) => {
  const text = stripRichText(value);
  if (!text) return [];

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const raw of text.split(/\r?\n|(?:\s|^)[\u2022\u00b7]\s+/)) {
    const line = raw.replace(/^\s*(?:[-*\u2022\u00b7\u2014]|\d+[.)])\s*/, '').trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
  }

  return lines;
};

/**
 * A creator-supplied URL, or nothing.
 *
 * `intro_video_url` is free text the course builder collects, and it ends up in
 * an `href`. Only absolute http(s) URLs and site-relative paths are handed back;
 * anything else - `javascript:`, `data:`, a protocol-relative host - is dropped,
 * so a link this page renders can never execute what a creator typed.
 */
export const toSafeHref = (value?: string | null) => {
  if (!value) return undefined;

  const url = value.trim();
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return /^https?:\/\//i.test(url) ? url : undefined;
};

export const formatCourseDuration = (course?: Course | null) => {
  if (!course) return null;

  if (course.total_duration_display) {
    return course.total_duration_display;
  }

  const hasHours = typeof course.duration_hours === 'number';
  const hasMinutes = typeof course.duration_minutes === 'number';

  if (!hasHours) {
    return null;
  }

  if (hasMinutes && course.duration_minutes > 0) {
    return `${course.duration_hours}h ${course.duration_minutes}m`;
  }

  return `${course.duration_hours}h`;
};

export const formatPricingLabel = (
  item:
    | Pick<PublicCatalogueCourse, 'currencyCode' | 'isFree' | 'priceAmount'>
    | Pick<PublicCourseDetail, 'currencyCode' | 'isFree' | 'priceAmount'>
) => {
  if (item.isFree) {
    return 'Free';
  }

  if (typeof item.priceAmount === 'number') {
    return `${item.currencyCode ?? 'KES'} ${item.priceAmount.toLocaleString()}`;
  }

  return 'Pricing not set';
};

export const getCourseDisplayTitle = (course: Course) => course.name || 'Untitled course';

export const getLessonDescription = (lesson: Lesson) => sanitizeRichText(lesson.description);
