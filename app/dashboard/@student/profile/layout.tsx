'use client';

import { ProfileSectionNav } from '@/components/profile/profile-section-nav';
import { ReactNode } from 'react';

const sections = [
  { label: 'Overview', href: '/dashboard/profile', exact: true },
  { label: 'General', href: '/dashboard/profile/general' },
  { label: 'Guardian information', href: '/dashboard/profile/guardian-information' },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col gap-4 pb-14 pt-4'>
      <ProfileSectionNav items={sections} />
      <div className='flex-1'>
        <div className='mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8'>{children}</div>
      </div>
    </div>
  );
}
