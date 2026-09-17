export const JOB_STEPS = [
  {
    title: 'Course and delivery',
    description: 'Pick the approved course and how the class is delivered.',
  },
  {
    title: 'Billing and service',
    description:
      'Choose how learners are billed, then the service. Prices come from your approved rate card.',
  },
  {
    title: 'Where it happens',
    description: 'The branch sets the location; venue and equipment come from that branch.',
  },
  {
    title: 'Schedule',
    description:
      'The sessions instructors apply for. They hold the venue, equipment and the hired instructor for these exact windows.',
  },
  {
    title: 'Price and pay',
    description: 'Per unit of your billing basis. Totals use the schedule you set.',
  },
  {
    title: 'Review and post',
    description: 'Check everything once more. Edit any step without losing the rest.',
  },
] as const;

export const REVIEW_STEP = JOB_STEPS.length - 1;

/** Steps before `index` must all be valid before it opens. */
export const isReachable = (blockers: readonly (string | null)[], index: number) =>
  blockers.slice(0, index).every(blocker => !blocker);
