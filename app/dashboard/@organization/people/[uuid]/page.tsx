'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Wallet as WalletIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { User, Wallet } from '@/services/client';
import {
  getUserByUuidOptions,
  getWalletOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatusBadge,
} from '../../_components/ui';

const formatRole = (role?: string) =>
  role ? role.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : '—';

const formatDate = (value?: Date | string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'MMM dd, yyyy');
};

export default function OrganisationMemberDetailPage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const userQuery = useQuery({
    ...getUserByUuidOptions({ path: { uuid } }),
    enabled: Boolean(uuid),
  });

  const walletQuery = useQuery({
    ...getWalletOptions({ path: { userUuid: uuid } }),
    enabled: Boolean(uuid),
    retry: false,
    staleTime: STALE_TIMES.reference,
  });

  const user = extractEntity<User>(userQuery.data);
  const wallet = extractEntity<Wallet>(walletQuery.data);

  const affiliations = user?.organisation_affiliations ?? [];
  const currentAffiliation =
    affiliations.find(item => item.organisation_uuid === organisationUuid && item.active) ??
    affiliations.find(item => item.organisation_uuid === organisationUuid);

  const fullName =
    user && `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
      : (user?.email ?? 'Member');

  const walletLabel =
    wallet && wallet.balance_amount !== undefined
      ? `${wallet.currency_code ?? ''} ${Number(wallet.balance_amount).toLocaleString()}`.trim()
      : '—';

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title={userQuery.isLoading ? 'Member' : fullName}
          description={user?.email}
          eyebrow={
            <Link
              href='/dashboard/people'
              className='inline-flex items-center gap-1 hover:text-foreground'
            >
              <ArrowLeft className='size-3.5' />
              Back to people
            </Link>
          }
          actions={
            currentAffiliation ? (
              <StatusBadge
                tone='info'
                label={formatRole(currentAffiliation.domain_in_organisation)}
              />
            ) : null
          }
        />

        {userQuery.isLoading ? (
          <SectionCard title='Profile'>
            <div className='space-y-3'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-24 w-full' />
            </div>
          </SectionCard>
        ) : !user ? (
          <SectionCard title='Profile'>
            <p className='text-sm text-muted-foreground'>Member not found.</p>
          </SectionCard>
        ) : (
          <>
            <SectionCard title='Profile'>
              <DetailGrid
                items={[
                  { label: 'Full name', value: fullName },
                  { label: 'Email', value: user.email ?? '—' },
                  { label: 'Phone', value: user.phone_number || '—' },
                  { label: 'Gender', value: formatRole(user.gender) },
                  { label: 'Date of birth', value: formatDate(user.dob) },
                  { label: 'Joined', value: formatDate(user.created_date) },
                  {
                    label: 'Role in organisation',
                    value: formatRole(currentAffiliation?.domain_in_organisation),
                  },
                  {
                    label: 'Branch',
                    value: currentAffiliation?.branch_name || '—',
                  },
                  {
                    label: 'Skills Wallet',
                    value: (
                      <span className='inline-flex items-center gap-1.5'>
                        <WalletIcon className='size-3.5 text-muted-foreground' />
                        {walletQuery.isLoading ? '…' : walletLabel}
                      </span>
                    ),
                  },
                ]}
              />
            </SectionCard>

            {affiliations.length > 0 ? (
              <SectionCard title='Affiliations' description='Organisations this member belongs to'>
                <ul className='divide-y divide-border/60'>
                  {affiliations.map((affiliation, index) => (
                    <li
                      key={`${affiliation.organisation_uuid}-${index}`}
                      className='flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0'
                    >
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-foreground'>
                          {affiliation.organisation_name ?? 'Organisation'}
                        </p>
                        {affiliation.branch_name ? (
                          <p className='text-xs text-muted-foreground'>{affiliation.branch_name}</p>
                        ) : null}
                      </div>
                      <StatusBadge
                        status={affiliation.active ? 'active' : 'inactive'}
                        label={formatRole(affiliation.domain_in_organisation)}
                        tone='neutral'
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
