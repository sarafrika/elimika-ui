import type { Course } from '@/services/client/types.gen';
import { programFormSchema } from './program-schema';

const feeFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatProgramTrainingFee(value: number) {
  return feeFormatter.format(value);
}

export function minimumProgramTrainingFee(
  courseIds: string[],
  courseMap: Record<string, Pick<Course, 'minimum_training_fee'>>
): number | undefined {
  let totalCents = 0;
  for (const uuid of new Set(courseIds)) {
    const course = courseMap[uuid];
    if (!course) return undefined;
    const fee = course.minimum_training_fee ?? 0;
    if (!Number.isFinite(fee) || fee < 0) return undefined;
    totalCents += Math.round(fee * 100);
  }
  return totalCents / 100;
}

export function programPricingSchema(minimumFee: number | undefined) {
  return programFormSchema.superRefine((values, ctx) => {
    const fee = values.draft.hourlyFee.trim();
    const message =
      minimumFee === undefined
        ? 'Unable to verify the minimum training fee. Reload the selected course fees and try again.'
        : fee === ''
          ? 'Enter a minimum training fee for the program'
          : !Number.isFinite(Number(fee)) || Number(fee) < minimumFee
            ? `Enter a training fee of at least ${formatProgramTrainingFee(minimumFee)}`
            : undefined;
    if (message) ctx.addIssue({ code: 'custom', path: ['draft', 'hourlyFee'], message });
  });
}
