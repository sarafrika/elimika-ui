'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { CartItemResponse } from '@/services/client';
import {
  getCartOptions,
  getCartQueryKey,
  removeItemMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useCartStore } from '@/store/cart-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Package,
  ShieldCheck,
  ShoppingCart,
  Trash2,
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
  const removeItemMut = useMutation(removeItemMutation());

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
      <div className='bg-background text-foreground min-h-screen'>
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
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <h1 className='text-foreground text-3xl font-semibold sm:text-4xl'>Shopping Cart</h1>
            <p className='text-muted-foreground text-sm'>
              {isEmpty
                ? 'Your cart is empty'
                : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
            </p>
          </div>
          <Link
            href='/courses'
            className='text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Continue shopping
          </Link>
        </div>

        {isEmpty ? (
          /* Empty Cart State */
          <Card className='border-border bg-card/80'>
            <CardHeader className='space-y-4 text-center'>
              <div className='bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full'>
                <ShoppingCart className='text-primary h-10 w-10' />
              </div>
              <CardTitle className='text-foreground text-2xl'>Your cart is empty</CardTitle>
              <CardDescription className='text-muted-foreground text-base'>
                Looks like you haven't added any courses yet. Start exploring our catalogue to find
                courses that match your goals.
              </CardDescription>
              <Link href='/courses' className='inline-block pt-4'>
                <Button
                  size='lg'
                  className='bg-primary hover:bg-primary/90 rounded-full px-8 shadow-lg transition'
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
              <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2 text-xl'>
                    <Package className='text-primary h-5 w-5' />
                    Cart Items
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <CartItem
                        item={item}
                        handleRemoveItem={id => {
                          removeItemMut.mutate(
                            {
                              path: { cartId: cartId as string, itemId: id },
                            },
                            {
                              onSuccess: data => {
                                queryClient.invalidateQueries({
                                  queryKey: getCartQueryKey({ path: { cartId: cartId as string } }),
                                });
                                toast.success('Cart Item removed successfully');
                              },
                            }
                          );
                        }}
                      />
                      {index < cartItems.length - 1 && <Separator className='bg-border mt-4' />}
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
              <Card className='border-border bg-card sticky top-24 rounded-[28px] border shadow-xl'>
                <CardHeader>
                  <CardTitle className='text-foreground text-xl'>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                      </span>
                      <span className='text-foreground font-semibold'>{formatMoney(subtotal)}</span>
                    </div>
                    {tax > 0 && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Tax</span>
                        <span className='text-foreground font-semibold'>{formatMoney(tax)}</span>
                      </div>
                    )}
                  </div>

                  <Separator className='bg-border' />

                  <div className='flex items-center justify-between'>
                    <span className='text-foreground text-lg font-semibold'>Total</span>
                    <span className='text-primary text-2xl font-bold'>{formatMoney(total)}</span>
                  </div>

                  <div className='space-y-3 pt-4'>
                    <Button
                      size='lg'
                      className='bg-primary hover:bg-primary/90 w-full rounded-full text-base font-semibold shadow-lg transition'
                      asChild
                    >
                      <Link href='/checkout'>
                        Proceed to Checkout
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Link>
                    </Button>
                    <Button
                      variant='outline'
                      size='lg'
                      className='w-full rounded-full text-base font-medium'
                      asChild
                    >
                      <Link href='/courses'>Continue Shopping</Link>
                    </Button>
                  </div>

                  <div className='space-y-2 pt-4'>
                    <div className='text-muted-foreground flex items-start gap-2 text-xs'>
                      <ShieldCheck className='text-primary h-4 w-4 shrink-0' />
                      <span>Secure checkout powered by MPesa</span>
                    </div>
                    <div className='text-muted-foreground flex items-start gap-2 text-xs'>
                      <Package className='text-primary h-4 w-4 shrink-0' />
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

function CartItem({
  item,
  handleRemoveItem,
}: {
  item: CartItemResponse;
  handleRemoveItem: (id: string) => void;
}) {
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
      <div className='bg-muted relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl'>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={title} className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <Package className='text-primary h-8 w-8' />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className='flex flex-1 flex-col justify-between'>
        <div className='space-y-1'>
          <h3 className='text-foreground font-semibold'>{title}</h3>
          {item.description && (
            <p className='text-muted-foreground line-clamp-1 text-sm'>{item.description}</p>
          )}
          {item.variant_sku && (
            <p className='text-muted-foreground text-xs'>SKU: {item.variant_sku}</p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          {/* Quantity Display (read-only for now) */}
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Qty: {quantity}</span>
          </div>

          {/* Price and Remove */}
          <div className='flex items-center gap-4'>
            <span className='text-foreground text-lg font-bold'>{formatMoney(itemTotal)}</span>
            <Button
              onClick={() => handleRemoveItem(item?.id as string)}
              variant='ghost'
              size='icon'
              className='text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8'
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
    <div className='border-border bg-muted/50 flex flex-col items-center gap-2 rounded-2xl border p-4 text-center'>
      <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
        <Icon className='text-primary h-5 w-5' />
      </div>
      <div className='space-y-0.5'>
        <p className='text-foreground text-xs font-semibold'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
}
