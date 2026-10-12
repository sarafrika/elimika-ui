import type { QueryClient } from '@tanstack/react-query';
import type { ApiResponseWallet, SessionBootstrap } from '@/services/client';
import { getWalletQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { type NotificationCounts, notificationCountsQueryKey } from '@/services/notifications';

function toCounts(counts?: { unread_count?: bigint | number; popup_count?: bigint | number }) {
  return {
    unread_count: Number(counts?.unread_count ?? 0),
    popup_count: Number(counts?.popup_count ?? 0),
  } satisfies NotificationCounts;
}

// Writes the bootstrap's wallet and unread counts under the keys the shell widgets already
// read, so the top bar and notification bell render without their own first requests.
export function seedSessionBootstrap(qc: QueryClient, bootstrap: SessionBootstrap) {
  const userUuid = bootstrap.user?.uuid;
  const { wallet, notifications } = bootstrap;

  if (userUuid && wallet) {
    const seeded: ApiResponseWallet = {
      success: true,
      data: {
        uuid: wallet.wallet_uuid,
        user_uuid: userUuid,
        currency_code: wallet.currency_code,
        balance_amount: wallet.balance_amount,
      },
    };
    qc.setQueryData(getWalletQueryKey({ path: { userUuid } }), seeded);
  }

  if (notifications) {
    qc.setQueryData(notificationCountsQueryKey(undefined), toCounts(notifications));
    for (const [domain, counts] of Object.entries(notifications.by_domain ?? {})) {
      qc.setQueryData(notificationCountsQueryKey(domain), toCounts(counts));
    }
  }
}
