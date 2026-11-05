// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { usePaymentMode } from '@/hooks/use-payment-mode';
import { useSavedCart } from '@/hooks/use-saved-cart';
import { cn } from '@/lib/utils';
import type { CartItemResponse } from '@/services/client';
import {
  completeCheckoutMutation,
  getClassEnrolmentEligibilityOptions,
  getOrderOptions,
  getPaymentStatusOptions,
  payWithMpesaMutation,
  selectPaymentSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateEnrollmentSuccessQueries } from '@/src/features/dashboard/courses/shared/enrollment-query-invalidation';
import { useCartStore } from '@/store/cart-store';
import { AwaitingConfirmation } from './awaiting-confirmation';
import { formatAmount, normalizeMsisdn } from './checkout-format';
import { CheckoutProgress, OrderSummaryCard, type SummaryLine, ToneNote } from './checkout-parts';
import { NotPaidResult, PaidResult, RefusedResult } from './payment-results';

const POLL_INTERVAL_MS = 5000;
/** The prompt lives about a minute; keep checking a little longer for a slow confirmation. */
const GIVE_UP_AFTER_MS = 90_000;
/** Eligibility is checked per class line; a cart never holds more than a handful. */
const MAX_ELIGIBILITY_CHECKS = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Stage = 'form' | 'sending' | 'waiting' | 'paid' | 'failed' | 'timeout' | 'refused';

const classUuidOf = (item: CartItemResponse): string | null => {
  const value = item.metadata?.class_definition_uuid;
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
};

const lineDetail = (item: CartItemResponse): string | undefined => {
  const hours = Number(item.metadata?.scheduled_hours);
  const sessions = Number(item.metadata?.scheduled_instances);
  const parts = [];
  if (Number.isFinite(sessions) && sessions > 0) parts.push(`${sessions} session${sessions === 1 ? '' : 's'}`);
  if (Number.isFinite(hours) && hours > 0) parts.push(`${Number(hours.toFixed(2))} h of teaching`);
  return parts.length ? parts.join(' · ') : undefined;
};

