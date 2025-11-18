'use client';

import LoginButton from '@/components/LoginButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicTopNav } from '@/components/PublicTopNav';
import { useUserProfile } from '@/context/profile-context';
import {
  addItemMutation,
  completeCheckoutMutation,
  createCartMutation,
  enrollStudentMutation,
  getAllActiveClassDefinitionsOptions,
  getCartOptions,
  getCartQueryKey,
  selectPaymentSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  type CartItemResponse,
  type CartResponse,
  type ClassDefinition,
  type OrderResponse,
  getByClass,
} from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Clock, CreditCard, MapPin, ShieldCheck, ShoppingCart, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const CART_STORAGE_KEY = 'elimika:commerce:cart-id';
const SUCCESS_PAYMENT_STATES = new Set(['PAID', 'CAPTURED', 'AUTHORIZED', 'PARTIALLY_CAPTURED']);
const DEFAULT_PAYMENT_PROVIDER = 'mpesa';
const DEFAULT_CURRENCY = 'KES';
const DEFAULT_REGION = 'KE';

type CartEnrollmentMeta = {
  class_definition_uuid?: string;
  course_uuid?: string;
  student_uuid?: string;
};

const formatMoney = (amount?: number | string, currency = DEFAULT_CURRENCY) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

const formatSchedule = (start?: Date, end?: Date) => {
  if (!start || !end) return 'Schedule to be confirmed';
  const day = new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start);
  const startTime = new Intl.DateTimeFormat('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(start);
  const endTime = new Intl.DateTimeFormat('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(end);
  return `${day} · ${startTime} – ${endTime}`;
};

const extractMetadataValue = (metadata: CartItemResponse['metadata'], key: string) => {
  if (!metadata) return undefined;
  const candidate = (metadata as Record<string, unknown>)[key];
  if (candidate === undefined || candidate === null) return undefined;
  if (typeof candidate === 'string') return candidate;
  if (typeof candidate === 'object' && 'value' in (candidate as Record<string, unknown>)) {
    const value = (candidate as Record<string, unknown>).value;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

export default function ClassesCataloguePage() {
  const { data: session, status } = useSession();
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;
  const customerEmail = profile?.email ?? session?.user?.email ?? '';

  const qc = useQueryClient();
  const [cartId, setCartId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [variantCache, setVariantCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedId = window.localStorage.getItem(CART_STORAGE_KEY);
    if (storedId) {
      setCartId(storedId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (cartId) {
      window.localStorage.setItem(CART_STORAGE_KEY, cartId);
    } else {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cartId]);

  const classesQuery = useQuery({
    ...getAllActiveClassDefinitionsOptions(),
    retry: 1,
  });
  const classes = useMemo(() => classesQuery.data?.data ?? [], [classesQuery.data]);

  const cartQuery = useQuery({
    ...getCartOptions({ path: { cartId: cartId ?? '' } }),
    enabled: !!cartId,
  });

  const createCart = useMutation(createCartMutation());
  const addItem = useMutation(addItemMutation());
  const selectPaymentProvider = useMutation(selectPaymentSessionMutation());
  const checkout = useMutation(completeCheckoutMutation());
  const enrollStudent = useMutation(enrollStudentMutation());

  const ensureCartId = async () => {
    if (cartId) return cartId;
    const response = await createCart.mutateAsync({
      body: {
        currency_code: DEFAULT_CURRENCY,
        region_code: DEFAULT_REGION,
        items: [],
      },
    });
    const newId = (response as CartResponse)?.id ?? (response as any)?.data?.id;
    if (!newId) throw new Error('Unable to create a cart. Please try again.');
    setCartId(newId);
    return newId;
  };

  const fetchVariantId = async (classUuid: string) => {
    if (variantCache[classUuid]) return variantCache[classUuid];
    const response = await getByClass({ path: { classUuid }, throwOnError: true });
    const catalog = (response as any)?.data ?? (response as unknown as { data?: unknown })?.data;
    const variantId =
      (catalog as any)?.medusa_variant_id ?? (catalog as any)?.data?.medusa_variant_id;
    if (!variantId) {
      throw new Error('This class is missing a checkout variant. Please try another class.');
    }
    setVariantCache(prev => ({ ...prev, [classUuid]: variantId }));
    return variantId;
  };

  const handleAddToCart = async (classDef: ClassDefinition) => {
    if (!classDef.uuid) {
      toast.error('Missing class reference. Please refresh and try again.');
      return;
    }
    if (!studentUuid) {
      toast.error('Sign in as a student to add this class to your cart.');
      return;
    }
    try {
      setAddingId(classDef.uuid);
      const variantId = await fetchVariantId(classDef.uuid);
      const activeCartId = await ensureCartId();
      await addItem.mutateAsync({
        path: { cartId: activeCartId },
        body: {
          variant_id: variantId,
          quantity: 1,
          metadata: {
            course_uuid: classDef.course_uuid,
            class_definition_uuid: classDef.uuid,
            student_uuid: studentUuid,
          } as Record<string, Record<string, unknown>>,
        },
      });
      await cartQuery.refetch();
      toast.success('Class added to cart');
    } catch (error) {
      const message = (error as any)?.message ?? 'Unable to add class to cart right now.';
      toast.error(message);
    } finally {
      setAddingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!cartId) {
      toast.message('Add at least one class before starting checkout.');
      return;
    }
    if (!customerEmail || status !== 'authenticated') {
      toast.error('Sign in to complete checkout.');
      return;
    }
    try {
      toast.message('Preparing payment session…');
      await selectPaymentProvider.mutateAsync({
        path: { cartId },
        body: { provider_id: DEFAULT_PAYMENT_PROVIDER },
      });

      const order = await checkout.mutateAsync({
        body: {
          cart_id: cartId,
          customer_email: customerEmail,
          payment_provider_id: DEFAULT_PAYMENT_PROVIDER,
        },
      });
      setLastOrder(order);

      const paymentStatus = order?.payment_status?.toUpperCase?.() ?? '';
      if (!SUCCESS_PAYMENT_STATES.has(paymentStatus)) {
        toast.message('Checkout submitted. Waiting for payment confirmation…');
        return;
      }

      const itemsToEnroll =
        order?.items?.map(item => {
          const meta = item.metadata as CartEnrollmentMeta | undefined;
          return {
            class_definition_uuid: extractMetadataValue(item.metadata, 'class_definition_uuid') ?? meta?.class_definition_uuid,
            student_uuid:
              extractMetadataValue(item.metadata, 'student_uuid') ??
              meta?.student_uuid ??
              studentUuid,
          };
        }) ?? [];

      if (itemsToEnroll.length === 0) {
        toast.success('Payment captured. Enrollment is not required for these items.');
        return;
      }

      const enrollmentResults = await Promise.all(
        itemsToEnroll.map(async payload => {
          if (!payload?.class_definition_uuid || !payload?.student_uuid) {
            return { status: 'skipped', class_definition_uuid: payload?.class_definition_uuid };
          }
          try {
            await enrollStudent.mutateAsync({ body: payload });
            return { status: 'success', class_definition_uuid: payload.class_definition_uuid };
          } catch (err) {
            const statusCode = (err as any)?.status ?? (err as any)?.response?.status;
            return {
              status: statusCode === 402 ? 'payment_required' : 'error',
              class_definition_uuid: payload.class_definition_uuid,
              message:
                (err as any)?.body?.message ??
                (err as any)?.message ??
                'Enrollment could not be completed.',
            };
          }
        })
      );

      const failures = enrollmentResults.filter(result => result.status !== 'success');
      if (failures.length === 0) {
        toast.success('Payment and enrollment confirmed.');
      } else {
        const first = failures[0];
        toast.warning(
          first.status === 'payment_required'
            ? 'Payment confirmed, but enrollment is blocked until the paywall validates the order.'
            : first.message ?? 'Enrollment could not be completed.'
        );
      }
    } catch (error) {
      const message =
        (error as any)?.body?.message ??
        (error as any)?.message ??
        'Unable to complete checkout right now.';
      toast.error(message);
    }
  };

  const handleResetCart = async () => {
    setCartId(null);
    setLastOrder(null);
    await qc.removeQueries({ queryKey: getCartQueryKey({ path: { cartId: cartId ?? '' } }) });
  };

  const isCheckoutBusy =
    selectPaymentProvider.isPending || checkout.isPending || enrollStudent.isPending;

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        <header className='space-y-4'>
          <div className='inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary shadow-sm'>
            Classes catalogue
          </div>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div className='space-y-3'>
              <h1 className='text-3xl font-semibold sm:text-4xl'>Enroll in public classes</h1>
              <p className='max-w-3xl text-base text-muted-foreground'>
                Browse open classes, add seats to your cart, and complete checkout with MPesa.
                Enrollment is confirmed automatically after payment clears.
              </p>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline' className='gap-1'>
                  <ShoppingCart className='h-4 w-4' />
                  Cart persists on this device
                </Badge>
                <Badge variant='outline' className='gap-1'>
                  <ShieldCheck className='h-4 w-4' />
                  Login required at checkout
                </Badge>
              </div>
            </div>
            {status !== 'authenticated' && (
              <div className='flex items-center gap-3'>
                <CircleAlert className='h-4 w-4 text-primary' />
                <div className='text-sm text-muted-foreground'>
                  You will need to sign in to pay and enroll.
                </div>
                <LoginButton />
              </div>
            )}
          </div>
        </header>

        <div className='grid gap-6 lg:grid-cols-[1.65fr_1fr]'>
          <section className='space-y-4'>
            {classesQuery.isLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3].map(idx => (
                  <Skeleton key={idx} className='h-[160px] w-full rounded-2xl' />
                ))}
              </div>
            ) : classesQuery.error ? (
              <Card className='border-destructive/40 bg-destructive/5'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-destructive'>
                    <CircleAlert className='h-4 w-4' />
                    Unable to load classes
                  </CardTitle>
                  <CardDescription className='text-muted-foreground'>
                    Please sign in and try again. If the issue persists, contact support.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : classes.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No public classes are available yet</CardTitle>
                  <CardDescription>
                    Check back soon for new sessions or reach out to your instructor.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                {classes.map(classDef => (
                  <ClassCard
                    key={classDef.uuid}
                    classDef={classDef}
                    onAddToCart={() => handleAddToCart(classDef)}
                    isAdding={addingId === classDef.uuid}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className='space-y-4'>
            <Card className='sticky top-8'>
              <CardHeader className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <ShoppingCart className='h-5 w-5 text-primary' />
                    Enrollment cart
                  </CardTitle>
                  {cartId && (
                    <Badge variant='outline' className='uppercase'>
                      {cartQuery.data?.status ?? 'OPEN'}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Add classes to your cart. Checkout requires MPesa and a signed-in student.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {!cartId || !cartQuery.data || cartQuery.data.items?.length === 0 ? (
                  <div className='rounded-xl border border-dashed border-border/80 bg-card/60 p-4 text-sm text-muted-foreground'>
                    Your cart is empty. Add a class to begin checkout.
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='space-y-2'>
                      {cartQuery.data.items?.map(item => (
                        <CartLine
                          key={item.id ?? item.variant_id}
                          item={item}
                          classes={classes}
                          currency={cartQuery.data?.currency_code ?? DEFAULT_CURRENCY}
                        />
                      ))}
                    </div>
                    <Separator />
                    <div className='flex items-center justify-between text-sm font-medium text-foreground'>
                      <span>Subtotal</span>
                      <span>{formatMoney(cartQuery.data.subtotal, cartQuery.data.currency_code)}</span>
                    </div>
                    <div className='flex items-center justify-between text-base font-semibold'>
                      <span>Total</span>
                      <span>{formatMoney(cartQuery.data.total, cartQuery.data.currency_code)}</span>
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Checkout provider: {DEFAULT_PAYMENT_PROVIDER.toUpperCase()}. Taxes and fees are
                      included if applicable.
                    </p>
                  </div>
                )}

                <div className='flex flex-col gap-2'>
                  <Button
                    disabled={
                      !cartId ||
                      cartQuery.data?.items?.length === 0 ||
                      isCheckoutBusy ||
                      status !== 'authenticated'
                    }
                    onClick={handleCheckout}
                    className='w-full'
                  >
                    {isCheckoutBusy ? 'Processing…' : 'Checkout and enroll'}
                  </Button>
                  <Button variant='secondary' className='w-full' onClick={handleResetCart}>
                    Start fresh cart
                  </Button>
                  {status !== 'authenticated' && (
                    <div className='flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground'>
                      <CreditCard className='h-4 w-4 text-primary' />
                      Sign in to secure your cart and complete payment.
                    </div>
                  )}
                  {lastOrder && (
                    <div className='rounded-lg border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground'>
                      <div className='flex items-center gap-2 text-foreground'>
                        <Sparkles className='h-4 w-4 text-primary' />
                        Order {lastOrder.display_id ?? lastOrder.id}
                      </div>
                      <div className='mt-1'>
                        Payment status: <strong>{lastOrder.payment_status}</strong>
                      </div>
                      <div>Awaiting enrollment confirmation if payment is successful.</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  classDef,
  onAddToCart,
  isAdding,
}: {
  classDef: ClassDefinition;
  onAddToCart: () => Promise<void> | void;
  isAdding: boolean;
}) {
  const {
    title,
    description,
    training_fee,
    session_format,
    location_name,
    location_type,
    default_start_time,
    default_end_time,
    duration_formatted,
    is_active,
  } = classDef;

  return (
    <Card className='h-full border-border/80 bg-card/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <CardHeader className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='line-clamp-2 text-lg leading-6'>{title}</CardTitle>
          <Badge variant={is_active ? 'success' : 'secondary'}>
            {is_active ? 'Open' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription className='line-clamp-3 text-sm text-muted-foreground'>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='h-4 w-4' />
          <span>{formatSchedule(default_start_time, default_end_time)}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          {duration_formatted ? `Duration: ${duration_formatted}` : 'Flexible duration'}
        </div>
        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          <Badge variant='outline' className='gap-1'>
            {session_format}
          </Badge>
          {location_type && (
            <Badge variant='outline' className='gap-1'>
              <MapPin className='h-3 w-3' />
              {location_name ?? location_type}
            </Badge>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <div className='text-sm font-semibold text-foreground'>
            {training_fee ? formatMoney(training_fee) : 'Price shared at checkout'}
          </div>
          <Button size='sm' onClick={onAddToCart} disabled={isAdding || !is_active}>
            {isAdding ? 'Adding…' : 'Add to cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CartLine({
  item,
  classes,
  currency,
}: {
  item: CartItemResponse;
  classes: ClassDefinition[];
  currency: string;
}) {
  const classUuid =
    extractMetadataValue(item.metadata, 'class_definition_uuid') ||
    (item.metadata as CartEnrollmentMeta | undefined)?.class_definition_uuid;
  const classDef = classes.find(cls => cls.uuid === classUuid);

  return (
    <div className='rounded-lg border border-border/70 bg-background/60 p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='font-semibold text-foreground'>
            {classDef?.title ?? item.title ?? 'Class seat'}
          </div>
          <div className='text-xs text-muted-foreground'>
            Qty {item.quantity ?? 1} · {formatSchedule(classDef?.default_start_time, classDef?.default_end_time)}
          </div>
        </div>
        <div className='text-sm font-semibold'>{formatMoney(item.total ?? item.subtotal, currency)}</div>
      </div>
    </div>
  );
}
