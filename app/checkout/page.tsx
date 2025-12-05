'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Calendar,
  Check,
  ShieldCheck,
  Package,
  Loader2,
  Wallet,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cart-store';
import { useUserProfile } from '@/context/profile-context';
import {
  getCartOptions,
  completeCheckoutMutation,
  selectPaymentSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CartItemResponse } from '@/services/client';

const DEFAULT_CURRENCY = 'KES';

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

const checkoutFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  paymentType: z.enum(['full', 'installments']),
  installmentPlan: z.enum(['3', '6', '12']).optional(),
  paymentProvider: z.string().min(1, 'Please select a payment method'),
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

export default function CheckoutPage() {
  const router = useRouter();
  const { cartId } = useCartStore();
  const profile = useUserProfile();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: profile?.email ?? '',
      paymentType: 'full',
      installmentPlan: '3',
      paymentProvider: 'mpesa', // Default to MPesa
    },
  });

  const watchPaymentType = form.watch('paymentType');
  const watchInstallmentPlan = form.watch('installmentPlan');

  // Fetch cart data
  const cartQuery = useQuery({
    ...getCartOptions({
      path: { cartId: cartId ?? '' },
    }),
    enabled: !!cartId,
    retry: 1,
  });

  const cart = cartQuery.data?.data;
  const cartItems = cart?.items ?? [];

  const subtotal = useMemo(() => {
    if (!cart?.subtotal) return 0;
    return typeof cart.subtotal === 'string' ? parseFloat(cart.subtotal) : cart.subtotal;
  }, [cart?.subtotal]);

  const tax = useMemo(() => {
    if (!cart?.tax_total) return 0;
    return typeof cart.tax_total === 'string' ? parseFloat(cart.tax_total) : cart.tax_total;
  }, [cart?.tax_total]);

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

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!cartId) {
      toast.error('No cart found');
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

      const result = await completeCheckout.mutateAsync({
        body: checkoutData,
      });

      toast.success('Order placed successfully!');

      // Redirect to order confirmation or courses
      router.push('/dashboard/my-classes');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to complete checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if no cart
  useEffect(() => {
    if (!cartId && !cartQuery.isLoading) {
      router.push('/cart');
    }
  }, [cartId, cartQuery.isLoading, router]);

  // Loading state
  if (cartQuery.isLoading || !cart) {
    return (
      <div className='min-h-screen bg-background'>
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
    <div className='min-h-screen bg-background'>
      <PublicTopNav />
      <div className='mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold md:text-3xl'>Checkout</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Complete your purchase</p>
          </div>
          <Link href='/cart' className='inline-flex items-center gap-2 text-sm text-primary hover:underline'>
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
                    <CreditCard className='h-5 w-5 text-primary' />
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
                      <p className='text-sm text-destructive'>{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Wallet className='h-5 w-5 text-primary' />
                    Payment Options
                  </CardTitle>
                  <CardDescription>Choose how you'd like to pay</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <RadioGroup
                    value={watchPaymentType}
                    onValueChange={(value: 'full' | 'installments') => form.setValue('paymentType', value)}
                    className='space-y-3'
                  >
                    {/* Full Payment Option */}
                    <label
                      className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        watchPaymentType === 'full' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value='full' id='payment-full' className='mt-1' />
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>Pay in Full</span>
                          <Badge variant='secondary'>Recommended</Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Pay the full amount now and get instant access
                        </p>
                        <p className='text-xl font-bold text-primary'>{formatMoney(total, currency)}</p>
                      </div>
                    </label>

                    {/* Installments Option */}
                    <label
                      className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        watchPaymentType === 'installments' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value='installments' id='payment-installments' className='mt-1' />
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>Pay in Installments</span>
                          <Badge variant='outline'>Flexible</Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Spread the cost over multiple months
                        </p>
                        {installmentCalculation && (
                          <p className='text-lg font-bold text-primary'>
                            {formatMoney(installmentCalculation.monthlyAmountWithFees, currency)}/month
                          </p>
                        )}
                      </div>
                    </label>
                  </RadioGroup>

                  {/* Installment Plan Selection */}
                  {watchPaymentType === 'installments' && (
                    <div className='space-y-3 rounded-lg border border-border bg-muted/30 p-4'>
                      <Label className='flex items-center gap-2'>
                        <CalendarDays className='h-4 w-4 text-primary' />
                        Select Installment Period
                      </Label>
                      <RadioGroup
                        value={watchInstallmentPlan}
                        onValueChange={(value: '3' | '6' | '12') => form.setValue('installmentPlan', value)}
                        className='space-y-2'
                      >
                        {INSTALLMENT_PLANS.map(plan => {
                          const monthlyAmount = total / plan.months;
                          const monthlyWithFees = (total * 1.05) / plan.months;

                          return (
                            <label
                              key={plan.months}
                              className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3 transition-all hover:border-primary/50 ${
                                watchInstallmentPlan === String(plan.months)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              }`}
                            >
                              <div className='flex items-center gap-3'>
                                <RadioGroupItem value={String(plan.months)} id={`plan-${plan.months}`} />
                                <div>
                                  <p className='font-medium'>{plan.label}</p>
                                  <p className='text-xs text-muted-foreground'>{plan.description}</p>
                                </div>
                              </div>
                              <div className='text-right'>
                                <p className='font-bold text-primary'>{formatMoney(monthlyWithFees, currency)}</p>
                                <p className='text-xs text-muted-foreground'>per month</p>
                              </div>
                            </label>
                          );
                        })}
                      </RadioGroup>

                      {installmentCalculation && (
                        <div className='mt-4 space-y-2 rounded-md bg-primary/5 p-3 text-sm'>
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
                    value={form.watch('paymentProvider')}
                    onValueChange={value => form.setValue('paymentProvider', value)}
                    className='space-y-3'
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        form.watch('paymentProvider') === 'mpesa'
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
                          <p className='text-sm text-muted-foreground'>Pay with mobile money</p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        form.watch('paymentProvider') === 'card'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value='card' id='card' />
                      <div className='flex items-center gap-3'>
                        <CreditCard className='h-10 w-10 text-primary' />
                        <div>
                          <p className='font-semibold'>Credit/Debit Card</p>
                          <p className='text-sm text-muted-foreground'>Visa, Mastercard accepted</p>
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
                        <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted'>
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title ?? ''} className='h-full w-full object-cover' />
                          ) : (
                            <div className='flex h-full items-center justify-center'>
                              <Package className='h-6 w-6 text-muted-foreground' />
                            </div>
                          )}
                        </div>
                        <div className='flex-1 space-y-1'>
                          <p className='text-sm font-medium'>{item.title}</p>
                          <p className='text-sm font-semibold text-primary'>
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
                      <div className='rounded-lg bg-primary/10 p-3 text-center'>
                        <p className='text-xs text-muted-foreground'>Monthly Payment</p>
                        <p className='text-xl font-bold text-primary'>
                          {formatMoney(installmentCalculation.monthlyAmountWithFees, currency)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
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
                    ) : (
                      <>
                        Complete Purchase
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </>
                    )}
                  </Button>

                  {/* Trust Badges */}
                  <div className='space-y-2 pt-4'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <ShieldCheck className='h-4 w-4 text-primary' />
                      <span>Secure payment processing</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Package className='h-4 w-4 text-primary' />
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
