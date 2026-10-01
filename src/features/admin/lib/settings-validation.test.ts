import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tabErrorCounts } from '@/components/data-display/tab-errors';
import { accountFieldErrors } from './settings-validation';

const valid = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  dob: '1990-01-01',
};

test('a complete account has no field errors', () => {
  assert.deepEqual(accountFieldErrors(valid), {});
});

test('names each failing field, in form order', () => {
  const errors = accountFieldErrors({ ...valid, first_name: '  ', email: 'ada@', dob: '' });
  assert.deepEqual(Object.keys(errors), ['first_name', 'email', 'dob']);
});

test('every failing field counts against the Profile tab', () => {
  const errors = accountFieldErrors({ ...valid, last_name: '', username: '' });
  assert.deepEqual(
    tabErrorCounts(Object.keys(errors), () => 'profile'),
    { profile: 2 }
  );
});
