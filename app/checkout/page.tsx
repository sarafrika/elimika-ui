import { redirect } from 'next/navigation';

/** Checkout lives inside the dashboard shell now; old links and bookmarks land there. */
export default function CheckoutRedirect() {
  redirect('/dashboard/checkout');
}
