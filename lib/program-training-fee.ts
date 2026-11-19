import type { TrainingProgram } from '@/services/client';

/** The programme's configured training fee is stored in its price field. */
export function programMinimumTrainingFee(
  program: Pick<TrainingProgram, 'price'> | null | undefined
): number | null {
  return program?.price ?? null;
}
