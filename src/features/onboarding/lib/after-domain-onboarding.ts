import { toast } from 'sonner';
import type { UserDomain } from '@/lib/types';
import { getCurrentAccountStatus } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';

/**
 * Where to go once a domain profile is created: that role's dashboard. Instructor, course
 * creator and organisation start PENDING, so the dashboard shows the review status until approved.
 */
export async function routeAfterDomainOnboarding(
  domain: UserDomain,
  label: string,
  navigate: (path: string) => void,
  announce = true
) {
  let approved = false;
  try {
    const response = await getCurrentAccountStatus();
    approved = response.data?.data?.approved_domains?.includes(domain) ?? false;
  } catch {
    approved = false;
  }

  if (announce) {
    toast.success(
      approved
        ? `${label} account created successfully!`
        : `${label} application submitted. An Elimika admin will review it before your dashboard opens.`
    );
  }
  navigate(buildDashboardSwitchPath(domain));
}
