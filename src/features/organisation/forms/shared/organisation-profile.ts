import { z } from 'zod';
import { zOrganisation } from '@/services/client/zod.gen';
import type { Organisation } from '@/services/client/types.gen';

export const organisationProfileSchema = zOrganisation.omit({
  uuid: true,
  slug: true,
  admin_verified: true,
  created_date: true,
  updated_date: true,
});

export type OrganisationProfileFormData = z.infer<typeof organisationProfileSchema>;

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal(''))
    .transform(value => {
      const trimmed = typeof value === 'string' ? value.trim() : '';
      return trimmed.length > 0 ? trimmed : undefined;
    });

const optionalCoordinate = z.preprocess(value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}, z.number().optional());

export const organisationRegistrationSchema = z.object({
  name: z.string().trim().min(1, 'Organisation name is required').max(50),
  description: optionalTrimmedString(2000),
  active: z.boolean().default(true),
  licence_no: optionalTrimmedString(100),
  location: optionalTrimmedString(200),
  country: optionalTrimmedString(100),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
});

export type OrganisationRegistrationFormData = z.infer<typeof organisationRegistrationSchema>;

export function buildOrganisationRegistrationPayload(
  data: OrganisationRegistrationFormData
): Organisation {
  return {
    name: data.name,
    description: data.description,
    active: true,
    licence_no: data.licence_no,
    location: data.location,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

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
