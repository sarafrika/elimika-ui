import { z } from 'zod';
import { localDate } from '@/lib/date';
import type { RegistrationRequest } from '@/services/client';

export const ONBOARDING_DRAFT_KEY = 'elimika-user-onboarding-v1';
export const ONBOARDING_VERIFICATION_PATH = '/user-onboarding/verification';

export const personalDetailsSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  phone_number: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid international phone number'),
  dob: z.string().refine(value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      date <= new Date()
    );
  }, 'Enter a valid date of birth in the past'),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'], {
    errorMap: () => ({ message: 'Select your gender' }),
  }),
  terms_accepted: z.boolean().refine(value => value, 'Accept the terms to continue'),
});

const draftSchema = z.object({
  step: z.number().int().min(0).max(5),
  personal: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone_number: z.string(),
    dob: z.string(),
    gender: z.enum(['', 'MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']),
    terms_accepted: z.boolean(),
  }),
  product: z.enum(['', 'elimika']),
  domain: z.enum(['', 'course_creator']),
  registeredEmail: z.string(),
  ownerId: z.string(),
  categories: z.array(z.object({ uuid: z.string(), name: z.string() })),
});

export type OnboardingDraft = z.infer<typeof draftSchema>;
export type PersonalDetails = z.infer<typeof personalDetailsSchema>;

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    step: 0,
    personal: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      dob: '',
      gender: '',
      terms_accepted: false,
    },
    product: '',
    domain: '',
    registeredEmail: '',
    ownerId: '',
    categories: [],
  };
}

export function readOnboardingDraft(value: string | null): OnboardingDraft {
  try {
    const result = draftSchema.safeParse(JSON.parse(value ?? 'null'));
    return result.success ? result.data : emptyOnboardingDraft();
  } catch {
    return emptyOnboardingDraft();
  }
}

export function buildRegistrationRequest(
  personal: PersonalDetails,
  captchaToken: string
): RegistrationRequest {
  return {
    ...personalDetailsSchema.parse(personal),
    dob: localDate(personal.dob),
    domain: 'course_creator',
    ...(captchaToken.trim() ? { captcha_token: captchaToken.trim() } : {}),
  };
}

// HTTP success alone is insufficient: the API also returns failure envelopes.
export function requireApiSuccess<
  T extends { success?: boolean; error?: unknown; message?: string },
>(response: T): T {
  if (response.error || response.success === false) {
    throw new Error(response.message || 'The request could not be completed. Please try again.');
  }
  return response;
}

export function requireApiData<T>(response: {
  success?: boolean;
  error?: unknown;
  message?: string;
  data?: T;
}): T {
  requireApiSuccess(response);
  if (!response.data)
    throw new Error(response.message || 'No onboarding information was returned.');
  return response.data;
}
