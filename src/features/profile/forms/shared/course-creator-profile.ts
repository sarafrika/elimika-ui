import { z } from 'zod';
import { zCourseCreator } from '@/services/client/zod.gen';

type UserNameParts = {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
};

export const courseCreatorProfileSchema = zCourseCreator
  .omit({
    uuid: true,
    admin_verified: true,
    created_date: true,
    created_by: true,
    updated_date: true,
    updated_by: true,
  })
  .extend({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    bio: z.string().max(2000).optional(),
    professional_headline: z.string().max(150).optional(),
    website: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
  });

export type CourseCreatorProfileFormData = z.infer<typeof courseCreatorProfileSchema>;

export function buildCourseCreatorFullName(user: UserNameParts) {
  return `${user.first_name ?? ''}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name ?? ''}`.trim();
}

export function normalizeCourseCreatorProfileData(data: CourseCreatorProfileFormData) {
  return {
    ...data,
    website: data.website === '' ? undefined : data.website,
    bio: data.bio === '' ? undefined : data.bio,
    professional_headline:
      data.professional_headline === '' ? undefined : data.professional_headline,
  };
}
