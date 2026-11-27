import type { Course } from '@/services/client/types.gen';

/** Named course statuses stay stable when generated SchemaEnum numbers change. */
export const CourseStatus = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const satisfies Record<string, Course['status']>;
