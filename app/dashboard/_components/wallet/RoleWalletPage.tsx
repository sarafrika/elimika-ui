'use client';

import { WalletProvider, WalletShell, type WalletTabId } from '@/app/dashboard/student/wallet/page';
import { useSearchParams } from 'next/navigation';

type WalletRole = 'instructor' | 'course_creator';

const ROLE_LABELS: Record<WalletRole, string> = {
  instructor: 'Instructor Wallet',
  course_creator: 'Course Creator Wallet',
};

const ROLE_DESCRIPTIONS: Record<WalletRole, string> = {
  instructor: 'Course class orders, delivery progress and wallet activity.',
  course_creator: 'Class orders for your courses, delivery progress and wallet activity.',
};

export function RoleWalletPage({ role }: { role: WalletRole }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'top-up' ? ('top-up' as WalletTabId) : undefined;

  return (
    <WalletProvider>
      <WalletShell
        role={role}
        title={ROLE_LABELS[role]}
        description={ROLE_DESCRIPTIONS[role]}
        initialTab={initialTab}
      />
    </WalletProvider>
  );
}
