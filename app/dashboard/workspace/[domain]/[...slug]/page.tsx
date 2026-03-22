import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  buildDashboardSwitchPath,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';

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

  if (!normalizedDomain) {
    redirect('/dashboard/overview');
  }

  const nextPath = slug.length ? `/dashboard/${slug.join('/')}` : '/dashboard/overview';
  redirect(buildDashboardSwitchPath(normalizedDomain, nextPath));
}
