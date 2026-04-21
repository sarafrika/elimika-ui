'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { AlertsTab } from './AlertsTab';
import { MessagingTab } from './MessagingTab';

type WorkspaceTab = 'messaging' | 'alerts';

export function SharedNotificationsPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('messaging');

  return (
    <main className='bg-background px-0 py-0 text-foreground'>
      <header className='border-border bg-background border-b px-4 py-3 sm:px-8'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
            Messaging / Notifications
          </h1>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as WorkspaceTab)}
        className='bg-background'
      >
        <div className='border-border border-b px-4 sm:px-8'>
          <TabsList className='h-14 gap-7 bg-transparent p-0'>
            <TabsTrigger
              value='messaging'
              className='text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground h-14 rounded-none border-b-2 border-transparent bg-transparent px-0 text-base font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none'
            >
              Messaging
            </TabsTrigger>

            <TabsTrigger
              value='alerts'
              className='text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground h-14 rounded-none border-b-2 border-transparent bg-transparent px-0 text-base font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none'
            >
              Alerts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='messaging' className='bg-background m-0 px-4 py-4 sm:px-8'>
          <MessagingTab />
        </TabsContent>

        <TabsContent value='alerts' className='bg-background m-0 px-4 py-4 sm:px-8'>
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}