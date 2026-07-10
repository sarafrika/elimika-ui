'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Package,
  ShieldCheck,
  Smartphone,
  Wallet,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import type { CartItemResponse } from '@/services/client';
import {
  completeCheckoutMutation,
  getCartOptions,
  getPaymentStatusOptions,
  payWithMpesaMutation,
  selectPaymentSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useCartStore } from '@/store/cart-store';

const DEFAULT_CURRENCY = 'KES';

// How long we wait for the customer to confirm the STK Push before giving up.
const MPESA_POLL_INTERVAL_MS = 4000;
const MPESA_TIMEOUT_MS = 120_000;

const formatMoney = (amount: number | string | undefined, currency = DEFAULT_CURRENCY) => {
  if (amount === undefined || amount === null) return '—';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Normalize a Kenyan mobile number to MSISDN format (`254XXXXXXXXX`).
 * Accepts `07XXXXXXXX`, `01XXXXXXXX`, `+2547…`, `2547…`, and `7XXXXXXXX`.
 * Returns null when the value is not a valid Safaricom/Airtel mobile number.
 */
const normalizeMsisdn = (raw: string): string | null => {
  if (!raw) return null;
  let n = raw.replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (n.startsWith('0')) {
    n = `254${n.slice(1)}`;
  } else if ((n.startsWith('7') || n.startsWith('1')) && n.length === 9) {
    n = `254${n}`;
  }
  return /^254[17]\d{8}$/.test(n) ? n : null;
};

const checkoutFormSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    paymentType: z.enum(['full', 'installments']),
    installmentPlan: z.enum(['3', '6', '12']).optional(),
    paymentProvider: z.string().min(1, 'Please select a payment method'),
    mpesaPhone: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.paymentProvider === 'mpesa' && !normalizeMsisdn(values.mpesaPhone ?? '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mpesaPhone'],
        message: 'Enter a valid M-Pesa number (e.g. 0712 345 678)',
      });
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type InstallmentPlan = {
  months: number;
  label: string;
  description: string;
};

const INSTALLMENT_PLANS: InstallmentPlan[] = [
  { months: 3, label: '3 Months', description: 'Pay over 3 monthly installments' },
  { months: 6, label: '6 Months', description: 'Pay over 6 monthly installments' },
  { months: 12, label: '12 Months', description: 'Pay over 12 monthly installments' },
];

