'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicTopNav } from '@/components/PublicTopNav';
import { useCartStore } from '@/store/cart-store';
import {
  getCartOptions,
  updateCartMutation,
  addItemMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CartItemResponse } from '@/services/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Package,
  ShieldCheck,
  CreditCard,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';

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

export default function CartPage() {
  const { cartId } = useCartStore();
  const queryClient = useQueryClient();

  // Fetch cart data
  const cartQuery = useQuery({
    ...getCartOptions({
      path: { cartId: cartId ?? '' },
    }),
    enabled: !!cartId,
    retry: 1,
  });

  const cart = useMemo(() => cartQuery.data?.data, [cartQuery.data]);
  const cartItems = useMemo(() => cart?.items ?? [], [cart?.items]);
  const isEmpty = cartItems.length === 0;

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

  // Loading state
  if (cartQuery.isLoading && cartId) {
    return (
      <div className='min-h-screen bg-background text-foreground'>
        <PublicTopNav />
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
          <div className='space-y-4'>
            <Skeleton className='h-10 w-48' />
            <Skeleton className='h-6 w-64' />
          </div>
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='space-y-4 lg:col-span-2'>
              <Skeleton className='h-[400px] w-full rounded-[28px]' />
            </div>
            <Skeleton className='h-[500px] w-full rounded-[28px]' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <h1 className='text-3xl font-semibold text-slate-900 dark:text-blue-50 sm:text-4xl'>
              Shopping Cart
            </h1>
            <p className='text-sm text-slate-600 dark:text-slate-200'>
              {isEmpty ? 'Your cart is empty' : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
            </p>
          </div>
          <Link
            href='/courses'
            className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Continue shopping
          </Link>
        </div>

        {isEmpty ? (
          /* Empty Cart State */
          <Card className='border-blue-200/60 bg-card/80'>
            <CardHeader className='space-y-4 text-center'>
              <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40'>
                <ShoppingCart className='h-10 w-10 text-primary' />
              </div>
              <CardTitle className='text-2xl text-foreground'>Your cart is empty</CardTitle>
              <CardDescription className='text-base text-muted-foreground'>
                Looks like you haven't added any courses yet. Start exploring our catalogue to find
                courses that match your goals.
              </CardDescription>
              <Link href='/courses' className='inline-block pt-4'>
                <Button
                  size='lg'
                  className='rounded-full bg-primary px-8 shadow-lg shadow-blue-200/40 transition hover:bg-primary/90 hover:shadow-xl dark:shadow-blue-900/20'
                >
                  Browse Courses
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
            </CardHeader>
          </Card>
        ) : (
          /* Cart with Items */
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Cart Items - Left Column */}
            <div className='space-y-4 lg:col-span-2'>
              <Card className='rounded-[28px] border-blue-200/60 bg-white/90 shadow-lg shadow-blue-200/30 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-xl text-slate-900 dark:text-blue-50'>
                    <Package className='h-5 w-5 text-primary' />
                    Cart Items
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <CartItem item={item} />
                      {index < cartItems.length - 1 && (
                        <Separator className='mt-4 bg-blue-200/40 dark:bg-blue-500/25' />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className='grid gap-4 sm:grid-cols-3'>
                <TrustBadge
                  icon={ShieldCheck}
                  title='Secure Payment'
                  description='Your payment is protected'
                />
                <TrustBadge
                  icon={CreditCard}
                  title='MPesa Accepted'
                  description='Pay with mobile money'
                />
                <TrustBadge
                  icon={Package}
                  title='Instant Access'
                  description='Start learning right away'
                />
              </div>
            </div>

            {/* Order Summary - Right Column */}
            <div className='lg:col-span-1'>
              <Card className='sticky top-24 rounded-[28px] border-blue-200/60 bg-white/90 shadow-xl shadow-blue-200/40 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'>
                <CardHeader>
                  <CardTitle className='text-xl text-slate-900 dark:text-blue-50'>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-slate-600 dark:text-slate-300'>
                        Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                      </span>
                      <span className='font-semibold text-slate-900 dark:text-blue-50'>
                        {formatMoney(subtotal)}
                      </span>
                    </div>
                    {tax > 0 && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-slate-600 dark:text-slate-300'>Tax</span>
                        <span className='font-semibold text-slate-900 dark:text-blue-50'>
                          {formatMoney(tax)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className='bg-blue-200/40 dark:bg-blue-500/25' />

                  <div className='flex items-center justify-between'>
                    <span className='text-lg font-semibold text-slate-900 dark:text-blue-50'>
                      Total
                    </span>
                    <span className='text-2xl font-bold text-primary'>{formatMoney(total)}</span>
                  </div>

                  <div className='space-y-3 pt-4'>
                    <Button
                      size='lg'
                      className='w-full rounded-full bg-primary text-base font-semibold shadow-lg shadow-blue-200/40 transition hover:bg-primary/90 hover:shadow-xl dark:shadow-blue-900/20'
                    >
                      Proceed to Checkout
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='lg'
                      className='w-full rounded-full border-blue-200 text-base font-medium dark:border-blue-500/40'
                      asChild
                    >
                      <Link href='/courses'>Continue Shopping</Link>
                    </Button>
                  </div>

                  <div className='space-y-2 pt-4'>
                    <div className='flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300'>
                      <ShieldCheck className='h-4 w-4 shrink-0 text-primary' />
                      <span>Secure checkout powered by MPesa</span>
                    </div>
                    <div className='flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300'>
                      <Package className='h-4 w-4 shrink-0 text-primary' />
                      <span>Instant course access after payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CartItem({ item }: { item: CartItemResponse }) {
  const title = item.title ?? item.variant_title ?? 'Course';
  const quantity = item.quantity ?? 1;
  const unitPrice = useMemo(() => {
    const price = item.unit_price ?? item.subtotal;
    if (!price) return 0;
    return typeof price === 'string' ? parseFloat(price) : price;
  }, [item.unit_price, item.subtotal]);

  const itemTotal = useMemo(() => {
    const total = item.total ?? item.subtotal;
    if (!total) return 0;
    return typeof total === 'string' ? parseFloat(total) : total;
  }, [item.total, item.subtotal]);

  return (
    <div className='flex gap-4'>
      {/* Course Image */}
      <div className='relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-900/40'>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={title} className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <Package className='h-8 w-8 text-primary' />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className='flex flex-1 flex-col justify-between'>
        <div className='space-y-1'>
          <h3 className='font-semibold text-slate-900 dark:text-blue-50'>{title}</h3>
          {item.description && (
            <p className='line-clamp-1 text-sm text-slate-600 dark:text-slate-200'>
              {item.description}
            </p>
          )}
          {item.variant_sku && (
            <p className='text-xs text-slate-500 dark:text-slate-400'>SKU: {item.variant_sku}</p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          {/* Quantity Display (read-only for now) */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-slate-600 dark:text-slate-300'>Qty: {quantity}</span>
          </div>

          {/* Price and Remove */}
          <div className='flex items-center gap-4'>
            <span className='text-lg font-bold text-slate-900 dark:text-blue-50'>
              {formatMoney(itemTotal)}
            </span>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive'
              disabled
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className='flex flex-col items-center gap-2 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 text-center dark:border-blue-500/25 dark:bg-blue-900/20'>
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
        <Icon className='h-5 w-5 text-primary' />
      </div>
      <div className='space-y-0.5'>
        <p className='text-xs font-semibold text-slate-900 dark:text-blue-50'>{title}</p>
        <p className='text-xs text-slate-600 dark:text-slate-300'>{description}</p>
      </div>
    </div>
  );
}
