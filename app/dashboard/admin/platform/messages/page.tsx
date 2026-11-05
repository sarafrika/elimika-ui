import { Suspense } from 'react';
import { surfaceTheme } from '@/components/data-display';
import { SmsMessagesPage, SmsMessagesSkeleton } from '@/src/features/admin/pages/sms-messages-page';

export default function AdminSmsMessagesRoute() {
  return (
    <Suspense
      fallback={
        <div className={`${surfaceTheme.pageWide} py-4`}>
          <SmsMessagesSkeleton />
        </div>
      }
    >
      <SmsMessagesPage />
    </Suspense>
  );
}
