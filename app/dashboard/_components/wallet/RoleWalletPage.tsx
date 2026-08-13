'use client';

import { WalletProvider, WalletShell } from '@/app/dashboard/student/wallet/page';

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
  return (
    <WalletProvider>
      <WalletShell title={ROLE_LABELS[role]} description={ROLE_DESCRIPTIONS[role]} />
    </WalletProvider>
  );
}
