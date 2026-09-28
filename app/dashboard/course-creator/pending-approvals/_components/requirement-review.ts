export const REVIEW_ITEMS = [
  {
    id: 'skills-wallet',
    title: 'Skills wallet',
    summary: 'Skills, education, experience and supporting documents.',
  },
  {
    id: 'training-method',
    title: 'Training method',
    summary: 'Proposed training formats, delivery methods and venues.',
  },
  {
    id: 'target-age-group',
    title: 'Target age group',
    summary: 'The age groups the applicant proposes to train.',
  },
  {
    id: 'lesson-plan',
    title: 'Lesson plan',
    summary: 'The applicant’s proposed lesson plan and teaching approach.',
  },
  { id: 'rate-card', title: 'Rate card', summary: 'Proposed training rates per learner.' },
] as const;

export type ReviewItemId = (typeof REVIEW_ITEMS)[number]['id'];
export type RequirementStatus = 'under_review' | 'approved' | 'declined' | 'information_requested';
export type RequirementReview = { status: RequirementStatus; comment: string };
export type ReviewDraft = { note: string; requirements: Record<ReviewItemId, RequirementReview> };

export const REVIEW_STATUS: Record<RequirementStatus, { label: string; style: string }> = {
  under_review: { label: 'Under review', style: 'border-border bg-muted text-muted-foreground' },
  approved: { label: 'Approved', style: 'border-success/40 bg-success/10 text-success' },
  declined: {
    label: 'Declined',
    style: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  information_requested: {
    label: 'Information requested · draft',
    style: 'border-info/40 bg-info/10 text-info',
  },
};

export function emptyReviewDraft(): ReviewDraft {
  return {
    note: '',
    requirements: {
      'skills-wallet': { status: 'under_review', comment: '' },
      'training-method': { status: 'under_review', comment: '' },
      'target-age-group': { status: 'under_review', comment: '' },
      'lesson-plan': { status: 'under_review', comment: '' },
      'rate-card': { status: 'under_review', comment: '' },
    },
  };
}

/** Browser drafts are untrusted; only restore known sections and bounded strings. */
export function parseReviewDraft(value: unknown): ReviewDraft {
  const draft = emptyReviewDraft();
  if (!value || typeof value !== 'object') return draft;
  if ('note' in value && typeof value.note === 'string') draft.note = value.note.slice(0, 1000);
  if (!('requirements' in value) || !value.requirements || typeof value.requirements !== 'object')
    return draft;
  for (const { id } of REVIEW_ITEMS) {
    const item: unknown = Reflect.get(value.requirements, id);
    if (!item || typeof item !== 'object') continue;
    if (
      'status' in item &&
      (item.status === 'approved' ||
        item.status === 'declined' ||
        item.status === 'information_requested')
    )
      draft.requirements[id].status = item.status;
    if ('comment' in item && typeof item.comment === 'string')
      draft.requirements[id].comment = item.comment.slice(0, 600);
  }
  return draft;
}

export function reviewSummary(draft: ReviewDraft) {
  const items = REVIEW_ITEMS.map(({ id }) => draft.requirements[id]);
  return {
    reviewed: items.filter(item => item.status !== 'under_review').length,
    allApproved: items.every(item => item.status === 'approved'),
    hasDeclined: items.some(item => item.status === 'declined'),
    hasInfoRequest: items.some(item => item.status === 'information_requested'),
  };
}

/** Persist the item verdicts and comments alongside the server's final decision. */
export function reviewDecisionNotes(draft: ReviewDraft) {
  return [
    draft.note.trim(),
    ...REVIEW_ITEMS.map(({ id, title }) => {
      const item = draft.requirements[id];
      return `${title}: ${REVIEW_STATUS[item.status].label}${item.comment.trim() ? `\n${item.comment.trim()}` : ''}`;
    }),
  ]
    .filter(Boolean)
    .join('\n\n');
}
