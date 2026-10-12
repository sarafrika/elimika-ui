import { isValidPhoneNumber } from 'react-phone-number-input';
import { z } from 'zod';
import { localDate } from '@/lib/date';
import type { DomainEnum, RegistrationRequest } from '@/services/client';

export const ONBOARDING_DRAFT_KEY = 'elimika-user-onboarding-v4';
export const ONBOARDING_PATH = '/user-onboarding';
export const ONBOARDING_VERIFICATION_PATH = '/user-onboarding/verification';

// Parent is listed for guidance only: guardian accounts start from a learner's invitation.
export const ONBOARDING_ACCOUNT_TYPES = [
  'course_creator',
  'instructor',
  'student',
  'organisation_user',
  'parent',
] as const;
export type OnboardingAccountType = (typeof ONBOARDING_ACCOUNT_TYPES)[number];
export type RegisterableDomain = Exclude<OnboardingAccountType, 'parent'>;

export function isOnboardingAccountType(value: unknown): value is OnboardingAccountType {
  return ONBOARDING_ACCOUNT_TYPES.includes(value as OnboardingAccountType);
}

export function isRegisterableDomain(value: unknown): value is RegisterableDomain {
  return isOnboardingAccountType(value) && value !== 'parent';
}

/** Entry link for sign-up buttons; `type` preselects the account type card. */
export function onboardingPath(type?: OnboardingAccountType) {
  return type ? `${ONBOARDING_PATH}?type=${type}` : ONBOARDING_PATH;
}

export function verificationPath(domain?: RegisterableDomain) {
  return domain ? `${ONBOARDING_VERIFICATION_PATH}?domain=${domain}` : ONBOARDING_VERIFICATION_PATH;
}

export const personalDetailsSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  phone_number: z
    .string()
    .refine(
      value => isValidPhoneNumber(value),
      'Enter a valid phone number for the selected country'
    ),
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

// Role details are collected before sign-in and saved to the account at submission.
const roleDraftSchema = z.object({
  headline: z.string(),
  bio: z.string(),
  location_name: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  categories: z.array(z.object({ uuid: z.string(), name: z.string() })),
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    })
  ),
  guardians: z.array(
    z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      relationship_type: z.enum(['PARENT', 'GUARDIAN', 'SPONSOR']),
    })
  ),
  organisation: z.object({
    name: z.string(),
    country: z.string(),
    location: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  /** Server values merged once after sign-in, so a resumed draft does not overwrite them. */
  seeded: z.boolean(),
});

export type RoleDraft = z.infer<typeof roleDraftSchema>;
export type GuardianDraft = RoleDraft['guardians'][number];
export type SkillDraft = RoleDraft['skills'][number];

export function emptyRoleDraft(): RoleDraft {
  return {
    headline: '',
    bio: '',
    location_name: '',
    categories: [],
    skills: [],
    guardians: [],
    organisation: { name: '', country: '', location: '' },
    seeded: false,
  };
}

const draftSchema = z.object({
  step: z.number().int().min(0).max(4),
  personal: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone_number: z.string(),
    dob: z.string(),
    gender: z.enum(['', 'MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']),
    terms_accepted: z.boolean(),
  }),
  domain: z.enum(['', ...ONBOARDING_ACCOUNT_TYPES]),
  registeredEmail: z.string(),
  ownerId: z.string(),
  role: roleDraftSchema,
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
    domain: '',
    registeredEmail: '',
    ownerId: '',
    role: emptyRoleDraft(),
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
  domain: RegisterableDomain,
  captchaToken: string
): RegistrationRequest {
  return {
    ...personalDetailsSchema.parse(personal),
    dob: localDate(personal.dob),
    domain: domain satisfies DomainEnum,
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
