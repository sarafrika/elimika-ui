'use client';

import type { ReactNode } from 'react';

const sections = [
  { label: 'Overview', href: '/dashboard/course-creator/profile', exact: true },
  { label: 'General', href: '/dashboard/course-creator/profile/general' },
  { label: 'Education', href: '/dashboard/course-creator/profile/education' },
  { label: 'Experience', href: '/dashboard/course-creator/profile/experience' },
  { label: 'Certificates', href: '/dashboard/course-creator/profile/certificates' },
  {
    label: 'Professional Memberships',
    href: '/dashboard/course-creator/profile/professional-membership',
  },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col gap-4 pt-4 pb-14'>
      {/* <ProfileSectionNav items={sections} /> */}
      <div className='flex-1'>
        <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>{children}</div>
      </div>
    </div>
  );
}
