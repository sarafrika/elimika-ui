'use client';

import { useQuery } from '@tanstack/react-query';
import { Landmark, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { SectionCard } from '@/components/data-display';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney, formatMoneyDate } from '@/components/money/format';
import { MoneyPage } from '@/components/money/money-page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import type { User, Wallet as WalletDto } from '@/services/client';
import { getUsersByOrganisationAndDomainOptions, getWalletOptions } from '@/services/client/@tanstack/react-query.gen';

const TABS = ['balances'] as const;

const initials = (u: User) =>
  `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase();
const fullName = (u: User) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Unnamed';

/** "KES 1,200 · USD 40": one figure per currency, never summed across them. */
function perCurrency(wallets: WalletDto[]): string {
  const totals = new Map<string, number>();
  for (const w of wallets) {
    const code = w.currency_code ?? 'KES';
    totals.set(code, (totals.get(code) ?? 0) + Number(w.balance_amount ?? 0));
  }
  if (totals.size === 0) return formatMoney(0);
  return [...totals].map(([code, amount]) => formatMoney(amount, code)).join(' · ');
}

/** The learners in this organisation and what each holds in their wallet. */
export default function LearnerFundingPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'balances');

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'student' } }),
    enabled: Boolean(organisationUuid),
  });
  const students = extractPage<User>(studentsQuery.data).items;

  // Each row loads its learner's wallet, as before, and reports it here for the totals.
  const [walletByUser, setWalletByUser] = useState<Record<string, WalletDto | null>>({});
  const report = useCallback(
    (userUuid: string, wallet: WalletDto | null) => setWalletByUser(prev => ({ ...prev, [userUuid]: wallet })),
    []
  );
  const reported = students.filter(s => s.uuid && s.uuid in walletByUser);
  const wallets = reported
    .map(s => walletByUser[s.uuid ?? ''])
    .filter((w): w is WalletDto => Boolean(w && w.balance_amount != null));
  const funded = wallets.filter(w => Number(w.balance_amount) > 0).length;
  const walletsLoading = studentsQuery.isLoading || reported.length < students.filter(s => s.uuid).length;

  return (
    <MoneyPage
      eyebrow='Finance'
      title='Learner funding'
      description='What each of your learners holds in their wallet to pay for classes.'
      actions={
        <Button asChild variant='outline' size='sm'>
          <Link href='/dashboard/organisation/skills-fund'>
            <Landmark className='size-4' /> Skills Fund
          </Link>
        </Button>
      }
      loadingStats={walletsLoading}
      stats={[
        {
          label: 'In learner wallets',
          value: perCurrency(wallets),
          hint: `Across ${wallets.length} ${wallets.length === 1 ? 'wallet' : 'wallets'}`,
          icon: Wallet,
        },
        { label: 'Learners', value: students.length.toLocaleString(), hint: 'Enrolled with your organisation', icon: Users },
        {
          label: 'With money to spend',
          value: funded.toLocaleString(),
          hint: `${students.length - funded} with an empty or no wallet`,
        },
      ]}
      tabs={[{ id: 'balances', label: 'Wallet balances', count: students.length }]}
      tab={tab}
      onTabChange={setTab}
      hrefFor={hrefFor}
    >
      <SectionTabPanel value='balances'>
        <SectionCard
          title='Wallet balances'
          description='Each learner’s current wallet balance.'
          bodyClassName='p-0'
        >
          {studentsQuery.isLoading ? (
            <div className='space-y-2 p-5'>
              {[0, 1, 2, 3, 4].map(i => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              variant='plain'
              icon={Wallet}
              title='No learners yet'
              description='Invite learners to see their wallet balances here.'
            />
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[560px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-5 whitespace-nowrap'>Learner</TableHead>
                    <TableHead className='whitespace-nowrap'>Last updated</TableHead>
                    <TableHead className='pr-5 text-right whitespace-nowrap'>Wallet balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <LearnerRow key={student.uuid} student={student} onWallet={report} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </SectionTabPanel>
    </MoneyPage>
  );
}

/** One learner and their wallet, loaded per row as before. */
function LearnerRow({
  student,
  onWallet,
}: {
  student: User;
  onWallet: (userUuid: string, wallet: WalletDto | null) => void;
}) {
  const userUuid = student.uuid ?? '';
  const query = useQuery({
    ...getWalletOptions({ path: { userUuid } }),
    enabled: Boolean(userUuid),
    retry: false,
  });
  // A learner without a wallet answers with an error.
  const wallet = query.isError ? null : extractEntity<WalletDto>(query.data);
  const settled = query.isSuccess || query.isError;

  useEffect(() => {
    if (userUuid && settled) onWallet(userUuid, wallet);
  }, [userUuid, settled, wallet, onWallet]);

  return (
    <TableRow>
      <TableCell className='pl-5 whitespace-nowrap'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-8 shrink-0'>
            <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
              {initials(student)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='font-medium'>{fullName(student)}</p>
            {student.email ? <p className='text-muted-foreground text-xs'>{student.email}</p> : null}
          </div>
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground whitespace-nowrap'>
        {query.isLoading ? <Skeleton className='h-4 w-28' /> : formatMoneyDate(wallet?.updated_date)}
      </TableCell>
      <TableCell className='pr-5 text-right font-semibold whitespace-nowrap tabular-nums'>
        {query.isLoading ? (
          <Skeleton className='ml-auto h-4 w-20' />
        ) : wallet?.balance_amount == null ? (
          <span className='text-muted-foreground font-normal'>No wallet</span>
        ) : (
          formatMoney(wallet.balance_amount, wallet.currency_code)
        )}
      </TableCell>
    </TableRow>
  );
}
