import { cookies } from 'next/headers';
import {
  ACTIVE_DASHBOARD_COOKIE,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

export async function getServerActiveDashboardDomain() {
  const cookieStore = await cookies();
  return normalizeStoredUserDomain(cookieStore.get(ACTIVE_DASHBOARD_COOKIE)?.value);
}
