'use client';

import type { ReactNode } from 'react';
import { ProfileSectionNav } from '@/components/profile/profile-section-nav';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

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
  const { activeDomain } = useUserDomain();
  const items = sections.map(section => ({
    ...section,
    href: buildWorkspaceAliasPath(activeDomain, section.href),
  }));

  return (
    <div className='flex min-h-screen flex-col gap-4 pt-4 pb-14'>
      <ProfileSectionNav items={items} />
      <div className='flex-1'>
        <div className='mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8'>{children}</div>
      </div>
    </div>
  );
}
