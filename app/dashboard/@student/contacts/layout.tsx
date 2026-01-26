'use client';

import { Separator } from '@/components/ui/separator';

interface ContactsLayoutProps {
  children: React.ReactNode;
}

export default function ContactsLayout({ children }: ContactsLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            Discover, join, and engage with communities to collaborate, share knowledge, and connect with members around shared interests.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 w-full'>{children}</div>
      </div>
    </div>
  );
}
