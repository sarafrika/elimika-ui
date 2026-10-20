import { redirect } from 'next/navigation';

/** Retired: course earnings are the Wallet's "By course" tab. */
export default function Page() {
  redirect('/dashboard/course-creator/wallet?tab=courses');
}
