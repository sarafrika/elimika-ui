// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { listMyOrdersOptions } from '@/services/client/@tanstack/react-query.gen';
import { formatAmount } from './checkout-format';

const RECENT = { pageable: { page: 0, size: 5 } };

/**
 * A checked-out cart becomes an order, so an unpaid one would otherwise vanish from the cart.
 * This keeps it in sight with a way back into paying for that same order.
 */
export function UnpaidOrdersNotice({ className }: { className?: string }) {
  const orders = useQuery({ ...listMyOrdersOptions({ query: RECENT }), staleTime: STALE_TIMES.live });
  const unpaid = (orders.data?.data?.content ?? []).filter(
    order => (order.payment_status ?? '').toUpperCase() === 'AWAITING_PAYMENT'
  );
  if (unpaid.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {unpaid.map(order => (
        <section
          key={order.id}
          aria-label={`Unpaid order ${order.display_id ?? ''}`}
          className={cn('flex flex-wrap items-center gap-3 rounded-md border p-4', statusToneClass.warning)}
        >
          <Clock aria-hidden className='size-5 shrink-0' />
          <div className='text-foreground min-w-0 flex-1'>
            <div className='text-sm font-semibold'>
              You have an unpaid order <span className='font-mono'>{order.display_id}</span>
            </div>
            <div className='text-muted-foreground text-xs'>
              {(order.items ?? [])[0]?.title ?? 'Class'} · {formatAmount(order.total, order.currency_code)} · your seat is
              held for a few minutes
            </div>
          </div>
          <Button asChild size='sm'>
            <Link href={`/dashboard/checkout?order=${order.id}`}>Finish paying</Link>
          </Button>
        </section>
      ))}
    </div>
  );
}
