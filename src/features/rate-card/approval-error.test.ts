import assert from 'node:assert/strict';
import test from 'node:test';
import { approvalErrorMessage } from './approval-error';

const first = '123c52a8-8466-43de-bb00-96ce1e9d8d97';
const second = '788882f5-e677-47f8-96b7-f1944c1b27f3';
const prefix = 'Applicant must be approved to deliver all courses in the program before approval. Missing approvals for courses: ';
const fallback = 'Could not approve this application.';

test('replaces all missing course UUIDs with their names in one lookup', async () => {
  let lookups = 0;
  const message = await approvalErrorMessage(
    { message: `${prefix}${first}, ${second}`, error: 'Bad Request' },
    fallback,
    async ids => {
      lookups += 1;
      assert.deepEqual(ids, [first, second]);
      return { [first]: 'Piano basics', [second]: 'Music theory' };
    }
  );
  assert.equal(message, `${prefix}Piano basics, Music theory`);
  assert.equal(lookups, 1);
});

test('keeps unresolved identifiers and handles repeated uppercase identifiers', async () => {
  const message = await approvalErrorMessage(
    { error: `${prefix}${first.toUpperCase()}, ${second}, ${first}` },
    fallback,
    async ids => {
      assert.deepEqual(ids, [first, second]);
      return { [first]: 'Piano basics' };
    }
  );
  assert.equal(message, `${prefix}Piano basics, ${second}, Piano basics`);
});

test('preserves the approval error when the course lookup fails', async () => {
  const original = `${prefix}${first}`;
  assert.equal(
    await approvalErrorMessage({ message: original }, fallback, async () => {
      throw new Error('Lookup unavailable');
    }),
    original
  );
});

test('does not request courses for unrelated or malformed errors', async () => {
  for (const original of ['Permission denied', `${prefix}no identifiers provided`]) {
    assert.equal(
      await approvalErrorMessage({ message: original }, fallback, async () => {
        assert.fail('Unexpected course lookup');
      }),
      original
    );
  }
});
