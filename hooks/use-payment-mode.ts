import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { API_BASE_URL } from '@/services/api/base-url';

/**
 * Whether this environment actually collects money for a course.
 *
 * <p>The answer comes from the backend rather than a `NEXT_PUBLIC_*` build arg because those are
 * baked into the image at build time, and this app is built and deployed separately from the API.
 * A compiled-in flag can therefore disagree with the server it ends up talking to, and both
 * directions of that disagreement strand the learner: sent to the payment page on an environment
 * with no working till, or sent past it on one that never captures, leaving an order nobody
 * settles.
 *
 * <p>Defaults to requiring payment whenever the answer is unknown or the request fails, so a
 * degraded API can never turn a paying environment into a free one.
 */

const PAYMENT_MODE_PATH = '/api/v1/commerce/payment-mode';

export const paymentModeQueryKey = ['commerce', 'payment-mode'] as const;

async function fetchPaymentRequired(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}${PAYMENT_MODE_PATH}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Payment mode lookup failed with ${response.status}`);
  }
  const body = await response.json();
  return body?.data?.payment_required !== false;
}

export function usePaymentMode() {
  const query = useQuery({
    queryKey: paymentModeQueryKey,
    queryFn: fetchPaymentRequired,
    staleTime: STALE_TIMES.reference,
    retry: 1,
  });

  return {
    // `undefined` while loading resolves to true: the cart must not offer a free enrolment before
    // it knows, or a slow response would briefly show the wrong button on a paying environment.
    paymentRequired: query.data ?? true,
    isLoading: query.isLoading,
  };
}
