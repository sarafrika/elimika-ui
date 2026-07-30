'use client';

import { AlertsTab } from './AlertsTab';

export function SharedNotificationsPage() {
  return (
    <main className='bg-background px-0 py-0 text-foreground'>
      <div className='bg-background px-4 py-4 sm:px-8'>
        <AlertsTab />
      </div>
    </main>
  );
}
