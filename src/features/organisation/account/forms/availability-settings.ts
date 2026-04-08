import * as z from 'zod';

export const academicPeriods = ['Term', 'Semester', 'Trimester', 'Quarters', 'Non Term'] as const;

export const availabilitySettingsSchema = z.object({
  calComLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  academicPeriod: z.enum(academicPeriods).optional(),
  academicDuration: z.number().min(1).optional(),
});

export type AvailabilitySettingsFormValues = z.infer<typeof availabilitySettingsSchema>;