export function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useUserProfile();
  const { paymentRequired } = usePaymentMode();
  const { cartId, clearCart } = useCartStore();
  // `?order=` resumes paying for an order already placed, e.g. from the cart's unpaid-order notice.
  const resumeOrderId = useSearchParams().get('order');

  const [stage, setStage] = useState<Stage>('form');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [order, setOrder] = useState<{ id: string; number: string | null; total: number | string; lines: SummaryLine[] } | null>(null);
  const [msisdn, setMsisdn] = useState('');
  const [promptSentAt, setPromptSentAt] = useState<number | null>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    if (profile?.email && !email) setEmail(profile.email);
    if (profile?.phone_number && !phone) setPhone(profile.phone_number);
  }, [profile?.email, profile?.phone_number, email, phone]);

  const cartQuery = useSavedCart();
  const cart = cartQuery.data?.data ?? null;
  const cartItems: CartItemResponse[] = cart?.items ?? [];
  const currency = cart?.currency_code ?? 'KES';
  const studentUuid = profile?.student?.uuid;

  const cartLines: SummaryLine[] = useMemo(
    () =>
      cartItems.map(item => ({
        id: item.id ?? item.variant_id ?? item.title ?? 'line',
        title: item.title ?? 'Class',
        detail: lineDetail(item),
        total: item.total ?? item.subtotal,
      })),
    [cartItems]
  );

  const classLines = useMemo(
    () =>
      cartItems
        .map(item => ({ item, classUuid: classUuidOf(item) }))
        .filter((entry): entry is { item: CartItemResponse; classUuid: string } => Boolean(entry.classUuid)),
    [cartItems]
  );
  const eligibility = useQueries({
    queries: classLines.slice(0, MAX_ELIGIBILITY_CHECKS).map(entry => ({
      ...getClassEnrolmentEligibilityOptions({
        path: { classDefinitionUuid: entry.classUuid, studentUuid: studentUuid ?? 'unset' },
      }),
      enabled: Boolean(studentUuid),
      retry: 1,
    })),
  });
  const blockers = classLines.flatMap((entry, index) => {
    const result = eligibility[index]?.data?.data;
    return result && result.eligible === false
      ? [{ title: entry.item.title ?? 'This class', reason: result.reason ?? 'This class cannot be joined right now.' }]
      : [];
  });
  const checkingEligibility = Boolean(studentUuid) && eligibility.some(q => q.isLoading);

  const resumed = useQuery({
    ...getOrderOptions({ path: { orderId: resumeOrderId ?? 'unset' } }),
    enabled: Boolean(resumeOrderId) && !order,
    retry: false,
  });
  useEffect(() => {
    const data = resumed.data?.data;
    if (!data?.id || order) return;
    if ((data.payment_status ?? '').toUpperCase() !== 'AWAITING_PAYMENT') {
      router.replace('/dashboard/student/wallet');
      return;
    }
    setOrder({
      id: data.id,
      number: data.display_id ?? null,
      total: data.total,
      lines: (data.items ?? []).map(item => ({
        id: item.id ?? item.title ?? 'line',
        title: item.title ?? 'Class',
        detail: lineDetail(item),
        total: item.total ?? item.subtotal,
      })),
    });
  }, [resumed.data, order, router]);

  const selectPaymentSession = useMutation(selectPaymentSessionMutation());
  const completeCheckout = useMutation(completeCheckoutMutation());
  const payWithMpesa = useMutation(payWithMpesaMutation());

  const statusQuery = useQuery({
    ...getPaymentStatusOptions({ path: { orderId: order?.id ?? 'unset' } }),
    enabled: stage === 'waiting' && Boolean(order?.id),
    refetchInterval: stage === 'waiting' ? POLL_INTERVAL_MS : false,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (stage !== 'waiting') return;
    // A resend reuses the order's query key: an answer from before this prompt is the last attempt's, not this one's.
    if (!promptSentAt || statusQuery.dataUpdatedAt < promptSentAt) return;
    const status = statusQuery.data?.data?.status?.toUpperCase();
    if (status === 'SUCCESS' || status === 'CAPTURED') setStage('paid');
    else if (status === 'REFUSED') setStage('refused');
    else if (status === 'FAILED' || status === 'CANCELLED' || status === 'CANCELED') setStage('failed');
  }, [statusQuery.data, statusQuery.dataUpdatedAt, stage, promptSentAt]);

  useEffect(() => {
    if (stage !== 'waiting') return;
    const timer = setTimeout(() => setStage('timeout'), GIVE_UP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [stage, promptSentAt]);

  // A settled order is no longer a cart: forget it so the badge and cart page stop showing it.
  useEffect(() => {
    if ((stage !== 'paid' && stage !== 'refused') || settledRef.current) return;
    settledRef.current = true;
    if (stage === 'paid') {
      void invalidateEnrollmentSuccessQueries(queryClient, { cartId });
      toast.success('Payment received — your seat is confirmed.');
    }
    clearCart();
  }, [stage, queryClient, cartId, clearCart]);

  useEffect(() => {
    if (!paymentRequired) router.replace('/dashboard/cart');
  }, [paymentRequired, router]);

  useEffect(() => {
    if (stage === 'form' && !cartId && !resumeOrderId && !order && !cartQuery.isLoading) router.replace('/dashboard/cart');
  }, [stage, cartId, resumeOrderId, order, cartQuery.isLoading, router]);

  const sendPrompt = async (orderId: string, number: string) => {
    await payWithMpesa.mutateAsync({ path: { orderId }, body: { phone_number: number } });
    setPromptSentAt(Date.now());
    setStage('waiting');
  };

  const startPayment = async () => {
    const number = normalizeMsisdn(phone);
    if (!number) {
      setPhoneError('Enter a Safaricom number, e.g. 0712 345 678');
      return;
    }
    setPhoneError(null);
    if (!cartId && !order) return;
    if (blockers.length > 0) {
      toast.error(blockers[0].reason);
      return;
    }
    setMsisdn(number);
    setStage('sending');
    try {
      let current = order;
      if (!current) {
        await selectPaymentSession.mutateAsync({ path: { cartId }, body: { provider_id: 'mpesa' } });
        const placed = await completeCheckout.mutateAsync({
          body: { cart_id: cartId, customer_email: email, payment_provider_id: 'mpesa' },
        });
        const data = placed?.data;
        if (!data?.id) throw new Error('Order id missing from checkout response');
        current = { id: data.id, number: data.display_id ?? null, total: data.total ?? cart?.total, lines: cartLines };
        setOrder(current);
      }
      await sendPrompt(current.id, number);
    } catch {
      setStage('form');
      toast.error('Could not send the M-Pesa prompt. Please try again.');
    }
  };

  const resend = async () => {
    if (!order) return;
    try {
      await sendPrompt(order.id, msisdn);
    } catch {
      setStage('failed');
      toast.error('Could not resend the M-Pesa prompt. Please try again.');
    }
  };

  const total = order?.total ?? cart?.total;
  const amountLabel = formatAmount(total, currency);
  const lines = order?.lines ?? cartLines;
  const summary = (
    <OrderSummaryCard
      lines={lines}
      total={total}
      currency={currency}
      orderNumber={order?.number}
      className='xl:sticky xl:top-20'
      footer={<ToneNote>Your seat is held for 5 minutes while you pay.</ToneNote>}
    />
  );

  if (stage === 'paid') {
    return (
      <main className={cn(surfaceTheme.pageWide, 'py-5 pb-16')}>
        <PaidResult
          firstName={profile?.first_name}
          classTitle={lines[0]?.title ?? 'your class'}
          amountLabel={amountLabel}
          orderNumber={order?.number}
          receiptEmail={email}
          classHref='/dashboard/student/learning-hub'
        />
      </main>
    );
  }
  if (stage === 'refused') {
    return (
      <main className={cn(surfaceTheme.pageWide, 'py-5 pb-16')}>
        <RefusedResult orderNumber={order?.number} amountLabel={amountLabel} />
      </main>
    );
  }
  if (stage === 'failed' || stage === 'timeout') {
    return (
      <main className={cn(surfaceTheme.pageWide, 'py-5 pb-16')}>
        <NotPaidResult
          timedOut={stage === 'timeout'}
          orderNumber={order?.number}
          amountLabel={amountLabel}
          resending={payWithMpesa.isPending}
          onResend={() => void resend()}
          onChangeNumber={() => setStage('form')}
        />
      </main>
    );
  }

  const waiting = stage === 'waiting' && order;

  return (
    <main className={cn(surfaceTheme.pageWide, 'py-5 pb-32 sm:pb-16')}>
      <div className={surfaceTheme.pageStack}>
        <Button asChild variant='ghost' size='sm' className='text-muted-foreground self-start'>
          <Link href='/dashboard/cart'>
            <ArrowLeft aria-hidden className='size-4' />
            Back to cart
          </Link>
        </Button>
        <PageHeader
          eyebrow={waiting ? 'Checkout · step 2 of 3' : 'Checkout'}
          title={waiting ? 'Approve the payment on your phone' : `Pay ${amountLabel}`}
          description={
            waiting
              ? 'Your seat is confirmed the moment you enter your M-Pesa PIN.'
              : 'We send a prompt to your phone. Enter your M-Pesa PIN and you’re in.'
          }
        />
        <CheckoutProgress current={1} />

        <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]'>
          {waiting ? (
            <AwaitingConfirmation
              msisdn={msisdn}
              amountLabel={amountLabel}
              orderNumber={order.number ?? ''}
              promptSentAt={promptSentAt}
              lastCheckedAt={statusQuery.dataUpdatedAt || null}
              resending={payWithMpesa.isPending}
              onResend={() => void resend()}
              onChangeNumber={() => setStage('form')}
            />
          ) : (
            <section className={cn(surfaceTheme.cardPadded, 'flex min-w-0 flex-col gap-5')}>
              {blockers.length > 0 ? (
                <div className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', statusToneClass.destructive)}>
                  <AlertCircle aria-hidden className='mt-0.5 size-4 shrink-0' />
                  <div>
                    <div className='font-semibold'>You can&apos;t pay for this yet</div>
                    {blockers.map(b => (
                      <div key={b.title}>
                        {b.title}: {b.reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className={surfaceTheme.sectionLabel}>Payment method</div>
              <div className='border-primary bg-primary/[0.04] flex items-center gap-3 rounded-md border-[1.5px] p-3.5'>
                <span className={cn('rounded-md border px-2.5 py-2 text-xs font-extrabold tracking-wide', statusToneClass.success)}>
                  M-PESA
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-semibold'>Lipa na M-Pesa</div>
                  <div className='text-muted-foreground text-xs'>A PIN prompt pops up on your phone</div>
                </div>
                <span aria-hidden className='border-primary size-5 rounded-full border-[6px]' />
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='mpesa-phone'>M-Pesa phone number</Label>
                <div
                  className={cn(
                    'border-input focus-within:border-primary focus-within:ring-primary/20 flex h-11 items-stretch overflow-hidden rounded-md border focus-within:ring-[3px]',
                    phoneError && 'border-destructive'
                  )}
                >
                  <span className='bg-muted/50 text-muted-foreground flex items-center border-r px-3 text-sm font-semibold'>
                    +254
                  </span>
                  <input
                    id='mpesa-phone'
                    type='tel'
                    inputMode='numeric'
                    autoComplete='tel-national'
                    placeholder='712 345 678'
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby='mpesa-phone-help'
                    className='min-w-0 flex-1 bg-transparent px-3 text-[15px] font-medium tabular-nums outline-none'
                  />
                </div>
                <p id='mpesa-phone-help' className={cn('text-xs', phoneError ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                  {phoneError ?? 'Safaricom numbers only. The prompt shows your order number as the account.'}
                </p>
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='receipt-email'>Receipt email</Label>
                <Input id='receipt-email' type='email' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <Button
                size='lg'
                className='hidden sm:inline-flex'
                disabled={stage === 'sending' || checkingEligibility || blockers.length > 0 || (!cartId && !order)}
                onClick={() => void startPayment()}
              >
                <Lock aria-hidden className='size-4' />
                {stage === 'sending' ? 'Sending the prompt…' : `Send M-Pesa prompt · ${amountLabel}`}
              </Button>
            </section>
          )}

          {cartQuery.isLoading && !order ? <Skeleton className='h-64 w-full rounded-md' /> : summary}
        </div>
      </div>

      {waiting ? null : (
        <div className='bg-card fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 pt-3 pb-4 shadow-[0_-12px_28px_-18px_rgba(28,31,43,.35)] sm:hidden'>
          <div className='flex flex-col'>
            <span className='text-muted-foreground text-[11px] font-semibold'>Total</span>
            <span className='text-lg font-extrabold tabular-nums'>{amountLabel}</span>
          </div>
          <Button
            size='lg'
            className='flex-1'
            disabled={stage === 'sending' || checkingEligibility || blockers.length > 0 || (!cartId && !order)}
            onClick={() => void startPayment()}
          >
            {stage === 'sending' ? 'Sending…' : 'Send M-Pesa prompt'}
          </Button>
        </div>
      )}
    </main>
  );
}
