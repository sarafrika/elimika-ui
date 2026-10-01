'use client';

import type { ReactNode } from 'react';

import { ProfileSectionLayout } from './ProfileSectionLayout';

export default function StudentProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileSectionLayout landingPath='/dashboard/student/profile'>{children}</ProfileSectionLayout>
  );
}
