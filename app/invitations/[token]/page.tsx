'use client';

import { Suspense } from 'react';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Skeleton } from '@/components/ui/skeleton';
import { InvitationContent } from './invitation-content';

export default function InvitationPage() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:py-14'>
        <Suspense fallback={<Skeleton className='h-[520px] w-full rounded-xl' />}>
          <InvitationContent />
        </Suspense>
      </div>
    </div>
  );
}
