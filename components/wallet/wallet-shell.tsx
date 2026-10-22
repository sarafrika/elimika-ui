'use client';

import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { type SectionTab, SectionTabs } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWalletFigures, type WalletScope } from './wallet-scope';

interface WalletShellProps<T extends string> {
  scope: WalletScope;
  title: string;
  description: string;
  eyebrow?: string;
  tabs: readonly SectionTab<T>[];
  tab: T;
  onTabChange: (tab: T) => void;
  hrefFor?: (tab: T) => string;
  /** Buttons beside the balances, e.g. Transfer. */
  actions?: ReactNode;
  /** Opens the withdraw flow; the button shows only when the server says the caller may withdraw. */
  onWithdraw?: () => void;
  /** One `SectionTabPanel` per tab. */
  children: ReactNode;
}

/** Every dashboard's wallet: balances and Withdraw in the header, chip tabs below. Only the domain colour differs. */
export function WalletShell<T extends string>({
  scope,
  title,
  description,
  eyebrow = 'Wallet',
  tabs,
  tab,
  onTabChange,
  hrefFor,
  actions,
  onWithdraw,
  children,
}: WalletShellProps<T>) {
  const { figures, isLoading } = useWalletFigures(scope);
  const currency = figures?.currency ?? 'KES';
  const balances = [
    { label: 'Account balance', value: figures ? figures.balance + figures.held : undefined },
    { label: 'Available balance', value: figures?.available },
  ];

  return (
    <div className={cn(surfaceTheme.page, 'space-y-5')}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <div className='flex flex-wrap items-end gap-4'>
            <dl className='flex flex-wrap gap-5'>
              {balances.map(({ label, value }) => (
                <div key={label}>
                  <dt className='text-muted-foreground text-xs'>{label}</dt>
                  <dd className='mt-1 text-lg font-semibold tabular-nums'>
                    {isLoading ? <Skeleton className='h-6 w-28' /> : formatMoney(value ?? 0, currency)}
                  </dd>
                </div>
              ))}
            </dl>
            {actions}
            {onWithdraw && figures?.canWithdraw ? (
              <Button onClick={onWithdraw}>
                <ArrowUpRight aria-hidden className='size-4' />
                Withdraw
              </Button>
            ) : null}
          </div>
        }
      />
      <SectionTabs label={`${title} sections`} variant='chips' tabs={tabs} value={tab} onValueChange={onTabChange} hrefFor={hrefFor}>
        {children}
      </SectionTabs>
    </div>
  );
}
