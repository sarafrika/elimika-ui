import { Suspense } from 'react';
import { CheckoutPage } from '@/src/features/checkout/checkout-page';

export default function DashboardCheckoutPage() {
  // The page reads `?order=` to resume an unpaid order, which needs a Suspense boundary.
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
