// Only an org admin/manager affiliation opens the organisation portal; mirrors the backend.
// Student, instructor and parent affiliations never do.
const ORG_ADMIN_DOMAINS = new Set(['admin', 'organisation_user']);

type Affiliation = {
  organisation_uuid?: string | null;
  domain_in_organisation?: string | null;
  active?: boolean | null;
};

export function isOrganisationAdminAffiliation(affiliation: Affiliation): boolean {
  return (
    affiliation.active !== false &&
    ORG_ADMIN_DOMAINS.has((affiliation.domain_in_organisation ?? '').toLowerCase())
  );
}

/** The affiliations that grant organisation-portal access, in their original order. */
export function organisationAdminAffiliations<T extends Affiliation>(
  affiliations: readonly T[] | null | undefined
): T[] {
  return (affiliations ?? []).filter(isOrganisationAdminAffiliation);
}

export function hasOrganisationAdminAffiliation(
  affiliations: readonly Affiliation[] | null | undefined
): boolean {
  return organisationAdminAffiliations(affiliations).length > 0;
}

/** True when the caller administers this specific organisation. */
export function managesOrganisation(
  affiliations: readonly Affiliation[] | null | undefined,
  organisationUuid: string | null | undefined
): boolean {
  if (!organisationUuid) return false;
  return organisationAdminAffiliations(affiliations).some(
    a => a.organisation_uuid === organisationUuid
  );
}
