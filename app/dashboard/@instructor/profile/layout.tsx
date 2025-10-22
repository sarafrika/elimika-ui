'use client';

import { ProfileSectionNav } from '@/components/profile/profile-section-nav';
import { ReactNode } from 'react';

const sections = [
  { label: 'General', href: '/dashboard/profile/general' },
  { label: 'Education', href: '/dashboard/profile/education' },
  { label: 'Experience', href: '/dashboard/profile/experience' },
  { label: 'Certificates', href: '/dashboard/profile/certificates' },

  {
    label: 'Professional Memberships',
    href: '/dashboard/profile/professional-membership',
  },
  { label: 'Skill Card', href: '/dashboard/profile/skill-card' },
  { label: 'Training Areas', href: '/dashboard/profile/training-areas' },
  { label: 'Availability', href: '/dashboard/profile/availability' },
  { label: 'Rate Card', href: '/dashboard/profile/rate-card' },
  { label: 'Reviews', href: '/dashboard/profile/reviews' },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col gap-4 pt-4 pb-14'>
      <ProfileSectionNav items={sections} />
      <div className='flex-1'>
        <div className='mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8'>{children}</div>
      </div>
    </div>
  );
}
