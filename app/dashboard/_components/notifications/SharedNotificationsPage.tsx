'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { AlertsTab } from './AlertsTab';
import { MessagingTab } from './MessagingTab';

type WorkspaceTab = 'messaging' | 'alerts';

export function SharedNotificationsPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('messaging');

  return (
    <main className='bg-white px-0 py-0 text-[#1f2a4d]'>
      <header className='border-b border-[#e2e7f3] bg-white px-4 py-3 sm:px-8'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-2xl font-semibold tracking-normal text-[#1f2a4d] sm:text-3xl'>
            Messaging / Notifications
          </h1>
          {/* <div className='flex items-center gap-2 text-sm text-[#4f5b80]'>
            <Search className='h-4 w-4' />
            <span>Sarah Otieno</span>
          </div> */}
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as WorkspaceTab)}
        className='bg-white'
      >
        <div className='border-b border-[#e2e7f3] px-4 sm:px-8'>
          <TabsList className='h-14 gap-7 bg-transparent p-0'>
            <TabsTrigger
              value='messaging'
              className='h-14 rounded-none border-b-2 border-transparent bg-transparent px-0 text-base font-medium text-[#4f5b80] shadow-none data-[state=active]:border-[#2458b8] data-[state=active]:bg-transparent data-[state=active]:text-[#1f2a4d] data-[state=active]:shadow-none'
            >
              Messaging
            </TabsTrigger>
            <TabsTrigger
              value='alerts'
              className='h-14 rounded-none border-b-2 border-transparent bg-transparent px-0 text-base font-medium text-[#4f5b80] shadow-none data-[state=active]:border-[#2458b8] data-[state=active]:bg-transparent data-[state=active]:text-[#1f2a4d] data-[state=active]:shadow-none'
            >
              Alerts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='messaging' className='m-0 bg-white px-4 py-4 sm:px-8'>
          <MessagingTab />
        </TabsContent>
        <TabsContent value='alerts' className='m-0 bg-white px-4 py-4 sm:px-8'>
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
