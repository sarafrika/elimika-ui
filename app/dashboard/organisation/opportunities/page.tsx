import { redirect } from 'next/navigation';

import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export default function OrganisationOpportunitiesRedirect() {
  redirect(dashboardUrl('organisation', 'jobs'));
}
