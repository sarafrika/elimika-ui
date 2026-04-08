import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';

type WorkspaceAliasPageProps = {
  params: Promise<{ domain: string; slug: string[] }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspaceAliasPage({ params }: WorkspaceAliasPageProps) {
  const { domain, slug } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);
  const nextPath = slug.length ? `/dashboard/${slug.join('/')}` : '/dashboard/overview';
  const target = await resolveDashboardEntryTarget(normalizedDomain, nextPath);

  redirect(target.redirectTo);
}
