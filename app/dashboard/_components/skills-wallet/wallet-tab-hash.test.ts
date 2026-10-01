import assert from 'node:assert/strict';
import { test } from 'node:test';
import { credentialShareHref, legacyWalletHashTarget } from './wallet-tab-hash';

const TABS = ['overview', 'skills', 'credentials', 'verification'] as const;

test('a bare tab hash forwards to that tab and drops the hash', () => {
  assert.deepEqual(legacyWalletHashTarget('#skills', TABS), { tab: 'skills', hash: '' });
  assert.deepEqual(legacyWalletHashTarget('#overview', TABS), { tab: 'overview', hash: '' });
  assert.deepEqual(legacyWalletHashTarget('verification', TABS), {
    tab: 'verification',
    hash: '',
  });
});

test('a hash pointing inside a tab keeps the whole hash for the tab to focus', () => {
  assert.deepEqual(legacyWalletHashTarget('#credentials/abc-123', TABS), {
    tab: 'credentials',
    hash: '#credentials/abc-123',
  });
  assert.deepEqual(legacyWalletHashTarget('#credentials/a/b', TABS), {
    tab: 'credentials',
    hash: '#credentials/a/b',
  });
});

test('a trailing slash is still a bare tab hash', () => {
  assert.deepEqual(legacyWalletHashTarget('#skills/', TABS), { tab: 'skills', hash: '' });
});

test('an empty or unknown hash is left alone', () => {
  assert.equal(legacyWalletHashTarget('', TABS), null);
  assert.equal(legacyWalletHashTarget('#', TABS), null);
  assert.equal(legacyWalletHashTarget('#portfolio', TABS), null);
  assert.equal(legacyWalletHashTarget('#Skills', TABS), null);
});

test('a credential share link opens the credentials tab on that card', () => {
  assert.equal(
    credentialShareHref('https://app.example', '/dashboard/student/skills-wallet', 'id 1'),
    'https://app.example/dashboard/student/skills-wallet?tab=credentials#credentials/id%201'
  );
});
