import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasOrganisationAdminAffiliation,
  managesOrganisation,
  organisationAdminAffiliations,
} from './org-admin-affiliation';

const student = { organisation_uuid: 'org-b', domain_in_organisation: 'student', active: true };
const instructor = { organisation_uuid: 'org-b', domain_in_organisation: 'instructor', active: true };
const admin = { organisation_uuid: 'org-a', domain_in_organisation: 'admin', active: true };

test('student, instructor and parent affiliations never open the organisation portal', () => {
  assert.equal(hasOrganisationAdminAffiliation([student, instructor]), false);
  assert.equal(
    hasOrganisationAdminAffiliation([{ ...student, domain_in_organisation: 'parent' }]),
    false
  );
  assert.equal(hasOrganisationAdminAffiliation([]), false);
  assert.equal(hasOrganisationAdminAffiliation(undefined), false);
});

test('an active admin or organisation_user affiliation opens the portal', () => {
  assert.equal(hasOrganisationAdminAffiliation([admin]), true);
  assert.equal(
    hasOrganisationAdminAffiliation([{ ...admin, domain_in_organisation: 'organisation_user' }]),
    true
  );
  assert.equal(hasOrganisationAdminAffiliation([{ ...admin, active: false }]), false);
});

test('the active organisation is the one administered, not a student affiliation listed first', () => {
  assert.deepEqual(
    organisationAdminAffiliations([student, admin]).map(a => a.organisation_uuid),
    ['org-a']
  );
  assert.equal(managesOrganisation([student, admin], 'org-a'), true);
  assert.equal(managesOrganisation([student, admin], 'org-b'), false);
});
