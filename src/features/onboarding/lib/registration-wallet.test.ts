import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { client } from '@/services/client/client.gen';
import { WALLET_SECTIONS } from './registration-steps';
import { removeRegistrationWalletEntry, saveRegistrationWalletEntry } from './registration-wallet';

const originalConfig = client.getConfig();
after(() => client.setConfig(originalConfig));

test('onboarding saves each wallet section using API fields and date-only values', async () => {
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  client.setConfig({
    baseUrl: 'https://onboarding.example.test',
    auth: undefined,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      requests.push({ url: request.url, body: await request.json() });
      return Response.json({ success: true, data: { uuid: 'saved-entry' } });
    },
  });
  await saveRegistrationWalletEntry('skills', {
    skill: '  Curriculum design  ',
    proficiency: 'Expert',
    evidence: 'Portfolio',
    lastAssessed: '2026-11-24',
    verificationStatus: 'Verified',
  });
  await saveRegistrationWalletEntry('portfolio', {
    title: 'Work sample',
    type: 'Work sample',
    date: '2026-11-23',
  });
  await saveRegistrationWalletEntry('credentials', {
    name: 'Trainer',
    issuer: 'Authority',
    type: 'External credential',
    issuedOn: '2026-11-22',
  });
  await saveRegistrationWalletEntry('competencies', { competency: 'Assessment', level: 'Level 4' });
  await saveRegistrationWalletEntry('experience', {
    role: 'Trainer',
    organisation: 'Academy',
    type: 'Volunteering',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
  });
  await saveRegistrationWalletEntry('achievements', {
    title: 'New skill',
    type: 'Unlocked skill',
    date: '2026-11-21',
  });
  assert.deepEqual(
    requests.map(item => new URL(item.url).pathname),
    [
      '/api/v1/me/profile/skills',
      '/api/v1/me/profile/portfolio',
      '/api/v1/me/profile/certifications',
      '/api/v1/me/profile/competencies',
      '/api/v1/me/profile/experience',
      '/api/v1/me/profile/achievements',
    ]
  );
  assert.deepEqual(
    requests.map(item => item.body),
    [
      {
        skill_name: 'Curriculum design',
        proficiency_level: 'expert',
        evidence: 'Portfolio',
        last_assessed_on: '2026-11-24',
      },
      { title: 'Work sample', item_type: 'WORK_SAMPLE', completed_on: '2026-11-23' },
      {
        certification_name: 'Trainer',
        issuing_organization: 'Authority',
        credential_type: 'EXTERNAL_CREDENTIAL',
        issued_date: '2026-11-22',
      },
      { competency: 'Assessment', level: 4 },
      {
        position: 'Trainer',
        organisation_name: 'Academy',
        experience_type: 'VOLUNTEERING',
        start_date: '2025-01-01',
        end_date: '2026-01-01',
      },
      { title: 'New skill', achievement_type: 'UNLOCKED_SKILL', awarded_on: '2026-11-21' },
    ]
  );
});

test('unsuccessful saves remain failures even when HTTP succeeds', async () => {
  for (const body of [
    { success: false, message: 'Review unavailable' },
    { success: true },
    { error: 'Rejected', data: { uuid: 'entry' } },
  ]) {
    client.setConfig({ auth: undefined, fetch: async () => Response.json(body) });
    await assert.rejects(saveRegistrationWalletEntry('skills', { skill: 'Design' }));
  }
  client.setConfig({
    baseUrl: 'https://onboarding.example.test',
    auth: undefined,
    fetch: async () => Response.json({ message: 'Forbidden' }, { status: 403 }),
  });
  await assert.rejects(saveRegistrationWalletEntry('skills', { skill: 'Design' }));
});

test('wallet deletion accepts empty responses and rejects application errors', async () => {
  client.setConfig({
    baseUrl: 'https://onboarding.example.test',
    auth: undefined,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      assert.equal(request.method, 'DELETE');
      assert.ok(request.url.endsWith('/skills/entry-uuid'));
      return new Response(null, { status: 204 });
    },
  });
  await removeRegistrationWalletEntry('skills', 'entry-uuid');
  client.setConfig({ auth: undefined, fetch: async () => Response.json({ success: false }) });
  await assert.rejects(removeRegistrationWalletEntry('skills', 'entry-uuid'));
});

test('verification cannot be supplied by an applicant', async () => {
  assert.ok(
    WALLET_SECTIONS.every(section =>
      section.fields.every(field => !/verification|status/i.test(field.key))
    )
  );
  await assert.rejects(saveRegistrationWalletEntry('verification', {}), /review team/);
});
