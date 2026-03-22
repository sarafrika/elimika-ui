import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  buildDashboardSwitchPath,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceEntryPageProps = {
  params: Promise<{ domain: string }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspaceEntryPage({ params }: WorkspaceEntryPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  redirect(normalizedDomain ? buildDashboardSwitchPath(normalizedDomain) : '/dashboard/overview');
}
