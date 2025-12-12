"use client";

import { CatalogueWorkspace } from '@/app/dashboard/_components/catalogue-workspace';

export default function OrganizationCataloguePage() {
  return (
    <div className='p-4 lg:p-6'>
      <CatalogueWorkspace scope='organization' />
    </div>
  );
}
