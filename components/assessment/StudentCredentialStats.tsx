'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { StatCard } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import { getStudentCertificatesOptions } from '@/services/client/@tanstack/react-query.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';

function CredentialStatsLoading() {
  return (
    <div
      className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'
      role='status'
      aria-label='Loading credential summary'
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className='h-28 w-full' />
      ))}
    </div>
  );
}

function StudentCredentialStatsContent({ studentUuid }: { studentUuid: string }) {
  const certificates = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid } }),
    enabled: !!studentUuid,
    select: requireApiData,
    staleTime: STALE_TIMES.entity,
  });
  const stats = useMemo(() => {
    // Match the student wallet: only valid platform certificates are credentials.
    const rows = (certificates.data ?? [])
      .filter(certificate => certificate.is_valid !== false)
      .map(() => ({ status: 'Verified', org: 'Platform credential' }));
    const verified = rows.filter(item => item.status === 'Verified').length;
    const pending = rows.filter(item => item.status === 'Pending').length;
    const expired = rows.filter(item => item.status === 'Expired').length;
    const share = (count: number) =>
      `${rows.length ? Math.round((count / rows.length) * 100) : 0}% of total`;
    return [
      {
        icon: ShieldCheck,
        label: 'Total Credentials',
        value: rows.length,
        tint: 'bg-primary/10 text-primary',
      },
      {
        icon: CheckCircle2,
        label: 'Verified',
        value: verified,
        sub: share(verified),
        tint: 'bg-success/10 text-success',
      },
      {
        icon: Clock,
        label: 'Pending',
        value: pending,
        sub: share(pending),
        tint: 'bg-warning/10 text-warning',
      },
      {
        icon: XCircle,
        label: 'Expired',
        value: expired,
        sub: share(expired),
        tint: 'bg-destructive/10 text-destructive',
      },
      {
        icon: Award,
        label: 'Issuing Orgs',
        value: new Set(rows.map(item => item.org)).size,
        tint: 'bg-secondary text-secondary-foreground',
      },
    ];
  }, [certificates.data]);

  if (certificates.isPending) return <CredentialStatsLoading />;
  if (certificates.isError)
    return (
      <EmptyState
        title='Unable to load credential summary'
        description='Try again to see your credential totals.'
        action={
          <Button type='button' variant='outline' onClick={() => void certificates.refetch()}>
            Try again
          </Button>
        }
      />
    );
  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-5' aria-label='Credential summary'>
      {stats.map(stat => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}

export function StudentCredentialStats() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;
  if (!studentUuid)
    return profile?.isLoading !== false ? (
      <CredentialStatsLoading />
    ) : (
      <EmptyState
        title='Credential summary unavailable'
        description='Complete your student profile to see your credentials.'
      />
    );
  return <StudentCredentialStatsContent key={studentUuid} studentUuid={studentUuid} />;
}
