import * as z from 'zod';

export const adminProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  phone_number: z.string().optional(),
  username: z.string().min(1, 'Username is required'),
  date_of_birth: z.date().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

export type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;

export const adminGenderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const;
