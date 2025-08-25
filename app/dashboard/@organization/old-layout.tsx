'use client';

import { ReactNode } from 'react';
import OrganisactionProvider from '../../../context/training-center-provide';

export default function OrganizationLayout({ children }: { children: ReactNode }) {
  return <OrganisactionProvider>{children}</OrganisactionProvider>;
}
