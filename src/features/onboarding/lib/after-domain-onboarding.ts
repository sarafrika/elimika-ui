import { toast } from 'sonner';
import type { UserDomain } from '@/lib/types';
import { getCurrentAccountStatus } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { awaitingApprovalPath, sameReviewDomain } from './application-review';

/**
 * Keep applicants outside the dashboard until the API confirms this profile is approved.
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
    if (!response.error && !response.data?.error && response.data?.success !== false) {
      approved =
        response.data?.data?.approved_domains?.some(item => sameReviewDomain(item, domain)) ??
        false;
    }
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
  navigate(approved ? buildDashboardSwitchPath(domain) : awaitingApprovalPath(domain));
}
