'use client';

import { WalletProvider } from '@/app/dashboard/student/wallet/page';
import { WalletWithdrawPage } from './WalletWithdrawPage';

export function RoleWalletWithdrawPage() {
  return (
    <WalletProvider>
      <WalletWithdrawPage />
    </WalletProvider>
  );
}
