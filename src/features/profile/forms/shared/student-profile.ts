import { z } from 'zod';
import { zStudent } from '@/services/client/zod.gen';

export const studentProfileSchema = zStudent
  .omit({
    uuid: true,
    created_date: true,
    created_by: true,
    updated_date: true,
    updated_by: true,
    secondaryGuardianContact: true,
    primaryGuardianContact: true,
    allGuardianContacts: true,
  })
  .extend({
    first_guardian_mobile: z.string().max(20).optional(),
    second_guardian_mobile: z.string().max(20).optional(),
  });

export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;
