import assert from 'node:assert/strict';
import test from 'node:test';
import { programMinimumTrainingFee } from './program-training-fee';

test('uses the programme configured training fee directly', () => {
  assert.equal(programMinimumTrainingFee({ price: 750 }), 750);
});

test('preserves a zero fee without substituting member-course fees', () => {
  assert.equal(programMinimumTrainingFee({ price: 0 }), 0);
});

test('an unset programme fee has no course-derived fallback', () => {
  assert.equal(programMinimumTrainingFee({ price: null }), null);
  assert.equal(programMinimumTrainingFee({}), null);
  assert.equal(programMinimumTrainingFee(undefined), null);
});
