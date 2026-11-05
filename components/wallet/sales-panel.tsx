'use client';

import { ReceiptText, Split } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTimeZone } from '@/context/timezone-context';
import { formatDateTime } from '@/lib/date';
import { purseLabel } from '@/src/features/wallet/purses';
import type { SaleSplit } from '@/src/features/wallet/sale-splits';
import { useSaleSplit, useSaleSplits } from '@/src/features/wallet/use-sale-splits';
import { SaleSplitBreakdown } from './sale-split-breakdown';
import type { WalletScope } from './wallet-scope';

function BreakdownSkeleton() {
  return (
    <div className='space-y-3' aria-busy>
      <Skeleton className='h-5 w-40' />
      <Skeleton className='h-28 w-full' />
      <Skeleton className='h-28 w-full' />
      <Skeleton className='h-16 w-full' />
    </div>
  );
}

/** The side panel for one sold line's split, opened from Sales or from a ledger row. */
export function SaleSplitSheet({
  scope,
  splitUuid,
  initial,
  onClose,
  transactionsHref,
}: {
  scope: WalletScope;
  splitUuid: string | null;
  initial?: SaleSplit;
  onClose: () => void;
  transactionsHref?: string;
}) {
  const query = useSaleSplit(scope, splitUuid, initial);
  const split = query.data ?? null;
  return (
    <Sheet open={Boolean(splitUuid)} onOpenChange={open => !open && onClose()}>
      <SheetContent side='right' className='w-full gap-0 sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{split?.title ?? 'Sale breakdown'}</SheetTitle>
          <SheetDescription>How this line was split, including platform fees.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pb-6'>
          {query.isLoading && !split ? (
            <BreakdownSkeleton />
          ) : query.isError && !split ? (
            <EmptyState
              variant='compact'
              icon={Split}
              title='Could not load this breakdown'
              description='Please try again.'
              action={
                <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : split ? (
            <SaleSplitBreakdown split={split} transactionsHref={transactionsHref} />
          ) : (
            <EmptyState variant='compact' icon={Split} title='Breakdown not found' description='This sale has no split recorded.' />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Every sold line paid into this purse: line total, your share, your fee and what you receive. */
export function SalesPanel({
  scope,
  active,
  transactionsHref,
}: {
  scope: WalletScope;
  active: boolean;
  transactionsHref?: string;
}) {
  const query = useSaleSplits(scope, active);
  const { zone } = useTimeZone();
  const [open, setOpen] = useState<SaleSplit | null>(null);
  const purse = purseLabel(scope.purse);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Sales</CardTitle>
        <CardDescription>
          {purse ? `Lines paid into your ${purse.toLowerCase()}. ` : ''}Open one to see how it was split, platform fees
          included.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className='space-y-3 py-2'>
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState
            variant='compact'
            icon={ReceiptText}
            title='Could not load sales'
            description='Please try again.'
            action={
              <Button variant='outline' size='sm' onClick={query.refetch}>
                Retry
              </Button>
            }
          />
        ) : query.rows.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={ReceiptText}
            title='No sales yet'
            description='Each line sold appears here with your share, its platform fee and what you received.'
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale</TableHead>
                <TableHead className='text-right'>Line total</TableHead>
                <TableHead className='text-right'>Your share</TableHead>
                <TableHead className='text-right'>Your fee</TableHead>
                <TableHead className='text-right'>You receive</TableHead>
                <TableHead>
                  <span className='sr-only'>Breakdown</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.rows.map(row => {
                const currency = row.currency_code ?? 'KES';
                return (
                  <TableRow key={row.uuid} className='cursor-pointer' onClick={() => setOpen(row)}>
                    <TableCell>
                      <span className='block font-medium'>{row.title ?? 'Sale'}</span>
                      <span className='text-muted-foreground text-xs'>
                        {formatDateTime(row.captured_at, { zone })}
                        {row.order_number ? ` · Order ${row.order_number}` : ''}
                      </span>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{formatMoney(row.line_gross ?? 0, currency)}</TableCell>
                    <TableCell className='text-right tabular-nums'>{formatMoney(row.your_gross ?? 0, currency)}</TableCell>
                    <TableCell className='text-muted-foreground text-right tabular-nums'>
                      − {formatMoney(row.your_fee ?? 0, currency)}
                    </TableCell>
                    <TableCell className='text-success text-right font-semibold tabular-nums'>
                      {formatMoney(row.your_net ?? 0, currency)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={event => {
                          event.stopPropagation();
                          setOpen(row);
                        }}
                      >
                        Breakdown
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {query.hasNextPage ? (
          <div className='flex justify-center pt-3'>
            <Button variant='outline' size='sm' onClick={query.fetchNextPage} disabled={query.isFetchingNextPage}>
              {query.isFetchingNextPage && <Spinner />}Load more
            </Button>
          </div>
        ) : null}
      </CardContent>
      <SaleSplitSheet
        scope={scope}
        splitUuid={open?.uuid ?? null}
        initial={open ?? undefined}
        onClose={() => setOpen(null)}
        transactionsHref={transactionsHref}
      />
    </Card>
  );
}
