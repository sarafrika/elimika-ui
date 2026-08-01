'use client';

import { AlertsTab } from './AlertsTab';

export function SharedNotificationsPage() {
  return (
    <main className='bg-background text-foreground px-0 py-0'>
      <div className='bg-background px-4 py-4 sm:px-8'>
        <AlertsTab />
      </div>
    </main>
  );
}
