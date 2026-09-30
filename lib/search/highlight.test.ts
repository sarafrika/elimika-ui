import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHighlight } from './highlight';

test('splits on em tags', () => {
  assert.deepEqual(parseHighlight('<em>Astro</em>nomy 101'), [
    { text: 'Astro', match: true },
    { text: 'nomy 101', match: false },
  ]);
});

test('keeps other markup as text', () => {
  assert.deepEqual(parseHighlight('<script>x</script> <em>y</em>'), [
    { text: '<script>x</script> ', match: false },
    { text: 'y', match: true },
  ]);
});

test('leaves an unbalanced tag as written', () => {
  assert.deepEqual(parseHighlight('a <em>b'), [{ text: 'a <em>b', match: false }]);
});

test('handles empty input', () => {
  assert.deepEqual(parseHighlight(undefined), []);
  assert.deepEqual(parseHighlight(''), []);
});
