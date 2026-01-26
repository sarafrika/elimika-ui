'use client';

import { Separator } from '@/components/ui/separator';

interface InvitesLayoutProps {
  children: React.ReactNode;
}

export default function InvitesLayout({ children }: InvitesLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-foreground text-2xl font-bold'>Invites</h1>
          <p className='text-muted-foreground text-sm'>
            Manage invitations, track their status, and invite new members to join your organization
            or community.
          </p>
        </div>
      </div>

      <Separator />

      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='w-full flex-1'>{children}</div>
      </div>
    </div>
  );
}
