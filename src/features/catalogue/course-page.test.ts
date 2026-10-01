import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  availabilityChip,
  classDatesLabel,
  classFeeLabel,
  classFilterCounts,
  courseTabParam,
  dedupeRequirements,
  filterOpenClasses,
  priceFromLabel,
  requirementMeta,
  richTextBullets,
  splitRequirementName,
  splitRequirements,
  toPlainSummary,
  withoutLeadingHeading,
} from './course-page';
import { NO_OPEN_CLASSES, type OpenClassSummary, toCourseOpenClasses } from './open-classes';

const klass = (uuid: string, extra: Partial<OpenClassSummary> = {}): OpenClassSummary => ({
  uuid,
  ...extra,
});

test('priceFromLabel quotes the lowest open-class fee', () => {
  assert.equal(
    priceFromLabel({
      price_from: 5000,
      currency_code: 'KES',
      open_class_count: 3,
      classes: [klass('a', { fee: 5000 })],
    }),
    'KES 5,000'
  );
});

test('priceFromLabel never quotes without an open class', () => {
  assert.equal(priceFromLabel(NO_OPEN_CLASSES), null);
  assert.equal(
    priceFromLabel({ price_from: 0, currency_code: 'KES', open_class_count: 0, classes: [] }),
    null
  );
});

test('priceFromLabel says Free only when a real class charges nothing', () => {
  assert.equal(
    priceFromLabel({
      price_from: 0,
      currency_code: 'KES',
      open_class_count: 1,
      classes: [klass('a', { fee: 0 })],
    }),
    'Free'
  );
  assert.equal(
    priceFromLabel({
      price_from: 0,
      currency_code: 'KES',
      open_class_count: 1,
      classes: [klass('a', { fee: 4000 })],
    }),
    null
  );
  assert.equal(
    priceFromLabel({
      price_from: 0,
      currency_code: 'KES',
      open_class_count: 1,
      classes: [klass('a', { fee: 0, availability: 'FULL' }), klass('b', { fee: 4000 })],
    }),
    null
  );
});

test('classFeeLabel hides a missing fee', () => {
  assert.equal(classFeeLabel({ fee: null }), null);
  assert.equal(classFeeLabel({ fee: 40000, currency_code: 'KES' }), 'KES 40,000');
});

test('filterOpenClasses filters by format, lists hybrid under both, cheapest first', () => {
  const rows = [
    klass('a', { location_type: 'IN_PERSON', fee: 40000 }),
    klass('b', { location_type: 'ONLINE', fee: 2000 }),
    klass('c', { location_type: 'HYBRID', fee: null }),
    klass('d', { location_type: 'IN_PERSON', fee: 5000 }),
    klass('e', { location_type: 'IN_PERSON', fee: 100, availability: 'FULL' }),
  ];
  assert.deepEqual(
    filterOpenClasses(rows, 'all').map(row => row.uuid),
    ['b', 'd', 'a', 'c', 'e']
  );
  assert.deepEqual(
    filterOpenClasses(rows, 'in-person').map(row => row.uuid),
    ['d', 'a', 'c', 'e']
  );
  assert.deepEqual(
    filterOpenClasses(rows, 'online').map(row => row.uuid),
    ['b', 'c']
  );
  assert.deepEqual(classFilterCounts(rows), { all: 5, 'in-person': 4, online: 2 });
});

test('courseTabParam parses known tabs and falls back to the overview', () => {
  assert.equal(courseTabParam.parse('classes'), 'classes');
  assert.equal(courseTabParam.parse('similar'), 'similar');
  assert.equal(courseTabParam.parse('nope'), 'overview');
  assert.equal(courseTabParam.parse(null), 'overview');
  assert.equal(courseTabParam.serialise('overview'), undefined);
  assert.equal(courseTabParam.serialise('syllabus'), 'syllabus');
});

