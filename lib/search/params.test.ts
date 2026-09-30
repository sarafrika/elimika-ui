import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sortUnlessQuery, withQ } from './params';

test('withQ adds a trimmed term of two or more characters', () => {
  assert.deepEqual(withQ({ status: 'published' }, '  java '), { status: 'published', q: 'java' });
});

test('withQ leaves the params alone for empty or one-character terms', () => {
  const params = { status: 'draft' };
  assert.equal(withQ(params, ''), params);
  assert.equal(withQ(params, ' j '), params);
  assert.equal(withQ(params, undefined), params);
});

test('sortUnlessQuery drops the sort only when a term is sent', () => {
  assert.deepEqual(sortUnlessQuery('javsc', ['lastModifiedDate,desc']), undefined);
  assert.deepEqual(sortUnlessQuery('j', ['lastModifiedDate,desc']), ['lastModifiedDate,desc']);
  assert.deepEqual(sortUnlessQuery(null, ['lastModifiedDate,desc']), ['lastModifiedDate,desc']);
});
