'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { httpStatusOf } from '@/lib/api-errors';
import { getCartOptions } from '@/services/client/@tanstack/react-query.gen';
import { useCartStore } from '@/store/cart-store';

/** A saved cart that answers with one of these is gone or belongs to someone else. */
const DEAD_CART_STATUSES = new Set([403, 404]);

/**
 * The cart whose id this browser saved. Carts need a signed-in owner, so a signed-out
 * visitor never asks for one, and a cart that is gone or belongs to another account is
 * forgotten instead of being re-requested on every page.
 */
export function useSavedCart(options: { enabled?: boolean } = {}) {
  const { cartId, clearCart } = useCartStore();
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  // HeyAPI leaves `{cartId}` literal in the URL when the path value is empty; the sentinel
  // never reaches the network because the query is disabled without a saved id.
  const query = useQuery({
    ...getCartOptions({ path: { cartId: cartId ?? 'unset' } }),
    enabled: signedIn && Boolean(cartId) && (options.enabled ?? true),
    retry: (failureCount, error) => {
      const statusCode = httpStatusOf(error);
      if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) return false;
      return failureCount < 1;
    },
  });

  const errorStatus = httpStatusOf(query.error);
  useEffect(() => {
    if (errorStatus !== undefined && DEAD_CART_STATUSES.has(errorStatus)) clearCart();
  }, [errorStatus, clearCart]);

  // A checked-out cart is an order now; its payment lives in Wallet / Billing, not the cart.
  // The server wraps the cart in its ApiResponse envelope; the generated type omits it.
  const body = query.data as unknown as { data?: { status?: string } } | undefined;
  const cartStatus = body?.data?.status?.toUpperCase();
  useEffect(() => {
    if (cartStatus === 'COMPLETED') clearCart();
  }, [cartStatus, clearCart]);

  return query;
}
