import { z } from 'zod';

export const passMarkSchema = z
  .union([
    z.literal(''),
    z.coerce
      .number()
      .finite()
      .min(0, 'Pass mark must be at least 0%')
      .max(100, 'Pass mark cannot exceed 100%'),
  ])
  .optional();

export function toPassMark(value: z.infer<typeof passMarkSchema>): number | null {
  return value === '' || value === undefined ? null : value;
}
