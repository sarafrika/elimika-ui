import { z } from 'zod';

export function ageOnDate(dob: string, today = new Date()): number {
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = dob.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return Number.NaN;
  return (
    today.getFullYear() -
    year -
    (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)
      ? 1
      : 0)
  );
}

const name = z.string().trim().min(1, 'Enter a name.');
export const childSchema = z.object({
  first_name: name,
  middle_name: z.string().trim().optional(),
  last_name: name,
  dob: z.string().refine(value => {
    const age = ageOnDate(value);
    return age >= 5 && age < 18;
  }, 'Your child must be at least 5 and under 18 years old.'),
  relationship_type: z.enum(['PARENT', 'GUARDIAN']),
});

export const guardianRegistrationSchema = z.object({
  first_name: name,
  last_name: name,
  email: z.string().trim().email('Enter the email address that received the invitation.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(128, 'Use no more than 128 characters.'),
  dob: z
    .string()
    .refine(
      value => ageOnDate(value) >= 18,
      'You must be at least 18 years old to register as a guardian.'
    ),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']).optional(),
  terms_accepted: z.boolean().refine(value => value, 'Accept the terms to continue.'),
});
