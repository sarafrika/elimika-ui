import 'server-only';

import type { UserDomain } from '@/lib/types';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';
import { redirect } from 'next/navigation';

export type LegacyDashboardSection = 'profile' | 'account' | 'settings' | 'credentials';

const PROFILE_DOMAINS: UserDomain[] = ['student', 'instructor', 'course_creator'];
const SETTINGS_DOMAINS: UserDomain[] = [
  'student',
  'instructor',
  'course_creator',
  'organisation',
  'organisation_user',
  'admin',
];
const CREDENTIALS_DOMAINS: UserDomain[] = ['student', 'instructor', 'course_creator'];

function hasDomain(domains: UserDomain[], domain: UserDomain) {
  return domains.includes(domain);
}

function isOrganisationDomain(domain: UserDomain) {
  return domain === 'organisation' || domain === 'organisation_user';
}

function pathSuffix(pathSegments?: string[]) {
  if (!pathSegments?.length) {
    return '';
  }

  return `/${pathSegments.map(segment => encodeURIComponent(segment)).join('/')}`;
}

function legacyTargetPath(
  section: LegacyDashboardSection,
  domain: UserDomain,
  pathSegments?: string[]
) {
  const suffix = pathSuffix(pathSegments);

  if (section === 'profile') {
    if (isOrganisationDomain(domain)) {
      return '/dashboard/account/training-center';
    }

    if (hasDomain(PROFILE_DOMAINS, domain)) {
      return `/dashboard/profile${suffix}`;
    }

    return hasDomain(SETTINGS_DOMAINS, domain) ? '/dashboard/settings' : '/dashboard/overview';
  }

  if (section === 'account') {
    return isOrganisationDomain(domain) ? `/dashboard/account${suffix}` : '/dashboard/overview';
  }

  if (section === 'settings') {
    return hasDomain(SETTINGS_DOMAINS, domain)
      ? `/dashboard/settings${suffix}`
      : '/dashboard/overview';
  }

  if (section === 'credentials') {
    return hasDomain(CREDENTIALS_DOMAINS, domain)
      ? `/dashboard/credentials${suffix}`
      : '/dashboard/overview';
  }

  return '/dashboard/overview';
}

export async function redirectLegacyDashboardPath(
  section: LegacyDashboardSection,
  pathSegments?: string[]
): Promise<never> {
  const preferredDomain = await getServerActiveDashboardDomain();
  const target = await resolveDashboardEntryTarget(preferredDomain);

  if (!target.activeDomain) {
    redirect(target.redirectTo);
  }

  redirect(
    buildDashboardSwitchPath(
      target.activeDomain,
      legacyTargetPath(section, target.activeDomain, pathSegments)
    )
  );
}
