'use client';

import { CatalogueWorkspace } from '@/src/features/catalogue/components/catalogue-workspace';

export default function CourseCreatorCataloguePage() {
  return (
    <div className='p-4 lg:p-6'>
      <CatalogueWorkspace scope='course_creator' />
    </div>
  );
}
