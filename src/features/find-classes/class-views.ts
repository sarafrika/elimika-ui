import type { ClassCardFacts } from './class-card-facts';

export type ClassView = 'open' | 'online' | 'in_person' | 'soon' | 'closed';
type ViewFacts = Pick<ClassCardFacts, 'closed' | 'online' | 'closingSoon'>;

export const CLASS_VIEWS: ReadonlyArray<{
  id: ClassView;
  label: string;
  keep: (facts: ViewFacts) => boolean;
}> = [
  { id: 'open', label: 'All open', keep: facts => !facts.closed },
  { id: 'online', label: 'Online', keep: facts => !facts.closed && facts.online },
  { id: 'in_person', label: 'In person', keep: facts => !facts.closed && !facts.online },
  { id: 'soon', label: 'Closing soon', keep: facts => facts.closingSoon },
  { id: 'closed', label: 'Closed', keep: facts => facts.closed },
];

export const isClassView = (value: string | null): value is ClassView =>
  CLASS_VIEWS.some(view => view.id === value);

export function classViewCounts(cards: readonly { facts: ViewFacts }[]): Record<ClassView, number> {
  const counts = { open: 0, online: 0, in_person: 0, soon: 0, closed: 0 };
  for (const card of cards) {
    for (const view of CLASS_VIEWS) {
      if (view.keep(card.facts)) counts[view.id] += 1;
    }
  }
  return counts;
}

/** Filter the complete catalogue first; pagination must never hide matches on other API pages. */
export function classViewPage<T extends { facts: ViewFacts }>(
  cards: readonly T[],
  view: ClassView,
  requestedPage: number,
  pageSize: number
) {
  const keep = CLASS_VIEWS.find(option => option.id === view)?.keep ?? CLASS_VIEWS[0]!.keep;
  const matching = cards.filter(card => keep(card.facts));
  return paginateClassMatches(matching, requestedPage, pageSize);
}

export function paginateClassMatches<T>(
  matching: readonly T[],
  requestedPage: number,
  pageSize: number
) {
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.max(0, Math.min(requestedPage, totalPages - 1));
  return {
    items: matching.slice(page * pageSize, (page + 1) * pageSize),
    total: matching.length,
    totalPages,
    page,
  };
}
