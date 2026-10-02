'use client';

import type { ReactNode } from 'react';

import { ProfileSectionLayout } from '@/src/features/profile/layouts/ProfileSectionLayout';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileSectionLayout landingPath='/dashboard/course-creator/profile'>
      {children}
    </ProfileSectionLayout>
  );
}
