import { redirect } from 'next/navigation';

/**
 * Branch CRUD now lives on the Settings → Branches tab, which is the single
 * place a branch is created or edited. This route was never in the sidebar but
 * was linked from the overview and is likely bookmarked, so it forwards rather
 * than 404s. The branch *detail* route (`/branches/[uuid]`) is unaffected.
 */
export default function BranchesPage() {
  redirect('/dashboard/organisation/settings?tab=branches');
}
