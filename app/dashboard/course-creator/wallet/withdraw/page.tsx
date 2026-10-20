import { redirect } from 'next/navigation';

/** Retired: transfers open from the Wallet page. */
export default function Page() {
  redirect('/dashboard/course-creator/wallet');
}
