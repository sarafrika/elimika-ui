'use client';

import StudentContextProvider from '@/context/student-context';
import type { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentContextProvider>{children}</StudentContextProvider>;
}
