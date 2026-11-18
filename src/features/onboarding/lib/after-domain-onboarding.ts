import { toast } from 'sonner';
import type { UserDomain } from '@/lib/types';
import { getCurrentAccountStatus } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';

/**
 * Where to go once a domain profile is created. Instructor, course creator and
 * organisation start PENDING, so their dashboard would bounce straight back to
 * onboarding; send them to the onboarding page, which shows the review status.
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

  if (approved) {
    if (announce) toast.success(`${label} account created successfully!`);
    navigate(buildDashboardSwitchPath(domain));
    return;
  }

  if (announce)
    toast.success(
      `${label} application submitted. An Elimika admin will review it before your dashboard opens.`
    );
  navigate('/onboarding');
}
