'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { fetchUserVerification } from '@/services/admin/credential-review';
import type { User } from '@/services/client';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { DomainVerificationSection } from './DomainVerificationSection';
import { UserIdentityForm } from './UserIdentityForm';

function domainList(user: User): string[] {
  const raw = user.user_domain;
  const domains = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return domains.map(String);
}

function initials(user: User): string {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function UserDetailView({ uuid }: { uuid: string }) {
  const admin = useUserProfile();
  const verifier = admin?.email || admin?.full_name || 'admin';

  const userQuery = useQuery(getUserByUuidOptions({ path: { uuid } }));
  const user = userQuery.data?.data as User | undefined;

  const verificationQuery = useQuery({
    queryKey: ['user-verification', uuid],
    queryFn: () => fetchUserVerification(uuid),
  });
  const domains = verificationQuery.data ?? [];

  if (userQuery.isLoading) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <Skeleton className='h-28 w-full rounded-[18px]' />
          <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
            <SectionCardSkeleton rows={6} />
            <SectionCardSkeleton rows={6} />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <ShieldAlert className='size-10 text-muted-foreground' />
          <p className='text-lg font-semibold'>User not found</p>
          <Button variant='outline' asChild>
            <Link href='/dashboard/users'>Back to users</Link>
          </Button>
        </div>
      </main>
    );
  }

  const userDomains = domainList(user);

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div>
          <Button variant='ghost' size='sm' asChild className='-ml-2 mb-2 text-muted-foreground'>
            <Link href='/dashboard/users'>
              <ArrowLeft className='size-4' />
              Back to users
            </Link>
          </Button>

          <header className='flex flex-col gap-4 rounded-[18px] border border-border/70 bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='size-14'>
                {user.profile_image_url ? <AvatarImage src={user.profile_image_url} alt='' /> : null}
                <AvatarFallback className='text-lg font-semibold'>{initials(user)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <h1 className='truncate text-2xl font-semibold tracking-tight text-foreground'>
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </h1>
                <p className='truncate text-sm text-muted-foreground'>{user.email}</p>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <StatusBadge status={user.active ? 'active' : 'inactive'} />
                  {userDomains.map(domain => (
                    <Badge key={domain} variant='outline' className='text-[10px] uppercase'>
                      {domain.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
          <div className='flex flex-col gap-4'>
            <SectionCard title='Identity & contact' description='Edit profile details and toggle access.'>
              <UserIdentityForm user={user} />
            </SectionCard>

            <SectionCard title='Roles & access' description='Domains and organisation affiliations.'>
              <div className='space-y-4'>
                <div>
                  <p className={adminTheme.sectionLabel}>Platform domains</p>
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    {userDomains.length ? (
                      userDomains.map(domain => (
                        <Badge key={domain} variant='secondary' className='uppercase'>
                          {domain.replace(/_/g, ' ')}
                        </Badge>
                      ))
                    ) : (
                      <span className='text-sm text-muted-foreground'>No domains assigned</span>
                    )}
                  </div>
                </div>

                {user.organisation_affiliations?.length ? (
                  <div className='space-y-2'>
                    <p className={adminTheme.sectionLabel}>Organisation affiliations</p>
                    {user.organisation_affiliations.map((affiliation, index) => (
                      <div
                        key={`${affiliation.organisation_uuid}-${index}`}
                        className='flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm'
                      >
                        <div>
                          <p className='font-medium text-foreground'>
                            {affiliation.organisation_name ?? 'Organisation'}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {affiliation.domain_in_organisation?.replace(/_/g, ' ') ?? 'Member'}
                            {affiliation.branch_name ? ` · ${affiliation.branch_name}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={affiliation.active ? 'active' : 'inactive'} />
                      </div>
                    ))}
                  </div>
                ) : null}

                <DetailGrid
                  items={[
                    { label: 'User no.', value: user.user_no ?? '—' },
                    { label: 'Joined', value: formatDate(user.created_date) },
                    { label: 'Last updated', value: formatDate(user.updated_date) },
                    { label: 'UUID', value: <span className='break-all text-xs'>{user.uuid}</span> },
                  ]}
                />
              </div>
            </SectionCard>
          </div>

          <div className='flex flex-col gap-4'>
            {verificationQuery.isLoading ? (
              <SectionCardSkeleton rows={5} />
            ) : domains.length ? (
              domains.map(domain => (
                <DomainVerificationSection
                  key={domain.role}
                  domain={domain}
                  verifierIdentity={verifier}
                  onChanged={() => verificationQuery.refetch()}
                />
              ))
            ) : (
              <SectionCard title='Verification' description='Credentials requiring review.'>
                <p className='flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground'>
                  <ShieldAlert className='size-4' />
                  This user has no verifiable domains (instructor or course creator) with documents.
                </p>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
