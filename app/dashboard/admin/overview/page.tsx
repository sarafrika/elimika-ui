import { AdminOverviewPage } from '@/src/features/admin/pages/overview-page';

/**
 * Admin Home. The shell renders on the server; every count and the activity feed are
 * fetched in the browser through /api/proxy, which is the only place the session token
 * is attached.
 */
export default function AdminOverviewRoute() {
  return <AdminOverviewPage />;
}
