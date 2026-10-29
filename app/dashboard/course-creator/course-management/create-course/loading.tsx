'use client';

import { CourseCreatorLoadingState } from '../../_components/loading-state';

export default function Loading() {
  return (
    <main className='mx-auto w-full max-w-7xl px-4 py-6 lg:px-6'>
      <CourseCreatorLoadingState headline='Preparing the standalone course builder…' />
    </main>
  );
}
