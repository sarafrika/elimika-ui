import { z } from 'zod';
import { zOrganisation } from '@/services/client/zod.gen';

export const organisationProfileSchema = zOrganisation.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
});

export type OrganisationProfileFormData = z.infer<typeof organisationProfileSchema>;

export function normalizeCoordinateValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
