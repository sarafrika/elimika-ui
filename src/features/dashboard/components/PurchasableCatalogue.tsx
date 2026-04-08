'use client';

import { CatalogueWorkspace } from '@/app/dashboard/@admin/catalogue/_components/catalogue-workspace';

type CatalogueScope = 'admin' | 'organization' | 'instructor' | 'course_creator';

export default function PurchasableCatalogue({
  scope = 'organization',
}: {
  scope?: CatalogueScope;
}) {
  return (
    <CatalogueWorkspace
      scope={scope}
      variant='embedded'
      title='Purchasable catalogue'
      description='A quick view of active and hidden SKUs linked to your classes and courses.'
    />
  );
}
