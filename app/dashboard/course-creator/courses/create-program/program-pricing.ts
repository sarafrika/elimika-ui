import type { Course } from '@/services/client/types.gen';

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

export type ProgramRevenueShares = {
  instructorShare: number;
  creatorShare: number;
  totalMinimumFee: number;
};

/** Fee-weighted revenue split; free courses receive equal weight when every course is free. */
export function programRevenueShares(
  courseIds: string[],
  courseMap: Record<
    string,
    Pick<
      Course,
      'minimum_training_fee' | 'instructor_share_percentage' | 'creator_share_percentage'
    >
  >
): ProgramRevenueShares | undefined {
  const ids = [...new Set(courseIds)];
  const totalMinimumFee = minimumProgramTrainingFee(ids, courseMap);
  if (totalMinimumFee === undefined) return undefined;
  if (!ids.length) return { instructorShare: 0, creatorShare: 0, totalMinimumFee: 0 };
  let instructor = 0;
  for (const id of ids) {
    const course = courseMap[id];
    if (!course) return undefined;
    const share = course.instructor_share_percentage;
    const creator = course.creator_share_percentage;
    if (
      !Number.isFinite(share) ||
      !Number.isFinite(creator) ||
      share < 0 ||
      share > 100 ||
      creator < 0 ||
      creator > 100 ||
      Math.abs(share + creator - 100) > 0.01
    )
      return undefined;
    const weight =
      totalMinimumFee > 0
        ? Math.round((course.minimum_training_fee ?? 0) * 100) / (totalMinimumFee * 100)
        : 1 / ids.length;
    instructor += share * weight;
  }
  const instructorShare = Math.round(instructor * 100) / 100;
  return {
    instructorShare,
    creatorShare: Math.round((100 - instructorShare) * 100) / 100,
    totalMinimumFee,
  };
}
