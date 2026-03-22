import { z } from 'zod';
import { zInstructor } from '@/services/client/zod.gen';

export const instructorProfileSchema = zInstructor
  .omit({
    uuid: true,
    full_name: true,
    admin_verified: true,
    created_date: true,
    created_by: true,
    updated_date: true,
    updated_by: true,
    formatted_location: true,
    is_profile_complete: true,
    has_location_coordinates: true,
  })
  .extend({
    website: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
    bio: z.string().max(2000).optional(),
    professional_headline: z.string().max(150).optional(),
  });

export type InstructorProfileFormData = z.infer<typeof instructorProfileSchema>;

export function normalizeInstructorProfileData(data: InstructorProfileFormData) {
  return {
    ...data,
    website: data.website === '' ? undefined : data.website,
    bio: data.bio === '' ? undefined : data.bio,
    professional_headline:
      data.professional_headline === '' ? undefined : data.professional_headline,
  };
}
