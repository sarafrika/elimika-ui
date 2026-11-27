import { z } from 'zod';
import { asRecord, getErrorMessage } from '@/lib/error-utils';

export type InterestDomain = 'student' | 'instructor' | 'course_creator' | 'organisation_user';

export function interestDomain(value: string): InterestDomain | null {
  const domain = value.toLowerCase().replaceAll('-', '_');
  if (domain === 'organisation') return 'organisation_user';
  return domain === 'student' ||
    domain === 'instructor' ||
    domain === 'course_creator' ||
    domain === 'organisation_user'
    ? domain
    : null;
}

const interestsSchema = z.object({
  categories: z.array(z.object({ category_uuid: z.string().min(1), name: z.string().min(1) })),
});
export type SelectedInterest = z.infer<typeof interestsSchema>['categories'][number];

/** Accept the documented payload as well as the generated client's API envelope. */
export function readInterests(response: unknown): SelectedInterest[] {
  const record = asRecord(response);
  if (record?.error || record?.success === false) {
    throw new Error(
      getErrorMessage(
        { error: record.error, errors: record.errors, message: record.message },
        'Unable to load your interests. Please try again.'
      )
    );
  }
  const parsed = interestsSchema.safeParse(record?.data ?? response);
  if (!parsed.success) throw new Error('Unable to read your saved interests. Please try again.');
  return Array.from(
    new Map(parsed.data.categories.map(category => [category.category_uuid, category])).values()
  );
}

export function toggleInterest(
  selected: SelectedInterest[],
  category: SelectedInterest
): SelectedInterest[] {
  return selected.some(item => item.category_uuid === category.category_uuid)
    ? selected.filter(item => item.category_uuid !== category.category_uuid)
    : [...selected, category];
}
