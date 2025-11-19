'use client';

import InstructorProvider from '@/context/instructor-context';
import type { ReactNode } from 'react';
export default function InstructorLayout({ children }: { children: ReactNode }) {
  return <InstructorProvider>{children}</InstructorProvider>;
}
