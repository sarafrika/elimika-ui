import { UserDetailView } from '../_components/UserDetailView';

/** Sections that exist for every user, so they are safe to deep-link into. */
const DEEP_LINKABLE_TABS = new Set(['overview', 'pending', 'commerce', 'audit']);

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { uuid } = await params;
  const { tab } = await searchParams;
  const requestedTab = Array.isArray(tab) ? tab[0] : tab;

  return (
    <UserDetailView
      uuid={uuid}
      initialTab={
        requestedTab && DEEP_LINKABLE_TABS.has(requestedTab) ? requestedTab : 'overview'
      }
    />
  );
}
