import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FindClassesPage } from '@/src/features/find-classes/FindClassesPage';

export const metadata: Metadata = { title: 'Find classes' };

export default function ParentFindClassesPage() {
  return (
    <Suspense>
      <FindClassesPage domain='parent' />
    </Suspense>
  );
}
