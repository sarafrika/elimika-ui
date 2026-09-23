'use client';

import { CatalogueWorkspace } from '@/src/features/catalogue/components/catalogue-workspace';

export default function InstructorCataloguePage() {
  return (
    <div className='p-4 lg:p-6'>
      <CatalogueWorkspace scope='instructor' />
    </div>
  );
}
