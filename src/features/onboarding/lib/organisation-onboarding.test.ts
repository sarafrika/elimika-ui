import assert from 'node:assert/strict';
import test from 'node:test';
import {
  organisationReviewDescription,
  restoreOrganisationReviewDetails,
} from './organisation-onboarding';

test('organisation review choices survive the existing description API without changing the user description', () => {
  const values = {
    description: 'Training for local communities.\nWith evening classes.',
    category: 'School / Training institution',
    capabilities: ['train', 'fund'],
    is_representative: true,
  };
  const description = organisationReviewDescription(values);
  assert.match(description, /Capabilities: Offer training, Sponsor learning/);
  assert.deepEqual(restoreOrganisationReviewDetails({ name: 'Academy', description }), {
    name: 'Academy',
    ...values,
  });
});

test('reopening and saving an application keeps one review summary', () => {
  const values = {
    category: 'Company / Employer',
    capabilities: ['hire'],
    is_representative: true,
  };
  const first = organisationReviewDescription(values);
  const restored = restoreOrganisationReviewDetails({ description: first });
  const second = organisationReviewDescription({
    ...values,
    description: String(restored.description),
  });
  assert.equal(second, first);
});

test('legacy and incomplete descriptions remain intact', () => {
  for (const description of [
    undefined,
    'Existing description',
    'Description\n\nOrganisation onboarding\nCategory: unfinished',
  ]) {
    const values = { name: 'Academy', description };
    assert.deepEqual(restoreOrganisationReviewDetails(values), values);
  }
});
