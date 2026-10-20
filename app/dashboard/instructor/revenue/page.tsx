import { redirect } from 'next/navigation';

/** Retired: an instructor's money now lives in Wallet. */
export default function Page() {
  redirect('/dashboard/instructor/wallet');
}
