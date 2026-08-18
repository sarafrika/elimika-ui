'use client';

import { WalletProvider, WalletShell, type WalletTabId } from '@/app/dashboard/student/wallet/page';
import { useSearchParams } from 'next/navigation';

type WalletRole = 'instructor' | 'course_creator';

const ROLE_LABELS: Record<WalletRole, string> = {
  instructor: 'Instructor Wallet',
  course_creator: 'Course Creator Wallet',
};

const ROLE_DESCRIPTIONS: Record<WalletRole, string> = {
  instructor: 'Personal funds, Skills Fund balances, rewards, refunds and marketplace credits',
  course_creator: 'Personal funds, Skills Fund balances, rewards, refunds and marketplace credits',
};

export function RoleWalletPage({ role }: { role: WalletRole }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'top-up' ? ('top-up' as WalletTabId) : undefined;

  return (
    <WalletProvider>
      <WalletShell
        title={ROLE_LABELS[role]}
        description={ROLE_DESCRIPTIONS[role]}
        initialTab={initialTab}
      />
    </WalletProvider>
  );
}
