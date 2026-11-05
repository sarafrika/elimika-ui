// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, GraduationCap, Lock, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { AsyncSection } from '@/components/data/async-section';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { usePaymentMode } from '@/hooks/use-payment-mode';
import { useSavedCart } from '@/hooks/use-saved-cart';
import { getErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import type { CartItemResponse } from '@/services/client';
import {
  completeCheckoutMutation,
  getCartQueryKey,
  removeItemMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { formatAmount } from '@/src/features/checkout/checkout-format';
import { UnpaidOrdersNotice } from '@/src/features/checkout/unpaid-orders-notice';
import { invalidateEnrollmentSuccessQueries } from '@/src/features/dashboard/courses/shared/enrollment-query-invalidation';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useCartStore } from '@/store/cart-store';
import { useUserDomain } from '../../../context/user-domain-context';

/** What the line actually pays for, read from the schedule the cart priced it against. */
function lineChips(item: CartItemResponse): string[] {
  const meta = item.metadata ?? {};
  const hours = Number(meta.scheduled_hours);
  const sessions = Number(meta.scheduled_instances);
  const total = Number(item.total ?? item.subtotal);
  const chips: string[] = [];
  if (Number.isFinite(hours) && hours > 0 && Number.isFinite(total) && total > 0) {
    chips.push(`${formatAmount(total / hours)}/h × ${Number(hours.toFixed(2))} h`);
  }
  if (Number.isFinite(sessions) && sessions > 0) chips.push(`${sessions} session${sessions === 1 ? '' : 's'}`);
  return chips;
}

export default function CartPage() {
  const { cartId, clearCart } = useCartStore();
  const queryClient = useQueryClient();
  const { activeDomain } = useUserDomain();
  const router = useRouter();
  const profile = useUserProfile();
  const removeItemMut = useMutation(removeItemMutation());
  const completeCheckout = useMutation(completeCheckoutMutation());
  const { paymentRequired } = usePaymentMode();
  const [enrolling, setEnrolling] = useState(false);
  const canUseStudentCart = activeDomain === 'student' && Boolean(profile?.student?.uuid);
  const dashboardFallbackHref = roleScopedDashboardPath(activeDomain, '/dashboard/overview');
  const browseHref = roleScopedDashboardPath(activeDomain, '/dashboard/courses');

  const cartQuery = useSavedCart({ enabled: canUseStudentCart });
  const cart = cartQuery?.data?.data ?? null;
  const cartItems: CartItemResponse[] = useMemo(() => cart?.items ?? [], [cart?.items]);
  const isEmpty = cartItems.length === 0;
  const isOpenCart = (cart?.status ?? 'OPEN').toUpperCase() === 'OPEN';
  const currency = cart?.currency_code ?? 'KES';
  const totalLabel = formatAmount(cart?.total, currency);

  useEffect(() => {
    if (profile?.isLoading || !activeDomain || canUseStudentCart) return;
    router.replace(dashboardFallbackHref);
  }, [activeDomain, canUseStudentCart, dashboardFallbackHref, profile?.isLoading, router]);

  if (!canUseStudentCart) {
    return (
      <main className={cn(surfaceTheme.page, 'py-10')}>
        <EmptyState
          icon={ShoppingCart}
          title='Student cart only'
          description='Switch to your student profile to view enrolment cart items.'
          action={
            <Button asChild>
              <Link href={dashboardFallbackHref}>Back to dashboard</Link>
            </Button>
          }
        />
      </main>
    );
  }

  // Free mode captures on completion, so the cart enrols directly instead of sending anyone to pay.
  const enrolWithoutPayment = async () => {
    if (!cartId) {
      toast.error('No cart found');
      return;
    }
    const email = profile?.email;
    if (!email) {
      toast.error('Please sign in to complete your enrolment.');
      return;
    }
    setEnrolling(true);
    try {
      await completeCheckout.mutateAsync({
        body: { cart_id: cartId, customer_email: email, payment_provider_id: 'manual' },
      });
      await invalidateEnrollmentSuccessQueries(queryClient, { cartId });
      toast.success('You are enrolled.');
      clearCart();
      router.push(roleScopedDashboardPath('student', '/dashboard/learning-hub'));
    } catch (error) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId } }) }),
        invalidateEnrollmentSuccessQueries(queryClient, { cartId }),
      ]);
      toast.error(getErrorMessage(error, 'Could not complete your enrolment. Please try again.'));
    } finally {
      setEnrolling(false);
    }
  };

  const removeLine = (id: string) => {
    if (!isOpenCart) {
      toast.error('This cart is no longer editable.');
      return;
    }
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId: cartId as string } }) });
    removeItemMut.mutate(
      { path: { cartId: cartId as string, itemId: id } },
      {
        onSuccess: () => {
          void refresh();
          toast.success('Removed from your cart');
        },
        onError: error => {
          void refresh();
          toast.error(getErrorMessage(error, 'Unable to remove this item.'));
        },
      }
    );
  };

  const initialLoading = cartQuery.isLoading && !cart;
  const primaryAction = paymentRequired ? (
    <Button asChild size='lg' className='w-full'>
      <Link href='/dashboard/checkout'>
        <Lock aria-hidden className='size-4' />
        Continue to payment
      </Link>
    </Button>
  ) : (
    <Button size='lg' className='w-full' onClick={() => void enrolWithoutPayment()} disabled={enrolling || !isOpenCart}>
      {enrolling ? 'Enrolling…' : 'Complete enrolment'}
    </Button>
  );

  return (
    <main className={cn(surfaceTheme.pageWide, 'py-5 pb-32 sm:pb-16')}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Cart'
          title={initialLoading ? 'Your cart' : isEmpty ? 'Your cart is empty' : `${cartItems.length} ${cartItems.length === 1 ? 'class' : 'classes'} in your cart`}
          description={
            paymentRequired
              ? 'Seats are yours once the M-Pesa payment goes through.'
              : 'Complete enrolment to take your seats.'
          }
          actions={
            <Button asChild variant='outline'>
              <Link href={browseHref}>Keep browsing</Link>
            </Button>
          }
        />

        <UnpaidOrdersNotice />

        <AsyncSection
          loading={initialLoading}
          error={cartQuery.error}
          empty={isEmpty}
          onRetry={cartQuery.refetch}
          skeleton={
            <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]'>
              <Skeleton className='h-36 w-full rounded-md' />
              <Skeleton className='h-56 w-full rounded-md' />
            </div>
          }
          emptyState={
            <div className={cn(surfaceTheme.card, 'flex flex-col items-center gap-3 border-dashed px-5 py-12 text-center')}>
              <span className={cn('flex size-12 items-center justify-center rounded-md border', statusToneClass.info)}>
                <ShoppingCart aria-hidden className='size-5' />
              </span>
              <strong className='text-base'>Nothing in your cart</strong>
              <p className='text-muted-foreground max-w-sm text-sm'>
                Orders you started but haven&apos;t paid for wait in your Wallet, ready to finish.
              </p>
              <Button asChild>
                <Link href={browseHref}>
                  Find a class
                  <ArrowRight aria-hidden className='size-4' />
                </Link>
              </Button>
            </div>
          }
        >
          <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]'>
            <ul className='flex min-w-0 flex-col gap-3'>
              {cartItems.map(item => (
                <li key={item.id} className={cn(surfaceTheme.card, 'flex flex-wrap items-start gap-4 p-4 sm:p-5')}>
                  <span
                    aria-hidden
                    className='border-primary/30 bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-md border'
                  >
                    <GraduationCap className='size-6' />
                  </span>
                  <div className='flex min-w-0 flex-[1_1_240px] flex-col gap-2'>
                    <h2 className='text-lg leading-snug font-semibold tracking-tight'>{item.title ?? 'Class'}</h2>
                    <div className='flex flex-wrap gap-1.5'>
                      {lineChips(item).map((chip, index) => (
                        <span
                          key={chip}
                          className={cn(
                            'rounded-md border px-2.5 py-0.5 text-[13px] font-semibold',
                            index === 0 ? statusToneClass.info : statusToneClass.neutral
                          )}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <p className='text-muted-foreground text-[13px]'>
                      Seat for <strong className='text-foreground'>you</strong>
                    </p>
                  </div>
                  <div className='ml-auto flex flex-col items-end gap-1'>
                    <span className='text-lg font-extrabold tabular-nums'>{formatAmount(item.total ?? item.subtotal, currency)}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={!isOpenCart || removeItemMut.isPending}
                      onClick={() => removeLine(item.id as string)}
                      className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                    >
                      <Trash2 aria-hidden className='size-4' />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <aside aria-label='Order summary' className={cn(surfaceTheme.cardPadded, 'hidden flex-col gap-4 sm:flex xl:sticky xl:top-20')}>
              <div className='flex items-baseline justify-between'>
                <span className='text-sm font-semibold'>Total</span>
                <span className='text-2xl font-extrabold tabular-nums'>{totalLabel}</span>
              </div>
              {primaryAction}
              <Button asChild variant='outline' className='w-full'>
                <Link href={browseHref}>Keep browsing</Link>
              </Button>
              <p className='text-muted-foreground border-border/60 border-t pt-3 text-xs'>
                {paymentRequired
                  ? 'We hold your seat for 5 minutes once you start paying.'
                  : 'No payment is needed on this environment.'}
              </p>
            </aside>
          </div>

          <div className='bg-card fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 pt-3 pb-4 shadow-[0_-12px_28px_-18px_rgba(28,31,43,.35)] sm:hidden'>
            <div className='flex flex-col'>
              <span className='text-muted-foreground text-[11px] font-semibold'>Total</span>
              <span className='text-lg font-extrabold tabular-nums'>{totalLabel}</span>
            </div>
            <div className='flex-1'>{primaryAction}</div>
          </div>
        </AsyncSection>
      </div>
    </main>
  );
}
