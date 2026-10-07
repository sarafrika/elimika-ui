import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  catalogPriceOptions,
  catalogResultCount,
  matchesCatalogContentType,
  matchesCatalogPrice,
} from './catalog-filters';

const paidCourses = Array.from({ length: 7 }, (_, index) => ({
  id: `course-${index}`,
  kind: 'course' as const,
  // The legacy price/is_free disagree with the actual training fee.
  price: 0,
  is_free: true,
  minimum_training_fee: 100 + index,
  minimumRate: 100 + index,
}));
const program = { id: 'program-1', kind: 'program' as const, minimumRate: 500 };
const catalogue = [...paidCourses, program];

test('all content includes seven courses and one program, with separate type filters', () => {
  assert.equal(catalogue.filter(item => matchesCatalogContentType(item, 'all-courses')).length, 8);
  assert.deepEqual(
    catalogue.filter(item => matchesCatalogContentType(item, 'short-courses')),
    paidCourses
  );
  assert.deepEqual(
    catalogue.filter(item => matchesCatalogContentType(item, 'programs')),
    [program]
  );
  assert.equal(catalogResultCount(catalogue), 8);
  assert.equal(catalogResultCount(catalogue, 7), 8);
  assert.equal(catalogResultCount(paidCourses, 7), 7);
  assert.equal(catalogResultCount([program]), 1);
});

test('server course totals include filtered programs without counting hydrated courses twice', () => {
  assert.equal(catalogResultCount(catalogue, 25), 26);
  assert.equal(catalogResultCount(paidCourses, 25), 25);
});

test('positive minimum training fees count and filter as paid despite legacy free flags', () => {
  assert.deepEqual(catalogPriceOptions(paidCourses), [
    { value: 'free', label: 'Free', count: 0 },
    { value: 'paid', label: 'Paid', count: 7 },
  ]);
  assert.equal(catalogue.filter(item => matchesCatalogPrice(item, 'paid')).length, 8);
  assert.equal(catalogue.filter(item => matchesCatalogPrice(item, 'free')).length, 0);
});

test('zero and missing fees are free and program prices contribute to the same counts', () => {
  const items = [
    ...paidCourses,
    program,
    { kind: 'course' as const, minimumRate: 0 },
    { kind: 'program' as const },
  ];
  assert.deepEqual(catalogPriceOptions(items), [
    { value: 'free', label: 'Free', count: 2 },
    { value: 'paid', label: 'Paid', count: 8 },
  ]);
  assert.equal(items.filter(item => matchesCatalogPrice(item, 'all')).length, 10);
});
