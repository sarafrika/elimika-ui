'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
} from '@/app/dashboard/@organization/_components/ui';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import type { ClassDefinition, Organisation, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getOrganisationByUuidOptions,
  getOrganisationStatisticsOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

const money = (value?: number | null): string =>
  value === undefined || value === null
    ? '—'
    : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fullName = (user?: User): string =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || (user?.email ?? '—');

/**
 * Single, accurate overview of the organisation: profile, membership, branches,
 * training-fee posture and administrators — the read view for the account hub.
 */
export default function OrganisationOverviewPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const profileQuery = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });
  const statsQuery = useQuery({
    ...getOrganisationStatisticsOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled,
  });
  const adminsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'organisation_user' },
    }),
    enabled,
  });

  const profile = extractEntity<Organisation>(profileQuery.data) ?? (organisation as Organisation | undefined);
  const stats = statsQuery.data?.data;

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );
  const feeSummary = useMemo(() => {
    const fees = classes
      .map(c => (c.training_fee == null ? null : Number(c.training_fee)))
      .filter((f): f is number => f != null && !Number.isNaN(f));
    if (fees.length === 0) return { count: 0, min: null as number | null, max: null as number | null, avg: null as number | null };
    const min = Math.min(...fees);
    const max = Math.max(...fees);
    const avg = fees.reduce((s, f) => s + f, 0) / fees.length;
    return { count: fees.length, min, max, avg };
  }, [classes]);

  const admins = useMemo(() => {
    const raw = adminsQuery.data as { data?: User[] } | User[] | undefined;
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return list as User[];
  }, [adminsQuery.data]);

  const isVerified = Boolean(profile?.admin_verified);
  const kpiLoading = statsQuery.isLoading;

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title={profile?.name || 'Organisation'}
          description='A complete view of your organisation — profile, people, branches and fees.'
          actions={
            <StatusBadge
              status={isVerified ? 'verified' : 'pending'}
              label={isVerified ? 'Verified' : 'Pending verification'}
            />
          }
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {kpiLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label='Students' value={num(stats?.total_students)} icon={GraduationCap} tone='success' />
              <StatCard label='Instructors' value={num(stats?.total_instructors)} icon={Briefcase} tone='info' />
              <StatCard label='Administrators' value={num(stats?.total_admins)} icon={Users} tone='neutral' />
              <StatCard label='Branches' value={num(stats?.total_branches)} icon={Building} tone='warning' />
            </>
          )}
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard
            title='Profile'
            description='Registered organisation details'
            actions={
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/account/training-center'>Edit</Link>
              </Button>
            }
          >
            <DetailGrid
              items={[
                { label: 'Name', value: profile?.name ?? '—' },
                { label: 'Licence no.', value: profile?.licence_no ?? '—' },
                { label: 'Location', value: profile?.location ?? '—' },
                { label: 'Country', value: profile?.country ?? '—' },
                { label: 'Status', value: profile?.active ? 'Active' : 'Inactive' },
                { label: 'Verification', value: isVerified ? 'Verified' : 'Pending' },
              ]}
            />
          </SectionCard>

          <SectionCard
            title='Training fees'
            description='Per-session fees across your classes'
            actions={
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/account/fees-scheduling'>Manage</Link>
              </Button>
            }
          >
            <DetailGrid
              items={[
                { label: 'Classes with a fee', value: num(feeSummary.count) },
                { label: 'Average fee / session', value: money(feeSummary.avg) },
                { label: 'Lowest fee', value: money(feeSummary.min) },
                { label: 'Highest fee', value: money(feeSummary.max) },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard
          title='Administrators'
          description='People who manage this organisation'
          actions={
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/account/admin'>Manage</Link>
            </Button>
          }
        >
          {adminsQuery.isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : admins.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No administrators found.</p>
          ) : (
            <ul className='divide-y divide-border/60'>
              {admins.map(admin => (
                <li
                  key={admin.uuid ?? admin.email}
                  className='flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0'
                >
                  <span className='inline-flex items-center gap-2 min-w-0'>
                    <ShieldCheck className='text-primary size-4 shrink-0' />
                    <span className='truncate text-sm font-medium text-foreground'>{fullName(admin)}</span>
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>{admin.email ?? ''}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
