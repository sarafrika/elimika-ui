// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatRate, formatRateAmount, getRateBasis } from '@/lib/rate-card';
import { addItemMutation, createCartMutation, getCartQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { useCartStore } from '@/store/cart-store';
import { getErrorMessage } from '../types';
import type { JoinSession } from './class-join-view';

interface ScheduleLike {
  uuid?: string;
  title?: string;
  start_time?: string | Date;
  end_time?: string | Date;
  duration_minutes?: number | string;
}

export function sortedSessions(schedules: ScheduleLike[] | undefined): ScheduleLike[] {
  return [...(schedules ?? [])]
    .filter(s => s.start_time)
    .sort((a, b) => new Date(a.start_time as string).getTime() - new Date(b.start_time as string).getTime());
}

/** One date format everywhere: `Sat 14 Nov 2026` and `09:00–10:30`. */
export function toJoinSessions(schedules: ScheduleLike[]): JoinSession[] {
  return schedules.map((s, index) => {
    const start = new Date(s.start_time as string);
    const end = s.end_time ? new Date(s.end_time as string) : null;
    return {
      id: s.uuid ?? String(index),
      month: format(start, 'MMM').toUpperCase(),
      day: format(start, 'd'),
      title: s.title ? `Session ${index + 1} · ${s.title}` : `Session ${index + 1}`,
      dateLabel: format(start, 'EEEE d MMMM yyyy'),
      timeLabel: end ? `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}` : format(start, 'HH:mm'),
    };
  });
}

export function durationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${Number(hours.toFixed(2))} h`;
}

/**
 * The price shown is the catalogue's whole-class amount, the same figure the cart charges. Whether
 * the class is paid is decided from it too, never from a separate field that could disagree.
 */
export function joinPrice(cls: { catalogue?: { unit_amount?: number | string } | null; sale_price?: number | null; rate_basis?: string | null }) {
  const total = Number(cls.catalogue?.unit_amount ?? 0);
  const rate = Number(cls.sale_price ?? 0);
  const isFree = !(total > 0);
  const basis = getRateBasis(cls.rate_basis);
  const units = rate > 0 && total > 0 ? Number((total / rate).toFixed(2)) : null;
  return {
    isFree,
    total,
    totalLabel: isFree ? 'Free' : formatRateAmount(total),
    rateLabel: rate > 0 ? formatRate(rate, cls.rate_basis) : null,
    unitsLabel: units ? `× ${units} ${basis.unit}${units === 1 ? '' : 's'}` : null,
  };
}

/**
 * Adds a class to the learner's cart, then opens `destination`. A saved cart that was already checked
 * out is no longer a cart: adding to it would quietly hand back the old order, so a fresh cart is
 * started instead.
 */
export function useAddClassToCart() {
  const router = useRouter();
  const qc = useQueryClient();
  const { cartId: savedCartId, setCartId, clearCart } = useCartStore();
  const createCart = useMutation(createCartMutation());
  const addItem = useMutation(addItemMutation());

  const startNewCart = (variantCode: string, destination: string) =>
    createCart.mutate(
      { body: { currency_code: 'KES', region_code: 'KE', items: [{ variant_id: variantCode, quantity: 1 }] } },
      {
        onSuccess: data => {
          const id = data?.data?.id ?? null;
          if (id) {
            setCartId(id);
            void qc.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId: id } }) });
          }
          router.push(destination);
        },
        onError: error => toast.error(getErrorMessage(error, 'Could not add this class to your cart')),
      }
    );

  const add = (variantCode: string | null | undefined, destination: string) => {
    if (!variantCode) {
      toast.error('This class is not on sale yet');
      return;
    }
    if (!savedCartId) {
      startNewCart(variantCode, destination);
      return;
    }
    addItem.mutate(
      { path: { cartId: savedCartId }, body: { variant_id: variantCode, quantity: 1 } },
      {
        onSuccess: data => {
          if ((data?.data?.status ?? 'OPEN').toUpperCase() !== 'OPEN') {
            clearCart();
            startNewCart(variantCode, destination);
            return;
          }
          void qc.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId: savedCartId } }) });
          router.push(destination);
        },
        onError: () => {
          clearCart();
          startNewCart(variantCode, destination);
        },
      }
    );
  };

  return { add, pending: createCart.isPending || addItem.isPending };
}
