'use client';

import CatalogueTableWorkspace from './_components/catalogue-tableview';

export default function AdminCataloguePage() {
  return (
    <div className='p-4 lg:p-6'>
      <CatalogueTableWorkspace scope='admin' />
    </div>
  );
}
