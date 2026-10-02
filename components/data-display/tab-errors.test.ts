import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  errorCountLabel,
  errorPaths,
  firstTabError,
  tabErrorCounts,
  tabForField,
} from './tab-errors';

type Tab = 'profile' | 'contact' | 'extra';

const map = {
  first_name: 'profile',
  last_name: 'profile',
  email: 'contact',
  address: 'contact',
  'address.notes': 'extra',
  links: 'extra',
} as const satisfies Record<string, Tab>;

test('flattens a react-hook-form error tree into dotted paths, in order', () => {
  const errors = {
    first_name: { type: 'too_small', message: 'Required', ref: { name: 'first_name' } },
    address: {
      city: { type: 'required', message: 'City is required' },
      notes: { type: 'too_big', message: 'Too long' },
    },
    links: [undefined, { url: { type: 'invalid_string', message: 'Bad URL' } }],
  };
  assert.deepEqual(errorPaths(errors), [
    'first_name',
    'address.city',
    'address.notes',
    'links.1.url',
  ]);
});

test('reports a field array’s own error against the array', () => {
  const errors = {
    links: Object.assign([{ url: { type: 'required', message: 'x' } }], {
      root: { type: 'too_small', message: 'Add a link' },
    }),
  };
  assert.deepEqual(errorPaths(errors).sort(), ['links', 'links.0.url']);
  assert.deepEqual(errorPaths(null), []);
});

test('maps a path to its tab by the longest matching prefix', () => {
  assert.equal(tabForField('first_name', map), 'profile');
  assert.equal(tabForField('address.city', map), 'contact');
  assert.equal(tabForField('address.notes', map), 'extra');
  assert.equal(tabForField('links.3.url', map), 'extra');
  // A prefix only counts at a dot boundary.
  assert.equal(tabForField('emailing', map), null);
  assert.equal(tabForField('unknown', map), null);
  assert.equal(
    tabForField('anything', path => (path.startsWith('any') ? 'extra' : null)),
    'extra'
  );
});

test('counts errors per tab and leaves clean tabs out', () => {
  assert.deepEqual(tabErrorCounts(['first_name', 'last_name', 'address.city', 'stray'], map), {
    profile: 2,
    contact: 1,
  });
  assert.deepEqual(tabErrorCounts([], map), {});
});

test('a failed save lands on the first erroring tab in tab order, not error order', () => {
  const order: Tab[] = ['profile', 'contact', 'extra'];
  assert.deepEqual(firstTabError(['links.0.url', 'email', 'address.city'], order, map), {
    tab: 'contact',
    field: 'email',
  });
  assert.deepEqual(firstTabError(['last_name', 'first_name'], order, map), {
    tab: 'profile',
    field: 'last_name',
  });
  assert.equal(firstTabError(['stray'], order, map), null);
});

test('labels the count for assistive tech', () => {
  assert.equal(errorCountLabel(1), '1 error');
  assert.equal(errorCountLabel(2), '2 errors');
});
