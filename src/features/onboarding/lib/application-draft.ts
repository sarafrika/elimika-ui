import { z } from 'zod';
import { asRecord } from '@/lib/error-utils';

export type RegistrationRole = 'student' | 'instructor' | 'course-creator' | 'organisation';

const applicationDraftSchema = z.object({
  values: z.record(z.unknown()),
  profileUuid: z.string().uuid().optional(),
  submittedAt: z.string().datetime().optional(),
});
export type ApplicationDraft = z.infer<typeof applicationDraftSchema>;

export function acceptedProfileUuid(response: {
  data?: unknown;
  error?: unknown;
}): string | undefined {
  if (response.error) throw response.error;
  const envelope = asRecord(response.data);
  if (!envelope) throw new Error('The profile could not be saved. Please try again.');
  if (envelope.error || envelope.success === false)
    throw new Error(
      typeof envelope.message === 'string' ? envelope.message : 'The profile could not be saved.'
    );
  const profile = asRecord(envelope.data) ?? envelope;
  return typeof profile.uuid === 'string' ? profile.uuid : undefined;
}

export function applicationDraftKey(userUuid: string, role: string) {
  return `elimika:onboarding:${userUuid}:${role}:application`;
}

export function readApplicationDraft(userUuid: string, role: string): ApplicationDraft | null {
  try {
    const raw = localStorage.getItem(applicationDraftKey(userUuid, role));
    if (!raw) return null;
    const parsed = applicationDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function registrationPath(domain: string): string {
  if (domain === 'course_creator') return '/onboarding/course-creator';
  if (domain === 'organisation' || domain === 'organisation_user')
    return '/onboarding/organisation';
  if (domain === 'instructor') return '/onboarding/instructor';
  if (domain === 'student') return '/onboarding/student';
  return '/onboarding';
}
