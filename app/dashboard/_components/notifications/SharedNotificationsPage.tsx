'use client';

import { AlertsTab } from './AlertsTab';

export function SharedNotificationsPage() {
  return (
    <main className='bg-background px-0 py-0 text-foreground'>
      <header className='border-border bg-background border-b px-4 py-3 sm:px-8'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
            Notifications
          </h1>
        </div>
      </header>

      <div className='bg-background px-4 py-4 sm:px-8'>
        <AlertsTab />
      </div>
    </main>
  );
}
