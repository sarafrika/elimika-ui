import type { Course, Lesson } from '@/services/client';
import type { PublicCatalogueCourse, PublicCourseDetail } from '@/src/features/catalogue/types';

export const sanitizeRichText = (value?: string | null) => {
  if (!value) return '';

  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s(on\w+)\s*=\s*(['"]).*?\2/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"]?)javascript:[^'"]*\2/gi, '');
};

export const buildListFromText = (value?: string | null) => {
  if (!value) return [];

  const plain = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n/g, '\n')
    .trim();

  const parts = plain
    .split(/\n|•|-|\u2022/)
    .map(part => part.replace(/^[\s\-•]+/, '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [plain];
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
