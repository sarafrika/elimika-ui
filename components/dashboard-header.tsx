'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';

export const DashboardHeader = () => {
  return (
    <header className='flex h-16 shrink-0 items-center justify-between px-6'>
      <div className='flex items-center gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
        <AppBreadcrumb />
      </div>
    </header>
  );
};
