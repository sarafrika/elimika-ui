'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatWalletMoney } from '@/src/features/wallet/wallet-accounts';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function WalletPageHeader({
  title,
  description,
  accountBalance,
  availableBalance,
  currency,
  isLoading,
  withdrawHref,
}: {
  title: string;
  description: string;
  accountBalance?: number;
  availableBalance?: number;
  currency: string;
  isLoading: boolean;
  withdrawHref: string;
}) {
  return (
    <PageHeader
      eyebrow='Wallet'
      title={title}
      description={description}
      actions={
        <div className='flex flex-wrap items-end gap-4'>
          <dl className='flex flex-wrap gap-4'>
            {[
              { label: 'Account balance', value: accountBalance },
              { label: 'Available balance', value: availableBalance },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className='text-muted-foreground text-xs'>{label}</dt>
                <dd className='mt-1 text-lg font-semibold tabular-nums'>
                  {isLoading ? (
                    <Skeleton className='h-6 w-28' />
                  ) : (
                    formatWalletMoney(value, currency)
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Button asChild>
            <Link href={withdrawHref}>
              <ArrowUpRight aria-hidden className='size-4' />
              Withdraw
            </Link>
          </Button>
        </div>
      }
    />
  );
}
