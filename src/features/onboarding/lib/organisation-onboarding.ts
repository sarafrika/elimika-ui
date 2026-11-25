export const ORGANISATION_CATEGORIES = [
  'School / Training institution',
  'College / University',
  'Company / Employer',
  'Foundation / NGO',
  'Government agency',
] as const;

export const ORGANISATION_CAPABILITIES = [
  {
    id: 'train',
    code: 'TR',
    title: 'Offer training',
    description: 'Courses, schedules and students',
  },
  {
    id: 'publish',
    code: 'CR',
    title: 'Publish courses',
    description: 'Create and license content',
  },
  {
    id: 'fund',
    code: 'FU',
    title: 'Sponsor learning',
    description: 'Fund students and programmes',
  },
  {
    id: 'hire',
    code: 'HR',
    title: 'Hire & recruit',
    description: 'Recruit instructors and talent',
  },
] as const;

const SUMMARY_MARKER = '\n\nOrganisation onboarding\n';

/** Preserve review details through the existing organisation description API. */
export function organisationReviewDescription(data: {
  description?: string;
  category: string;
  capabilities: string[];
  is_representative: boolean;
}) {
  const capabilities = ORGANISATION_CAPABILITIES.filter(item => data.capabilities.includes(item.id))
    .map(item => item.title)
    .join(', ');
  return `${data.description ?? ''}${SUMMARY_MARKER}Category: ${data.category}\nCapabilities: ${capabilities}\nAuthorised representative: ${data.is_representative ? 'Confirmed' : 'Not confirmed'}`;
}

export function restoreOrganisationReviewDetails(values: Record<string, unknown>) {
  if (typeof values.description !== 'string') return values;
  const index = values.description.lastIndexOf(SUMMARY_MARKER);
  if (index < 0) return values;
  const lines = values.description.slice(index + SUMMARY_MARKER.length).split('\n');
  const [categoryLine, capabilitiesLine, representativeLine] = lines;
  if (
    lines.length !== 3 ||
    !categoryLine?.startsWith('Category: ') ||
    !capabilitiesLine?.startsWith('Capabilities: ') ||
    !representativeLine?.startsWith('Authorised representative: ')
  )
    return values;
  const titles = capabilitiesLine.slice('Capabilities: '.length).split(', ');
  return {
    ...values,
    description: values.description.slice(0, index),
    category: categoryLine.slice('Category: '.length),
    capabilities: ORGANISATION_CAPABILITIES.filter(item => titles.includes(item.title)).map(
      item => item.id
    ),
    is_representative: representativeLine === 'Authorised representative: Confirmed',
  };
}
