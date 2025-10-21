'use client';

import { ProfileSectionNav } from '@/components/profile/profile-section-nav';
import { ReactNode } from 'react';

const sections = [
  { label: 'Training centre', href: '/dashboard/account/training-center', exact: true },
  { label: 'Branches', href: '/dashboard/account/branches' },
  { label: 'Availability', href: '/dashboard/account/availability' },
  { label: 'Fees & scheduling', href: '/dashboard/account/fees-scheduling' },
  { label: 'Instructor preferences', href: '/dashboard/account/instructor-preferences' },
  { label: 'Users', href: '/dashboard/account/users' },
  { label: 'Admin', href: '/dashboard/account/admin' },
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
