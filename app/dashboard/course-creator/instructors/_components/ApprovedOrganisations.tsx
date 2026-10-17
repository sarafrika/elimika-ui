'use client';

import ApprovedPartnersTable from './ApprovedPartnersTable';
import { useApprovedOrganisationDirectory } from './useApprovedOrganisationDirectory';

export default function ApprovedOrganisations() {
  const organisations = useApprovedOrganisationDirectory();
  return <ApprovedPartnersTable sources={[organisations]} organisationsOnly />;
}