test('dedupeRequirements drops exact repeats, ignoring case and spacing', () => {
  const rows = [
    {
      name: 'PPE suit',
      provided_by: 'student',
      requirement_type: 'material',
      quantity: 1,
      unit: 'kits',
    },
    {
      name: 'Measuring tools  set',
      provided_by: 'student',
      requirement_type: 'equipment',
      quantity: 1,
    },
    {
      name: 'ppe SUIT',
      provided_by: 'student',
      requirement_type: 'material',
      quantity: 1,
      unit: 'kits',
    },
    {
      name: 'Measuring tools set',
      provided_by: 'student',
      requirement_type: 'equipment',
      quantity: 1,
    },
    {
      name: 'PPE suit',
      provided_by: 'organisation',
      requirement_type: 'material',
      quantity: 1,
      unit: 'kits',
    },
    { name: '  ', provided_by: 'student' },
  ];
  assert.equal(dedupeRequirements(rows).length, 3);
  const { provided, bring } = splitRequirements(rows);
  assert.equal(provided.length, 1);
  assert.equal(bring.length, 2);
});

test('requirementMeta drops the "other" unit', () => {
  assert.equal(
    requirementMeta({ requirement_type: 'facility', quantity: 10, unit: 'other' }),
    'Facility · 10'
  );
  assert.equal(
    requirementMeta({ requirement_type: 'equipment', quantity: 50, unit: 'sets' }),
    'Equipment · 50 sets'
  );
});

test('availability and dates read honestly', () => {
  assert.deepEqual(availabilityChip({ availability: 'OPEN' }), { label: 'Open', tone: 'neutral' });
  assert.deepEqual(availabilityChip({ availability: 'FEW_LEFT' }), {
    label: 'Few seats left',
    tone: 'warning',
  });
  assert.deepEqual(availabilityChip({ availability: 'FULL' }), { label: 'Full', tone: 'muted' });
  assert.equal(availabilityChip({}), null);
  assert.equal(classDatesLabel({}), 'Dates to be announced');
  const today = new Date('2026-10-01T00:00:00Z');
  assert.equal(classDatesLabel({ starts_on: '2026-08-28' }, today), 'Started 28 Aug 2026');
  assert.equal(classDatesLabel({ starts_on: '2026-10-12' }, today), 'From 12 Oct 2026');
  assert.equal(
    classDatesLabel({ starts_on: '2026-10-12', ends_on: '2026-12-20' }),
    '12 Oct – 20 Dec 2026'
  );
});

test('rich text becomes a plain summary and bullets', () => {
  const html =
    '<p></p><h3>Course Description</h3><p>Learn <strong>gardening</strong> &amp; more.</p><p>No experience needed.</p>';
  assert.equal(toPlainSummary(html), 'Learn gardening & more. No experience needed.');
  assert.equal(toPlainSummary('<h3>Only a heading</h3>'), 'Only a heading');
  assert.deepEqual(
    richTextBullets(
      '<h3>Outcomes</h3><p>Learners will:</p><ul><li><p>Plant</p></li><li><p>Prune</p></li></ul>'
    ),
    ['Plant', 'Prune']
  );
});

test('toCourseOpenClasses reads the envelope and rejects other shapes', () => {
  const parsed = toCourseOpenClasses({
    success: true,
    data: {
      price_from: 5000,
      currency_code: 'KES',
      open_class_count: 1,
      classes: [
        {
          uuid: 'a',
          location_type: 'in_person',
          fee: 5000,
          availability: 'few_left',
          seats_left: 3,
        },
        { title: 'no uuid' },
      ],
    },
  });
  assert.equal(parsed?.classes.length, 1);
  assert.equal(parsed?.classes[0]?.location_type, 'IN_PERSON');
  assert.equal(parsed?.classes[0]?.availability, 'FEW_LEFT');
  assert.equal('seats_left' in (parsed?.classes[0] ?? {}), false);
  assert.equal(toCourseOpenClasses({ data: {} }), null);
  assert.equal(toCourseOpenClasses(null), null);
});

test('splitRequirementName separates the short name from what it includes', () => {
  assert.deepEqual(splitRequirementName('Propagation materials set – Seed trays, pots.'), {
    title: 'Propagation materials set',
    detail: 'Seed trays, pots.',
  });
  assert.deepEqual(splitRequirementName('Gardening gloves'), {
    title: 'Gardening gloves',
    detail: '',
  });
});

test('withoutLeadingHeading drops only the opening heading', () => {
  assert.equal(
    withoutLeadingHeading('<p></p><h3>Course Description</h3><p>Body</p><h3>Later</h3>'),
    '<p>Body</p><h3>Later</h3>'
  );
  assert.equal(withoutLeadingHeading('<p>Body</p><h3>Later</h3>'), '<p>Body</p><h3>Later</h3>');
});
