import { redirect } from 'next/navigation';

/** Retired: course earnings are the "By course" list on the Wallet's Accounts tab. */
export default function Page() {
  redirect('/dashboard/course-creator/wallet?tab=accounts');
}