// M-Pesa STK Push lifecycle.
type MpesaStatus = 'idle' | 'initiating' | 'waiting' | 'success' | 'failed' | 'timeout';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartId, clearCart } = useCartStore();
  const profile = useUserProfile();
  const [isProcessing, setIsProcessing] = useState(false);

  // M-Pesa flow state.
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mpesaPhoneDisplay, setMpesaPhoneDisplay] = useState('');
  const [waitStartedAt, setWaitStartedAt] = useState<number | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: profile?.email ?? '',
      paymentType: 'full',
      installmentPlan: '3',
      paymentProvider: 'mpesa', // Default to MPesa
      mpesaPhone: '',
    },
  });

  const watchPaymentType = useWatch({ control: form.control, name: 'paymentType', });
  const watchInstallmentPlan = useWatch({ control: form.control, name: 'installmentPlan', });

  // HeyAPI's path serializer leaves `{cartId}` literal in the URL when path value is null/empty.
  // Use a sentinel string when no cartId; `enabled: false` blocks the actual fetch.
  const cartQuery = useQuery({
    ...getCartOptions({ path: { cartId: cartId ?? 'unset' } }),
    enabled: !!cartId,
    retry: 1,
  });

  const cart = cartQuery.data ?? null;
  const cartItems = cart?.items ?? [];

  const subtotal = useMemo(() => {
    if (!cart?.subtotal) return 0;
    return typeof cart.subtotal === 'string' ? parseFloat(cart.subtotal) : cart.subtotal;
  }, [cart?.subtotal]);

  const tax = useMemo(() => {
    if (!cart?.tax) return 0;
    return typeof cart.tax === 'string' ? parseFloat(cart.tax) : cart.tax;
  }, [cart?.tax]);

  const total = useMemo(() => {
    if (!cart?.total) return 0;
    return typeof cart.total === 'string' ? parseFloat(cart.total) : cart.total;
  }, [cart?.total]);

  const currency = cart?.currency_code ?? DEFAULT_CURRENCY;

  // Calculate installment amounts
  const installmentCalculation = useMemo(() => {
    if (watchPaymentType !== 'installments' || !watchInstallmentPlan) {
      return null;
    }

    const months = parseInt(watchInstallmentPlan);
    const monthlyAmount = total / months;
    const totalWithFees = total * 1.05; // 5% processing fee for installments
    const monthlyAmountWithFees = totalWithFees / months;

    return {
      months,
      monthlyAmount,
      monthlyAmountWithFees,
      totalWithFees,
      processingFee: totalWithFees - total,
    };
  }, [watchPaymentType, watchInstallmentPlan, total]);

  const selectPaymentSession = useMutation(selectPaymentSessionMutation());
  const completeCheckout = useMutation(completeCheckoutMutation());
  const payWithMpesa = useMutation(payWithMpesaMutation());

  const paymentProvider = useWatch({
    control: form.control, name: 'paymentProvider',
  });

  // Poll the payment status while the STK Push is awaiting confirmation.
  const paymentStatusQuery = useQuery({
    ...getPaymentStatusOptions({ path: { orderId: orderId ?? 'unset' } }),
    enabled: mpesaStatus === 'waiting' && !!orderId,
    refetchInterval: mpesaStatus === 'waiting' ? MPESA_POLL_INTERVAL_MS : false,
    gcTime: 0,
    retry: false,
  });

  // Resolve terminal states from the polled status.
  useEffect(() => {
    if (mpesaStatus !== 'waiting') return;
    const status = paymentStatusQuery.data?.status?.toUpperCase();
    if (!status) return;

    if (status === 'SUCCESS' || status === 'CAPTURED') {
      setMpesaStatus('success');
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      setMpesaStatus('failed');
    }
  }, [paymentStatusQuery.data, mpesaStatus]);

  // Give up if the customer never confirms.
  useEffect(() => {
    if (mpesaStatus !== 'waiting') return;
    const timer = setTimeout(() => setMpesaStatus('timeout'), MPESA_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mpesaStatus, waitStartedAt]);

  // Handle a confirmed payment: clear the cart and move to the learner dashboard.
  useEffect(() => {
    if (mpesaStatus !== 'success') return;
    toast.success('Payment received! Your courses are unlocked.');
    clearCart();
    const timer = setTimeout(() => router.push('/dashboard/my-classes'), 1500);
    return () => clearTimeout(timer);
  }, [mpesaStatus, clearCart, router]);

  const startMpesaPayment = async (values: CheckoutFormValues) => {
    if (!cartId) {
      toast.error('No cart found');
      return;
    }

    const phone = normalizeMsisdn(values.mpesaPhone ?? '');
    if (!phone) {
      toast.error('Enter a valid M-Pesa number');
      return;
    }

    setMpesaPhoneDisplay(phone);
    setMpesaStatus('initiating');

    try {
      await selectPaymentSession.mutateAsync({
        path: { cartId },
        body: { provider_id: 'mpesa' },
      });

      const order = await completeCheckout.mutateAsync({
        body: {
          cart_id: cartId,
          customer_email: values.email,
          payment_provider_id: 'mpesa',
        },
      });

      const newOrderId = order?.id;
      if (!newOrderId) {
        throw new Error('Order id missing from checkout response');
      }
      setOrderId(newOrderId);

      await payWithMpesa.mutateAsync({
        path: { orderId: newOrderId },
        body: { phone_number: phone },
      });

      setWaitStartedAt(Date.now());
      setMpesaStatus('waiting');
    } catch (_error) {
      setMpesaStatus('failed');
      toast.error('Could not start the M-Pesa payment. Please try again.');
    }
  };

  const retryMpesaPayment = async () => {
    const values = form.getValues();
    const phone = normalizeMsisdn(values.mpesaPhone ?? '') ?? mpesaPhoneDisplay;

    // If the order already exists, just re-trigger the STK Push on it.
    if (orderId && phone) {
      setMpesaStatus('initiating');
      try {
        await payWithMpesa.mutateAsync({
          path: { orderId },
          body: { phone_number: phone },
        });
        setWaitStartedAt(Date.now());
        setMpesaStatus('waiting');
      } catch (_error) {
        setMpesaStatus('failed');
        toast.error('Could not resend the M-Pesa prompt. Please try again.');
      }
      return;
    }

    await startMpesaPayment(values);
  };

  const cancelMpesaPayment = () => {
    setMpesaStatus('idle');
    setOrderId(null);
    setWaitStartedAt(null);
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!cartId) {
      toast.error('No cart found');
      return;
    }

    // M-Pesa uses its own STK Push + polling lifecycle.
    if (values.paymentProvider === 'mpesa') {
      await startMpesaPayment(values);
      return;
    }

    setIsProcessing(true);

    try {
      // First, select the payment session
      await selectPaymentSession.mutateAsync({
        path: { cartId },
        body: {
          provider_id: values.paymentProvider,
        },
      });

      // Then complete the checkout
      // Note: The backend needs to be updated to support installment_plan and payment_type
      const checkoutData = {
        cart_id: cartId,
        customer_email: values.email,
        payment_provider_id: values.paymentProvider,
        // These fields would need backend support:
        // payment_type: values.paymentType,
        // installment_plan: values.paymentType === 'installments' ? parseInt(values.installmentPlan!) : undefined,
      };

      await completeCheckout.mutateAsync({
        body: checkoutData,
      });

      toast.success('Order placed successfully!');

      // Redirect to order confirmation or courses
      router.push('/dashboard/my-classes');
    } catch (_error) {
      toast.error('Failed to complete checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if no cart. Skip while an M-Pesa payment is in-flight or settled — clearing the cart
  // on success would otherwise bounce the learner to /cart instead of the confirmation screen.
  useEffect(() => {
    if (mpesaStatus !== 'idle') return;
    if (!cartId && !cartQuery.isLoading) {
      router.push('/cart');
    }
  }, [cartId, cartQuery.isLoading, router, mpesaStatus]);

  // M-Pesa status screen (initiating / waiting / success / failed / timeout).
  if (mpesaStatus !== 'idle') {
    return (
      <div className='bg-background min-h-screen'>
        <PublicTopNav />
        <div className='mx-auto flex max-w-md flex-col px-4 py-16 md:py-24'>
          <Card>
            <CardContent className='flex flex-col items-center gap-5 py-10 text-center'>
              {(mpesaStatus === 'initiating' || mpesaStatus === 'waiting') && (
                <>
                  <div className='bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full'>
                    <Smartphone className='text-primary h-8 w-8' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-xl font-bold'>
                      {mpesaStatus === 'initiating'
                        ? 'Sending M-Pesa prompt…'
                        : 'Confirm on your phone'}
                    </h2>
                    <p className='text-muted-foreground text-sm'>
                      {mpesaStatus === 'initiating' ? (
                        'Please wait while we start your payment.'
                      ) : (
                        <>
                          An M-Pesa prompt was sent to{' '}
                          <span className='text-foreground font-semibold'>{mpesaPhoneDisplay}</span>.
                          Enter your PIN to complete payment.
                        </>
                      )}
                    </p>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {mpesaStatus === 'initiating' ? 'Starting…' : 'Waiting for confirmation…'}
                  </div>
                  <p className='text-primary text-lg font-bold'>{formatMoney(total, currency)}</p>
                  {mpesaStatus === 'waiting' && (
                    <Button variant='ghost' size='sm' onClick={cancelMpesaPayment}>
                      Cancel
                    </Button>
                  )}
                </>
              )}

              {mpesaStatus === 'success' && (
                <>
                  <div className='bg-success/10 flex h-16 w-16 items-center justify-center rounded-full'>
                    <CheckCircle2 className='text-success h-8 w-8' />
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-xl font-bold'>Payment received</h2>
                    <p className='text-muted-foreground text-sm'>
                      Thank you! Redirecting you to your classes…
                    </p>
                  </div>
                  <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                </>
              )}

              {(mpesaStatus === 'failed' || mpesaStatus === 'timeout') && (
                <>
                  <div className='bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full'>
                    {mpesaStatus === 'timeout' ? (
                      <Clock className='text-destructive h-8 w-8' />
                    ) : (
                      <XCircle className='text-destructive h-8 w-8' />
                    )}
                  </div>
                  <div className='space-y-2'>
                    <h2 className='text-xl font-bold'>
                      {mpesaStatus === 'timeout' ? 'Payment timed out' : 'Payment not completed'}
                    </h2>
                    <p className='text-muted-foreground text-sm'>
                      {mpesaStatus === 'timeout'
                        ? "We didn't get a confirmation in time. You can send the prompt again."
                        : 'The M-Pesa payment was cancelled or failed. Please try again.'}
                    </p>
                  </div>
                  <div className='flex w-full flex-col gap-2'>
                    <Button
                      onClick={retryMpesaPayment}
                      disabled={payWithMpesa.isPending || completeCheckout.isPending}
                      className='w-full'
                    >
                      Try again
                    </Button>
                    <Button variant='ghost' onClick={cancelMpesaPayment} className='w-full'>
                      Back to checkout
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (cartQuery.isLoading || !cart) {
    return (
      <div className='bg-background min-h-screen'>
        <PublicTopNav />
        <div className='mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12'>
          <Skeleton className='mb-8 h-10 w-48' />
          <div className='grid gap-8 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2'>
              <Skeleton className='h-[400px] w-full' />
            </div>
            <Skeleton className='h-[500px] w-full' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold md:text-3xl'>Checkout</h1>
            <p className='text-muted-foreground mt-1 text-sm'>Complete your purchase</p>
          </div>
          <Link
            href='/cart'
            className='text-primary inline-flex items-center gap-2 text-sm hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to cart
          </Link>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-8 lg:grid-cols-3'>
            {/* Left Column - Checkout Form */}
            <div className='space-y-6 lg:col-span-2'>
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='text-primary h-5 w-5' />
                    Contact Information
                  </CardTitle>
                  <CardDescription>We'll send your receipt and course access here</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address *</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='your.email@example.com'
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className='text-destructive text-sm'>
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Wallet className='text-primary h-5 w-5' />
                    Payment Options
                  </CardTitle>
                  <CardDescription>Choose how you'd like to pay</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <RadioGroup
                    value={watchPaymentType}
                    onValueChange={(value: 'full' | 'installments') =>
                      form.setValue('paymentType', value)
                    }
                    className='space-y-3'
                  >
                    {/* Full Payment Option */}
                    <label
                      className={`hover:border-primary/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all ${watchPaymentType === 'full'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                        }`}
                    >
                      <RadioGroupItem value='full' id='payment-full' className='mt-1' />
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>Pay in Full</span>
                          <Badge variant='secondary'>Recommended</Badge>
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Pay the full amount now and get instant access
                        </p>
                        <p className='text-primary text-xl font-bold'>
                          {formatMoney(total, currency)}
                        </p>
                      </div>
                    </label>

                    {/* Installments Option */}
                    <label
                      className={`hover:border-primary/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all ${watchPaymentType === 'installments'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                        }`}
                    >
                      <RadioGroupItem
                        value='installments'
                        id='payment-installments'
                        className='mt-1'
                      />
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>Pay in Installments</span>
                          <Badge variant='outline'>Flexible</Badge>
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Spread the cost over multiple months
                        </p>
                        {installmentCalculation && (
                          <p className='text-primary text-lg font-bold'>
                            {formatMoney(installmentCalculation.monthlyAmountWithFees, currency)}
                            /month
                          </p>
                        )}
                      </div>
                    </label>
                  </RadioGroup>

                  {/* Installment Plan Selection */}
                  {watchPaymentType === 'installments' && (
                    <div className='border-border bg-muted/30 space-y-3 rounded-lg border p-4'>
                      <Label className='flex items-center gap-2'>
                        <CalendarDays className='text-primary h-4 w-4' />
                        Select Installment Period
                      </Label>
                      <RadioGroup
                        value={watchInstallmentPlan}
                        onValueChange={(value: '3' | '6' | '12') =>
                          form.setValue('installmentPlan', value)
                        }
                        className='space-y-2'
                      >
                        {INSTALLMENT_PLANS.map(plan => {
                          const monthlyAmount = total / plan.months;
                          const monthlyWithFees = (total * 1.05) / plan.months;

                          return (
                            <label
                              key={plan.months}
                              className={`hover:border-primary/50 flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3 transition-all ${watchInstallmentPlan === String(plan.months)
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                                }`}
                            >
                              <div className='flex items-center gap-3'>
                                <RadioGroupItem
                                  value={String(plan.months)}
                                  id={`plan-${plan.months}`}
                                />
                                <div>
                                  <p className='font-medium'>{plan.label}</p>
                                  <p className='text-muted-foreground text-xs'>
                                    {plan.description}
                                  </p>
                                </div>
                              </div>
                              <div className='text-right'>
                                <p className='text-primary font-bold'>
                                  {formatMoney(monthlyWithFees, currency)}
                                </p>
                                <p className='text-muted-foreground text-xs'>per month</p>
                              </div>
                            </label>
                          );
                        })}
                      </RadioGroup>

                      {installmentCalculation && (
                        <div className='bg-primary/5 mt-4 space-y-2 rounded-md p-3 text-sm'>
                          <p className='flex justify-between'>
                            <span className='text-muted-foreground'>Processing fee (5%):</span>
                            <span className='font-medium'>
                              {formatMoney(installmentCalculation.processingFee, currency)}
                            </span>
                          </p>
                          <p className='flex justify-between'>
                            <span className='text-muted-foreground'>Total with fees:</span>
                            <span className='font-semibold'>
                              {formatMoney(installmentCalculation.totalWithFees, currency)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentProvider}
                    onValueChange={value =>
                      form.setValue('paymentProvider', value, { shouldValidate: true })
                    }
                    className='space-y-3'
                  >
                    <label
                      className={`hover:border-primary/50 flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all ${paymentProvider === 'mpesa'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                        }`}
                    >
                      <RadioGroupItem value='mpesa' id='mpesa' />
                      <div className='flex items-center gap-3'>
                        <img
                          src='/logos/payment/mpesa-logo.svg'
                          alt='M-Pesa'
                          className='h-10 w-auto'
                        />
                        <div>
                          <p className='font-semibold'>M-Pesa</p>
                          <p className='text-muted-foreground text-sm'>
                            Pay with mobile money
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* M-Pesa phone number */}
                    {paymentProvider === 'mpesa' && (
                      <div className='border-border bg-muted/30 space-y-2 rounded-lg border p-4'>
                        <Label htmlFor='mpesaPhone' className='flex items-center gap-2'>
                          <Smartphone className='text-primary h-4 w-4' />
                          M-Pesa Phone Number *
                        </Label>
                        <Input
                          id='mpesaPhone'
                          type='tel'
                          inputMode='tel'
                          autoComplete='tel'
                          placeholder='0712 345 678'
                          {...form.register('mpesaPhone')}
                        />
                        <p className='text-muted-foreground text-xs'>
                          You'll get a prompt on this number to enter your M-Pesa PIN.
                        </p>
                        {form.formState.errors.mpesaPhone && (
                          <p className='text-destructive text-sm'>
                            {form.formState.errors.mpesaPhone.message}
                          </p>
                        )}
                      </div>
                    )}

                    <label
                      className={`hover:border-primary/50 flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all ${paymentProvider === 'card'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                        }`}
                    >
                      <RadioGroupItem value='card' id='card' />
                      <div className='flex items-center gap-3'>
                        <CreditCard className='text-primary h-10 w-10' />
                        <div>
                          <p className='font-semibold'>Credit/Debit Card</p>
                          <p className='text-muted-foreground text-sm'>
                            Visa, Mastercard accepted
                          </p>
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className='lg:col-span-1'>
              <Card className='sticky top-24'>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Cart Items */}
                  <div className='space-y-3'>
                    {cartItems.map((item: CartItemResponse) => (
                      <div key={item.id} className='flex gap-3'>
                        <div className='bg-muted relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
                          <Package className='text-muted-foreground h-6 w-6' />
                        </div>
                        <div className='flex-1 space-y-1'>
                          <p className='text-sm font-medium'>{item.title}</p>
                          <p className='text-primary text-sm font-semibold'>
                            {formatMoney(item.total ?? item.subtotal, currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Subtotal</span>
                      <span className='font-medium'>{formatMoney(subtotal, currency)}</span>
                    </div>
                    {tax > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Tax</span>
                        <span className='font-medium'>{formatMoney(tax, currency)}</span>
                      </div>
                    )}
                    {installmentCalculation && (
                      <div className='flex justify-between text-orange-600'>
                        <span>Processing fee (5%)</span>
                        <span className='font-medium'>
                          {formatMoney(installmentCalculation.processingFee, currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-lg font-bold'>
                      <span>Total</span>
                      <span className='text-primary'>
                        {formatMoney(
                          installmentCalculation ? installmentCalculation.totalWithFees : total,
                          currency
                        )}
                      </span>
                    </div>

                    {watchPaymentType === 'installments' && installmentCalculation && (
                      <div className='bg-primary/10 rounded-lg p-3 text-center'>
                        <p className='text-muted-foreground text-xs'>Monthly Payment</p>
                        <p className='text-primary text-xl font-bold'>
                          {formatMoney(installmentCalculation.monthlyAmountWithFees, currency)}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          for {installmentCalculation.months} months
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type='submit'
                    size='lg'
                    className='w-full'
                    disabled={isProcessing || !form.formState.isValid}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Processing...
                      </>
                    ) : paymentProvider === 'mpesa' ? (
                      <>
                        <Smartphone className='mr-2 h-4 w-4' />
                        Pay with M-Pesa
                      </>
                    ) : (
                      <>
                        Complete Purchase
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </>
                    )}
                  </Button>

                  {/* Trust Badges */}
                  <div className='space-y-2 pt-4'>
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <ShieldCheck className='text-primary h-4 w-4' />
                      <span>Secure payment processing</span>
                    </div>
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <Package className='text-primary h-4 w-4' />
                      <span>Instant course access after payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
